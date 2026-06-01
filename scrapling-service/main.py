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


def fetch_html(url: str) -> tuple[Optional[str], bool]:
    """
    Retourne (html, used_stealth).
    Essaie Fetcher (rapide) d'abord, puis StealthyFetcher si échec/Cloudflare.
    """
    # Tentative 1 : HTTP rapide avec spoofing TLS
    try:
        from scrapling.fetchers import Fetcher  # type: ignore
        page = Fetcher.get(url, stealthy_headers=True, timeout=FETCH_TIMEOUT)
        if page and page.status == 200:
            return str(page.html), False
    except Exception:
        pass

    # Tentative 2 : navigateur stealth (bypass Cloudflare)
    try:
        from scrapling.fetchers import StealthyFetcher  # type: ignore
        page = StealthyFetcher.fetch(url, headless=True, timeout=STEALTH_TIMEOUT, network_idle=True)
        if page and page.status == 200:
            return str(page.html), True
    except Exception:
        pass

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
