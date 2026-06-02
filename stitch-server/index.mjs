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
const STITCH_KEYS = [
  process.env.STITCH_API_KEY_4,
  process.env.STITCH_API_KEY_5,
  process.env.STITCH_API_KEY_6,
  process.env.STITCH_API_KEY_3,
  process.env.STITCH_API_KEY_2,
  process.env.STITCH_API_KEY,
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

// ── Stitch via SDK ───────────────────────────────────────────────
async function generateViaStitch(prompt) {
  const key = getNextAliveKey()
  if (!key) throw new Error('ALL_KEYS_DEAD')

  process.env.STITCH_API_KEY = key
  // Force re-import pour utiliser la nouvelle clé
  const { stitch } = await import('@google/stitch-sdk')

  const project = await stitch.createProject(`WC-${Date.now()}`)
  const screen = await project.generate(prompt)

  // Retry getHtml
  for (let i = 0; i < 6; i++) {
    const url = await screen.getHtml()
    if (url) {
      const res = await fetch(url)
      const html = await res.text()
      if (html.length > 500) return { html, source: 'stitch', key: key.slice(-8) }
    }
    if (i < 5) await new Promise(r => setTimeout(r, 4000))
  }
  throw new Error('HTML_EMPTY')
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

  res.writeHead(404)
  res.end('Not Found')
})

server.listen(PORT, () => {
  console.log(`\n🚀 WebConceptor Stitch Server`)
  console.log(`   Port: ${PORT}`)
  console.log(`   Clés Stitch: ${STITCH_KEYS.length}`)
  console.log(`   OpenRouter: ${OPENROUTER_KEY ? '✅' : '❌'}`)
  console.log(`   Auth: ${SERVER_SECRET ? '✅' : '⚠️ pas de secret'}\n`)
})
