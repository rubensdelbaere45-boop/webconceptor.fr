"""
Service d'enrichissement de prospects via Scrapling.
Déployé sur Railway. Appelé par find/route.ts en fallback
quand les scrapers Node.js échouent (Cloudflare, anti-bot, etc.).

Endpoint principal : POST /enrich
  Body  : { "url": "https://...", "tasks": ["emails", "about", "photos"] }
  Auth  : Bearer <SCRAPLING_SECRET>
  Return: { "emails": [...], "about": "...", "photos": [...] }
"""

from __future__ import annotations

import os
import re
from typing import Optional
from urllib.parse import urljoin, urlparse

from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

# ─── Config ───────────────────────────────────────────────────────────────────

SECRET = os.environ.get("SCRAPLING_SECRET", "")
FETCH_TIMEOUT = int(os.environ.get("FETCH_TIMEOUT", "15"))
STEALTH_TIMEOUT = int(os.environ.get("STEALTH_TIMEOUT", "30"))

# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(title="Scrapling Enrichment Service")
bearer = HTTPBearer(auto_error=True)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> str:
    if SECRET and credentials.credentials != SECRET:
        raise HTTPException(status_code=401, detail="Token invalide")
    return credentials.credentials


# ─── Schemas ──────────────────────────────────────────────────────────────────

class EnrichRequest(BaseModel):
    url: str
    tasks: list[str] = ["emails", "about", "photos"]


class EnrichResponse(BaseModel):
    emails: list[str] = []
    about: Optional[str] = None
    photos: list[str] = []
    used_stealth: bool = False
    error: Optional[str] = None


# ─── Helpers ──────────────────────────────────────────────────────────────────

EMAIL_RE = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b')
MAILTO_RE = re.compile(r'mailto:([^"\'\\s?#&]+)', re.IGNORECASE)
BAD_DOMAIN_RE = re.compile(
    r'(wix|wixstatic|sentry|example|test|placeholder|noreply|no-reply|unsubscribe|spam)', re.IGNORECASE
)
PERSONAL_RE = re.compile(
    r'@(gmail|outlook|hotmail|yahoo|live|free|orange|laposte|sfr|wanadoo|bbox|icloud|me|aol|protonmail|proton)\.',
    re.IGNORECASE,
)
SOCIAL_HOST_RE = re.compile(
    r'(tripadvisor|instagram|fbcdn|facebook|twimg|twitter|youtube|ytimg|pinterest|linkedin|yelp|trustpilot|gstatic|googletagmanager|googleusercontent|doubleclick|adservice)',
    re.IGNORECASE,
)
LOGO_PATH_RE = re.compile(
    r'(logo|icon|favicon|sprite|avatar|loader|spinner|button|btn|arrow|chevron|star|flag|badge)',
    re.IGNORECASE,
)


def _fetch_with_cloakbrowser(url: str) -> Optional[str]:
    """
    Fallback ultime : utilise CloakBrowser (Chromium stealth source-level).
    Passe Cloudflare Turnstile, FingerprintJS, BrowserScan où StealthyFetcher échoue.
    Plus lent (~5s) mais quasi-imparable.
    """
    try:
        from cloakbrowser import launch  # type: ignore
        browser = launch(headless=True)
        page = browser.new_page()
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        # Attend que le contenu se charge (Cloudflare peut prendre 3-5s)
        page.wait_for_timeout(3000)
        html = page.content()
        browser.close()
        return html if html and len(html) > 2000 else None
    except Exception:
        return None


def fetch_html(url: str, force_stealth: bool = False) -> tuple[Optional[str], bool]:
    """
    Retourne (html, used_stealth).
    Cascade : Fetcher rapide → StealthyFetcher Scrapling → CloakBrowser (Cloudflare).

    force_stealth=True → saute Fetcher rapide et va direct en stealth
    (utile pour sites avec Cloudflare comme Pages Jaunes).
    """
    # Détection automatique : domaines connus pour Cloudflare → force stealth
    if not force_stealth and any(s in url.lower() for s in ["pagesjaunes.fr", "societe.com", "infogreffe.fr"]):
        force_stealth = True

    if not force_stealth:
        # Tentative 1 : HTTP rapide avec spoofing TLS
        try:
            from scrapling.fetchers import Fetcher  # type: ignore
            page = Fetcher.get(url, stealthy_headers=True, timeout=FETCH_TIMEOUT)
            if page and page.status == 200:
                html_str = str(page.html)
                # Détection page Cloudflare (challenge JS) → fallback stealth
                if "challenge-platform" not in html_str and "cf-challenge" not in html_str:
                    return html_str, False
        except Exception:
            pass

    # Tentative 2 : navigateur stealth Scrapling
    try:
        from scrapling.fetchers import StealthyFetcher  # type: ignore
        page = StealthyFetcher.fetch(
            url,
            headless=True,
            timeout=STEALTH_TIMEOUT,
            network_idle=True,
            humanize=True,  # mouse jitter pour bypass anti-bot
        )
        if page and page.status == 200:
            html_str = str(page.html)
            if len(html_str) > 2000 and "challenge-platform" not in html_str:
                return html_str, True
    except Exception:
        pass

    # Tentative 3 : CloakBrowser (Chromium stealth source-level — bypass Cloudflare Turnstile)
    cloak_html = _fetch_with_cloakbrowser(url)
    if cloak_html:
        return cloak_html, True

    return None, False


def strip_html(html: str) -> str:
    text = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '', html, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'&nbsp;', ' ', text)
    text = re.sub(r'&amp;', '&', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def score_email(email: str, site_domain: str) -> int:
    """Score de priorité : 0 = personnel (patron), 1 = nominatif@site, 2 = générique@site, 3 = autre."""
    e = email.lower()
    if PERSONAL_RE.search(e):
        return 0
    if e.endswith('@' + site_domain):
        local = e.split('@')[0]
        generic = re.compile(r'^(contact|info|hello|bonjour|reservation|reservations|commande|service|admin|webmaster|noreply|accueil)$', re.IGNORECASE)
        return 2 if generic.match(local) else 1
    return 3


def extract_emails(html: str, site_domain: str) -> list[str]:
    found: dict[str, int] = {}

    for m in MAILTO_RE.finditer(html):
        email = m.group(1).lower().strip().rstrip('.')
        if not BAD_DOMAIN_RE.search(email) and re.match(r'^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$', email):
            sc = score_email(email, site_domain)
            if email not in found or sc < found[email]:
                found[email] = sc

    for email in EMAIL_RE.findall(html):
        email = email.lower().strip().rstrip('.')
        if not BAD_DOMAIN_RE.search(email):
            sc = score_email(email, site_domain)
            if email not in found or sc < found[email]:
                found[email] = sc

    return [e for e, _ in sorted(found.items(), key=lambda x: x[1])][:5]


def extract_photos(html: str, base_url: str) -> list[str]:
    photos: list[str] = []
    seen: set[str] = set()

    # og:image en priorité
    og = re.search(r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\']', html, re.IGNORECASE)
    if not og:
        og = re.search(r'<meta[^>]*content=["\']([^"\']+)["\'][^>]*property=["\']og:image["\']', html, re.IGNORECASE)
    if og:
        url = urljoin(base_url, og.group(1))
        if url not in seen:
            seen.add(url)
            photos.append(url)

    img_re = re.compile(r'<img[^>]+src=["\']([^"\']+\.(?:jpg|jpeg|png|webp))["\']', re.IGNORECASE)
    for m in img_re.finditer(html):
        if len(photos) >= 5:
            break
        raw = m.group(1)
        url = urljoin(base_url, raw)
        parsed = urlparse(url)
        if SOCIAL_HOST_RE.search(parsed.netloc):
            continue
        path = parsed.path.lower()
        if LOGO_PATH_RE.search(path) or re.search(r'\.(svg|ico|gif)$', path):
            continue
        if re.search(r'\d{1,3}x\d{1,3}', path):
            continue
        if url not in seen:
            seen.add(url)
            photos.append(url)

    return photos[:5]


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/enrich", response_model=EnrichResponse)
def enrich(req: EnrichRequest, _token: str = Depends(verify_token)) -> EnrichResponse:
    parsed = urlparse(req.url)
    if parsed.scheme not in ("http", "https"):
        return EnrichResponse(error="Schéma URL invalide (http/https uniquement)")

    site_domain = (parsed.hostname or "").lstrip("www.")
    base_url = f"{parsed.scheme}://{parsed.netloc}"

    result = EnrichResponse()
    used_stealth = False
    fetched: dict[str, str] = {}  # url → html (cache pour éviter les doubles requêtes)

    def get_html(url: str) -> Optional[str]:
        nonlocal used_stealth
        if url not in fetched:
            html, stealth = fetch_html(url)
            if html:
                fetched[url] = html
                used_stealth = used_stealth or stealth
        return fetched.get(url)

    # ── Emails ──────────────────────────────────────────────────────────────
    if "emails" in req.tasks:
        email_paths = [
            req.url,
            base_url + "/contact",
            base_url + "/contact-us",
            base_url + "/nous-contacter",
            base_url + "/mentions-legales",
            base_url + "/mentions",
            base_url + "/a-propos",
            base_url + "/about",
            base_url + "/equipe",
        ]
        all_emails: dict[str, int] = {}
        for url in email_paths:
            if len(all_emails) >= 3:
                break
            html = get_html(url)
            if html:
                for email in extract_emails(html, site_domain):
                    sc = score_email(email, site_domain)
                    if email not in all_emails or sc < all_emails[email]:
                        all_emails[email] = sc

        result.emails = [e for e, _ in sorted(all_emails.items(), key=lambda x: x[1])][:3]

    # ── About text ──────────────────────────────────────────────────────────
    if "about" in req.tasks:
        about_paths = [
            base_url + "/a-propos",
            base_url + "/apropos",
            base_url + "/about",
            base_url + "/about-us",
            base_url + "/notre-histoire",
            base_url + "/histoire",
            base_url + "/qui-sommes-nous",
            req.url,
        ]
        for url in about_paths:
            html = get_html(url)
            if html:
                text = strip_html(html)
                if len(text) >= 200:
                    result.about = text[:4000]
                    break

    # ── Photos ──────────────────────────────────────────────────────────────
    if "photos" in req.tasks:
        html = get_html(req.url)
        if html:
            result.photos = extract_photos(html, base_url)

    result.used_stealth = used_stealth
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# /scrape-pj — Scrape massif Pages Jaunes (artisans, restaurants, etc.)
# ═══════════════════════════════════════════════════════════════════════════════

class ScrapePjRequest(BaseModel):
    activity: str   # ex: "plombier", "menuisier", "restaurant"
    location: str   # ex: "Paris", "75001", "Île-de-France"
    pages: int = 3  # nombre de pages PJ à scraper (1 page = ~20 résultats)


class ScrapedBusiness(BaseModel):
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None


class ScrapePjResponse(BaseModel):
    results: list[ScrapedBusiness] = []
    pages_scraped: int = 0
    used_stealth: bool = False
    error: Optional[str] = None


@app.post("/scrape-pj", response_model=ScrapePjResponse)
def scrape_pj(req: ScrapePjRequest, _: str = Depends(verify_token)):
    """
    Scrape Pages Jaunes pour une activité + localisation.
    Utilise StealthyFetcher (bypass Cloudflare).
    Retourne jusqu'à 60 résultats (3 pages × 20).
    """
    from urllib.parse import quote

    activity_q = quote(req.activity[:80])
    location_q = quote(req.location[:60])

    all_results: list[ScrapedBusiness] = []
    seen_names: set[str] = set()
    used_stealth = False
    pages_done = 0

    for page in range(1, min(req.pages, 5) + 1):
        page_param = f"&page={page}" if page > 1 else ""
        url = f"https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui={activity_q}&ou={location_q}{page_param}"

        html, stealth = fetch_html(url)
        used_stealth = used_stealth or stealth

        if not html or len(html) < 2000:
            break  # Cloudflare ou pas de résultats

        pages_done += 1
        # Parse les blocs <article class="bi ...">
        # On utilise des regex défensives qui tolèrent les variations Pages Jaunes
        article_blocks = re.split(r'<article[^>]+class="[^"]*\bbi\b', html, flags=re.IGNORECASE)

        for i in range(1, len(article_blocks)):
            block = article_blocks[i]

            # Nom
            name_match = (
                re.search(r'class="[^"]*denomination[^"]*"[^>]*title="([^"]+)"', block, re.IGNORECASE)
                or re.search(r'<h3[^>]*>([^<]+)</h3>', block, re.IGNORECASE)
                or re.search(r'itemprop="name"[^>]*>([^<]+)<', block, re.IGNORECASE)
            )
            name = _decode_entities(name_match.group(1)).strip() if name_match else ""
            if not name or len(name) < 2 or name in seen_names:
                continue
            seen_names.add(name)

            # Adresse
            street_match = (
                re.search(r'itemprop="streetAddress"[^>]*>([^<]+)<', block, re.IGNORECASE)
                or re.search(r'class="[^"]*address[^"]*"[^>]*>\s*<[^>]*>([^<]+)<', block, re.IGNORECASE)
            )
            cp_match = (
                re.search(r'itemprop="postalCode"[^>]*>([^<]+)<', block, re.IGNORECASE)
                or re.search(r'>(\d{5})\s+[A-ZÀ-ÿ]', block)
            )
            city_match = re.search(r'itemprop="addressLocality"[^>]*>([^<]+)<', block, re.IGNORECASE)

            street = _decode_entities(street_match.group(1)).strip() if street_match else ""
            postal_code = cp_match.group(1).strip() if cp_match else ""
            city = _decode_entities(city_match.group(1)).strip() if city_match else ""
            address = " ".join(filter(None, [street, postal_code, city]))

            # Téléphone
            phone_match = (
                re.search(r'class="[^"]*(?:num-tel|coord-numero)[^"]*"[^>]*>\s*([^<]+)', block, re.IGNORECASE)
                or re.search(r'itemprop="telephone"[^>]*>([^<]+)<', block, re.IGNORECASE)
                or re.search(r'data-phone="([^"]+)"', block, re.IGNORECASE)
            )
            phone = _clean_phone(_decode_entities(phone_match.group(1))) if phone_match else ""

            # Site web
            website_match = (
                re.search(r'href="([^"]+)"[^>]*class="[^"]*(?:site-internet|website-link|lvs-link)', block, re.IGNORECASE)
                or re.search(r'itemprop="url"[^>]*href="([^"]+)"', block, re.IGNORECASE)
            )
            website = _decode_entities(website_match.group(1)).strip() if website_match else ""
            if website and not re.match(r'^https?://', website, re.IGNORECASE):
                website = ""

            all_results.append(ScrapedBusiness(
                name=name,
                address=address or None,
                city=city or None,
                postal_code=postal_code or None,
                phone=phone or None,
                website=website or None,
            ))

            if len(all_results) >= 100:
                break

        if len(all_results) >= 100:
            break

    return ScrapePjResponse(
        results=all_results,
        pages_scraped=pages_done,
        used_stealth=used_stealth,
    )


def _decode_entities(s: str) -> str:
    """Décode les entités HTML basiques."""
    if not s:
        return ""
    return (
        s.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", '"')
        .replace("&#39;", "'")
        .replace("&apos;", "'")
        .replace("&nbsp;", " ")
    )


def _clean_phone(raw: str) -> str:
    """Nettoie un numéro de téléphone."""
    if not raw:
        return ""
    cleaned = re.sub(r"\s+", " ", raw)
    cleaned = re.sub(r"[^\d +.\-()]", "", cleaned)
    return cleaned.strip()[:20]
