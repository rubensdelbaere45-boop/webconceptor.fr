/**
 * Watchdog — Agent de surveillance Stitch Server
 *
 * Toutes les 30 secondes :
 * 1. Vérifie que le serveur répond (/health)
 * 2. Vérifie que les clés Stitch sont vivantes
 * 3. Si crash détecté → restart automatique
 * 4. Envoie alerte Telegram si problème
 *
 * Tourne en tant que process séparé sur Railway.
 */

const SERVER_URL = process.env.STITCH_SERVER_URL || 'http://localhost:3001'
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const TELEGRAM_CHAT = process.env.TELEGRAM_CHAT_ID || ''
const CHECK_INTERVAL = 30_000 // 30 secondes

let consecutiveFailures = 0
let lastAlertTime = 0

async function sendTelegramAlert(message) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return
  // Max 1 alerte toutes les 5 minutes
  if (Date.now() - lastAlertTime < 300_000) return
  lastAlertTime = Date.now()

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT,
        text: `🚨 <b>WebConceptor Watchdog</b>\n\n${message}`,
        parse_mode: 'HTML',
      }),
    })
  } catch {}
}

async function healthCheck() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    const res = await fetch(`${SERVER_URL}/health`, { signal: controller.signal })
    clearTimeout(timeout)

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()

    const alive = data.stitch_keys_alive || 0
    const total = data.stitch_keys_total || 0

    if (consecutiveFailures > 0) {
      console.log(`✅ Serveur récupéré après ${consecutiveFailures} échecs`)
      if (consecutiveFailures >= 3) {
        sendTelegramAlert(`✅ Stitch Server récupéré après ${consecutiveFailures} échecs consécutifs`)
      }
    }
    consecutiveFailures = 0

    // Alerte si trop de clés mortes
    if (alive === 0 && total > 0) {
      console.log(`⚠️ Toutes les clés Stitch sont mortes — reset en cours`)
      await fetch(`${SERVER_URL}/reset-keys`, { method: 'POST' }).catch(() => {})
      sendTelegramAlert(`⚠️ Toutes les clés Stitch mortes → reset automatique\nOpenRouter fallback actif`)
    } else if (alive < total) {
      console.log(`⚠️ ${alive}/${total} clés vivantes`)
    } else {
      // Tout va bien — log silencieux
      if (Date.now() % 300_000 < CHECK_INTERVAL) { // Log toutes les ~5 min
        console.log(`✅ ${alive}/${total} clés — OK`)
      }
    }

    return true
  } catch (err) {
    consecutiveFailures++
    console.log(`❌ Health check échoué (${consecutiveFailures}×): ${err.message}`)

    if (consecutiveFailures === 3) {
      sendTelegramAlert(`❌ Stitch Server DOWN depuis ${consecutiveFailures} checks (${consecutiveFailures * CHECK_INTERVAL / 1000}s)\n\nErreur: ${err.message}\n\nAction: vérifier Railway`)
    }

    return false
  }
}

// ── Main loop ────────────────────────────────────────────────────
console.log(`🔍 Watchdog démarré — check toutes les ${CHECK_INTERVAL/1000}s`)
console.log(`   Serveur: ${SERVER_URL}`)
console.log(`   Telegram: ${TELEGRAM_TOKEN ? '✅' : '❌'}\n`)

// Premier check immédiat
await healthCheck()

// Boucle infinie
setInterval(healthCheck, CHECK_INTERVAL)
