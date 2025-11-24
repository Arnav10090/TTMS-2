export interface AlertConfig {
  vehicleRegNo: string
  stage: string
  waitTime: number
  standardTime: number
  exceedanceRatio: number
  alertLevel: 'warning' | 'critical' | 'info'
  timestamp: Date
  recipients: string[]
}

type StoredAlert = AlertConfig & { id: string; message: string; acknowledged?: boolean }

const PENDING_KEY = 'alerts_pending_v1'
const ACKED_KEY = 'alerts_ack_v1'
const HISTORY_KEY = 'alerts_history_v1'

function readJSON<T>(key: string): T | null {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : null } catch { return null }
}

function writeJSON(key: string, v: any) { try { localStorage.setItem(key, JSON.stringify(v)) } catch {} }

export const AlertManager = {
  async sendAlert(config: AlertConfig) {
    const message = `Vehicle ${config.vehicleRegNo} is delayed at ${config.stage} (${config.waitTime}m)`
    const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`
    const stored: StoredAlert = { ...config, id, message, acknowledged: false }

    // Move existing pending alerts to history when a new alert comes in
    const existingPending = readJSON<StoredAlert[]>(PENDING_KEY) || []
    if (existingPending.length > 0) {
      const existingHistory = readJSON<StoredAlert[]>(HISTORY_KEY) || []
      const merged = [...existingPending, ...existingHistory].slice(0, 1000)
      writeJSON(HISTORY_KEY, merged)
    }

    // Save only the new alert as pending
    writeJSON(PENDING_KEY, [stored])
    console.warn('ALERT TRIGGERED:', stored)
    return stored
  },
  listPending() {
    return readJSON<StoredAlert[]>(PENDING_KEY) || []
  },
  listAcknowledged() {
    return readJSON<StoredAlert[]>(ACKED_KEY) || []
  },
  listHistory() {
    return readJSON<StoredAlert[]>(HISTORY_KEY) || []
  },
  acknowledge(id: string) {
    const pending = readJSON<StoredAlert[]>(PENDING_KEY) || []
    const idx = pending.findIndex((p) => p.id === id)
    if (idx === -1) return false
    const [item] = pending.splice(idx, 1)
    item.acknowledged = true
    const ack = readJSON<StoredAlert[]>(ACKED_KEY) || []
    writeJSON(ACKED_KEY, [item, ...ack].slice(0, 500))
    writeJSON(PENDING_KEY, pending)
    return true
  }
}
