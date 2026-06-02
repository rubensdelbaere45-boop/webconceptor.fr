/**
 * WebConceptor Stitch Generation Server
 *
 * Serveur Node.js sur Railway qui gère :
 * - Rotation automatique de 6 clés Stitch
 * - Détection clés mortes vs fonctionnelles
 * - Fallback OpenRouter (Gemini) si toutes les clés échouent
 * - Endpoint POST /generate pour Vercel/N8N
 * - Endpoint GET /health pour monitoring
 *
 * Port : process.env.PORT || 3001
 */

import http from 'node:http'

// ── Clés Stitch ──────────────────────────────────────────────────
// Seules les clés 1, 2, 3 fonctionnent pour generate_screen_from_text
// Les clés 4, 5, 6 ont des erreurs OAuth sur generate (marchent pour create_project seulement)
const STITCH_KEYS = [
  process.env.STITCH_API_KEY,    // clé 1 — confirmée ✅
  process.env.STITCH_API_KEY_2,  // clé 2 — confirmée ✅
  process.env.STITCH_API_KEY_3,  // clé 3 — confirmée ✅
].filter(Boolean)

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || ''
const SERVER_SECRET = process.env.STITCH_SERVER_SECRET || ''
const PORT = parseInt(process.env.PORT || '3001')

// Track des clés mortes (évite de retenter)
const deadKeys = new Set()
let keyIndex = 0

function getNextAliveKey() {
  const alive = STITCH_KEYS.filter(k => !deadKeys.has(k))
  if (!alive.length) return null
  keyIndex = (keyIndex + 1) % alive.length
  return alive[keyIndex]
}

// ── Stitch via process enfant (contourne le cache connexion MCP du SDK) ──
import { execFile } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

// Crée le script worker au démarrage
const WORKER_SCRIPT = `
import { stitch } from '@google/stitch-sdk'
let input = ''
for await (const chunk of process.stdin) input += chunk
const { prompt } = JSON.parse(input)
try {
  const project = await stitch.createProject('WC-' + Date.now())
  const screen = await project.generate(prompt)
  let htmlUrl = null
  for (let i = 0; i < 5; i++) {
    htmlUrl = await screen.getHtml()
    if (htmlUrl) break
    await new Promise(r => setTimeout(r, 4000))
  }
  if (!htmlUrl) { console.log(JSON.stringify({ok:false,error:'HTML_EMPTY'})); process.exit(0) }
  const res = await fetch(htmlUrl)
  const html = await res.text()
  console.log(JSON.stringify({ok:true,html}))
} catch(e) {
  console.log(JSON.stringify({ok:false,error:e.message?.slice(0,150)}))
}
`
try { mkdirSync('/tmp/stitch-worker', { recursive: true }) } catch {}
writeFileSync('/tmp/stitch-worker/worker.mjs', WORKER_SCRIPT)

async function generateViaStitch(prompt) {
  const key = getNextAliveKey()
  if (!key) throw new Error('ALL_KEYS_DEAD')

  return new Promise((resolve, reject) => {
    const child = execFile('node', ['/tmp/stitch-worker/worker.mjs'], {
      env: { ...process.env, STITCH_API_KEY: key, NODE_OPTIONS: '' },
      timeout: 120000,
    }, (err, stdout) => {
      try {
        const lines = stdout.trim().split('\n')
        const result = JSON.parse(lines[lines.length - 1])
        if (result.ok && result.html?.length > 500) {
          resolve({ html: result.html, source: 'stitch', key: key.slice(-8) })
        } else {
          reject(new Error(result.error || 'HTML_EMPTY'))
        }
      } catch {
        reject(new Error(err?.message || 'worker crash'))
      }
    })
    child.stdin.write(JSON.stringify({ prompt }))
    child.stdin.end()
  })
}

// ── Fallback OpenRouter (Gemini Flash) ───────────────────────────
async function generateViaOpenRouter(prompt) {
  if (!OPENROUTER_KEY) throw new Error('NO_OPENROUTER_KEY')

  const systemPrompt = `You are an expert web designer. Generate a complete, self-contained HTML page with inline CSS.
The page must be:
- Beautiful, modern, professional
- Mobile-responsive
- Use high-quality placeholder images from unsplash
- All text in French
- Include: hero section, about, services/menu, contact
- White text on dark hero overlay
- Sticky navigation
- Smooth scroll
- Complete <html><head><body> structure
Return ONLY the HTML code, nothing else.`

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 16000,
      temperature: 0.7,
    })
  })

  if (!res.ok) throw new Error(`OpenRouter ${res.status}`)
  const data = await res.json()
  let html = data.choices?.[0]?.message?.content || ''

  // Nettoie les balises markdown si présentes
  html = html.replace(/^```html\n?/i, '').replace(/\n?```$/i, '').trim()

  if (html.length < 500) throw new Error('OPENROUTER_HTML_TOO_SHORT')
  return { html, source: 'openrouter' }
}

// ── Endpoint principal ───────────────────────────────────────────
async function handleGenerate(body) {
  const { prompt, slug } = body
  if (!prompt) return { error: 'prompt requis', status: 400 }

  // Essaie Stitch d'abord (toutes les clés vivantes)
  const aliveKeys = STITCH_KEYS.filter(k => !deadKeys.has(k))
  console.log(`[gen] ${slug || '?'} — ${aliveKeys.length} clés Stitch vivantes`)

  for (let attempt = 0; attempt < Math.min(aliveKeys.length, 3); attempt++) {
    try {
      const result = await generateViaStitch(prompt)
      console.log(`[gen] ✅ Stitch OK — ${result.html.length} chars (clé ...${result.key})`)
      return { ...result, status: 200 }
    } catch (e) {
      const msg = e.message || ''
      console.log(`[gen] ❌ Stitch tentative ${attempt + 1}: ${msg.slice(0, 80)}`)
      if (msg.includes('OAuth') || msg.includes('authentication') || msg.includes('AUTH_FAILED')) {
        // Marque cette clé comme morte
        const currentKey = STITCH_KEYS.find(k => !deadKeys.has(k))
        if (currentKey) {
          deadKeys.add(currentKey)
          console.log(`[gen] 💀 Clé ...${currentKey.slice(-8)} marquée morte (${deadKeys.size}/${STITCH_KEYS.length})`)
        }
      }
    }
  }

  // Fallback OpenRouter
  console.log(`[gen] 🔄 Fallback OpenRouter...`)
  try {
    const result = await generateViaOpenRouter(prompt)
    console.log(`[gen] ✅ OpenRouter OK — ${result.html.length} chars`)
    return { ...result, status: 200 }
  } catch (e) {
    console.log(`[gen] ❌ OpenRouter: ${e.message}`)
    return { error: 'Toutes les sources ont échoué', status: 500 }
  }
}

// ── Serveur HTTP ─────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  // Health
  if (req.url === '/health' || req.url === '/healthz') {
    const alive = STITCH_KEYS.filter(k => !deadKeys.has(k)).length
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'ok',
      stitch_keys_alive: alive,
      stitch_keys_total: STITCH_KEYS.length,
      openrouter: OPENROUTER_KEY ? 'configured' : 'missing',
    }))
    return
  }

  // Status — reset dead keys
  if (req.url === '/reset-keys' && req.method === 'POST') {
    deadKeys.clear()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ reset: true, alive: STITCH_KEYS.length }))
    return
  }

  // Generate
  if (req.url === '/generate' && req.method === 'POST') {
    // Auth
    const authHeader = req.headers.authorization || ''
    if (SERVER_SECRET && authHeader !== `Bearer ${SERVER_SECRET}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Unauthorized' }))
      return
    }

    let body = ''
    for await (const chunk of req) body += chunk
    try {
      const parsed = JSON.parse(body)
      const result = await handleGenerate(parsed)
      res.writeHead(result.status || 200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result))
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: e.message }))
    }
    return
  }

  // Batch nocturne — POST /batch
  if (req.url === '/batch' && req.method === 'POST') {
    const authHeader = req.headers.authorization || ''
    if (SERVER_SECRET && authHeader !== `Bearer ${SERVER_SECRET}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Unauthorized' }))
      return
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ started: true, message: 'Batch nocturne lancé en arrière-plan' }))
    // Lance en background
    runNightBatch().catch(e => console.error('[batch] crash:', e.message))
    return
  }

  // Status batch
  if (req.url === '/batch/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(batchStatus))
    return
  }

  res.writeHead(404)
  res.end('Not Found')
})

// ── Batch nocturne automatique ───────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xmheiewlglvvneeuugvg.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || ''
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const TELEGRAM_CHAT = process.env.TELEGRAM_CHAT_ID || ''

let batchStatus = { running: false, done: 0, errors: 0, total: 0, lastRun: null }

function buildPromptFromProspect(p) {
  const bt = p.business_type || 'business'
  const city = p.city || 'France'
  const rating = p.google_rating ? `${p.google_rating}/5 (${p.google_reviews_count || 0} avis)` : ''
  const about = p.about_scraped ? `Description: "${String(p.about_scraped).slice(0, 250)}"` : ''
  const items = (p.menu_items || []).slice(0, 5).map(m => `• ${m.name}${m.price ? ` — ${m.price}` : ''}`).join('\n')
  return [
    `Design a beautiful professional website for "${p.name}", a ${bt} in ${city}, France.`,
    rating, about,
    '1. HERO — Large WHITE bold title on dark overlay background image. CTA.',
    '2. ABOUT — Warm French local tone, 2-3 paragraphs.',
    items ? `3. SERVICES:\n${items}` : '3. SERVICES — Key offerings as elegant cards.',
    `4. CONTACT — ${p.phone || ''}, ${city}`,
    'REQUIREMENTS: White hero text, sticky nav, all French, modern responsive design.'
  ].filter(Boolean).join('\n')
}

async function sbGet(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  })
  return r.json()
}

async function sbPatch(slug, body) {
  await fetch(`${SUPABASE_URL}/rest/v1/prospects?slug=eq.${slug}`, {
    method: 'PATCH',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(body)
  })
}

async function telegramNotify(msg) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return
  fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text: msg, parse_mode: 'HTML' })
  }).catch(() => {})
}

async function runNightBatch() {
  if (batchStatus.running) { console.log('[batch] Déjà en cours'); return }
  batchStatus = { running: true, done: 0, errors: 0, total: 0, lastRun: new Date().toISOString() }

  // Reset les clés mortes au début de chaque batch
  deadKeys.clear()

  const fields = 'slug,name,city,business_type,google_rating,google_reviews_count,phone,email,about_scraped,menu_items,reviews'
  // Priorité : found d'abord (pas encore contactés), puis opened (upgrade)
  const [found, opened] = await Promise.all([
    sbGet(`prospects?status=eq.found&stitch_generated=eq.false&email=not.is.null&select=${fields}&order=google_rating.desc&limit=100`),
    sbGet(`prospects?status=eq.opened&stitch_generated=eq.false&select=${fields}&order=google_rating.desc&limit=100`),
  ])
  const prospects = [...(found || []), ...(opened || [])]
  batchStatus.total = prospects.length
  console.log(`[batch] 🌙 Batch nocturne — ${prospects.length} maquettes (${found?.length || 0} found + ${opened?.length || 0} opened)`)

  await telegramNotify(`🌙 <b>Batch nocturne démarré</b>\n${prospects.length} maquettes à générer\n${found?.length || 0} nouveaux + ${opened?.length || 0} upgrades`)

  // TURBO MODE — 3 générations en parallèle (1 par clé)
  const PARALLEL = Math.min(STITCH_KEYS.length, 3)
  for (let i = 0; i < prospects.length; i += PARALLEL) {
    const batch = prospects.slice(i, i + PARALLEL)
    const lot = Math.floor(i / PARALLEL) + 1
    console.log(`[batch] Lot ${lot} — ${batch.map(p => p.name.slice(0, 25)).join(' | ')}`)

    const results = await Promise.allSettled(
      batch.map(async (p) => {
        const prompt = buildPromptFromProspect(p)
        const result = await handleGenerate({ prompt, slug: p.slug })
        if (result.html && result.html.length > 500) {
          const pixel = `<img src="https://webconceptor.fr/api/prospect/track-view" data-slug="${p.slug}" style="display:none" width="1" height="1">`
          const finalHtml = result.html.includes('</body>') ? result.html.replace('</body>', `${pixel}\n</body>`) : result.html
          await sbPatch(p.slug, { mockup_html: finalHtml, stitch_generated: true, updated_at: new Date().toISOString() })
          return { ok: true, name: p.name, chars: finalHtml.length, source: result.source }
        }
        return { ok: false, name: p.name, error: 'HTML vide' }
      })
    )

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.ok) {
        batchStatus.done++
        console.log(`[batch] ✅ ${r.value.name.slice(0,30)} — ${r.value.chars} chars via ${r.value.source}`)
      } else {
        batchStatus.errors++
        const err = r.status === 'fulfilled' ? r.value.error : r.reason?.message
        console.log(`[batch] ❌ ${err?.slice(0, 60)}`)
      }
    }

    await new Promise(r => setTimeout(r, 3000))
  }

  batchStatus.running = false
  console.log(`[batch] ✅ Terminé — ${batchStatus.done} OK, ${batchStatus.errors} erreurs`)
  await telegramNotify(`✅ <b>Batch nocturne terminé</b>\n\n🟢 ${batchStatus.done} maquettes générées\n🔴 ${batchStatus.errors} erreurs\n\nLes emails partiront automatiquement demain matin via N8N.`)
}

// ── Cron nocturne : lance le batch à 22h Paris ───────────────────
function scheduleNightBatch() {
  const now = new Date()
  const paris = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
  const hour = paris.getHours()

  // Si entre 22h et 5h et pas déjà en cours → lance
  if (hour >= 22 || hour < 5) {
    if (!batchStatus.running) {
      // Vérifie qu'on n'a pas déjà lancé aujourd'hui
      const lastRun = batchStatus.lastRun ? new Date(batchStatus.lastRun) : null
      const sameDay = lastRun && lastRun.toDateString() === now.toDateString()
      if (!sameDay) {
        console.log('[cron] 🌙 22h Paris — lancement batch nocturne')
        runNightBatch().catch(e => console.error('[cron] crash:', e.message))
      }
    }
  }
}

// Vérifie toutes les 10 minutes si c'est l'heure du batch
setInterval(scheduleNightBatch, 10 * 60 * 1000)
// Check immédiat au démarrage
setTimeout(scheduleNightBatch, 5000)

server.listen(PORT, () => {
  console.log(`\n🚀 WebConceptor Stitch Server`)
  console.log(`   Port: ${PORT}`)
  console.log(`   Clés Stitch: ${STITCH_KEYS.length}`)
  console.log(`   OpenRouter: ${OPENROUTER_KEY ? '✅' : '❌'}`)
  console.log(`   Auth: ${SERVER_SECRET ? '✅' : '⚠️ pas de secret'}\n`)
})
