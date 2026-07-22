export interface AlertConfig {
  vehicleRegNo: string
  stage: string
  waitTime: number
  standardTime: number
  exceedanceRatio: number
  alertLevel: 'warning' | 'critical' | 'info'
  timestamp: Date
  recipients: string[]
  message?: string  // Optional custom message (used for parking alerts)
}

type StoredAlert = AlertConfig & { id: string; message: string; acknowledged?: boolean }

const PENDING_KEY = 'alerts_pending_v1'
const ACKED_KEY = 'alerts_ack_v1'
const HISTORY_KEY = 'alerts_history_v1'

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Failed to read from localStorage key "${key}":`, error);
    return null;
  }
}

function writeJSON(key: string, v: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(v));
    return true;
  } catch (error) {
    console.error(`Failed to write to localStorage key "${key}":`, error);
    return false;
  }
}

import { toStorageTimestamp } from '../lib/datetime'

export const AlertManager = {
  async sendAlert(config: AlertConfig) {
    try {
      // Validate timestamp
      const timestamp = config.timestamp instanceof Date ? config.timestamp : new Date(config.timestamp)
      if (isNaN(timestamp.getTime())) {
        console.error('Invalid timestamp provided to sendAlert:', config.timestamp)
        config.timestamp = new Date() // Fallback to current time
      } else {
        config.timestamp = timestamp
      }

      // Use custom message if provided, otherwise generate default message
      const message = config.message || `Vehicle ${config.vehicleRegNo} is delayed at ${config.stage} (${config.waitTime}m)`
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const stored: StoredAlert = { ...config, id, message, acknowledged: false }

      // Read current pending alerts
      const existingPending = readJSON<StoredAlert[]>(PENDING_KEY) || []

      // STEP 1: Check if a pending alert exists for the same vehicle+stage
      // If found, update its timestamp and return it (Requirements 1.2, 1.4)
      try {
        const matchIdx = existingPending.findIndex(p =>
          p.vehicleRegNo === config.vehicleRegNo && p.stage === config.stage
        )
        if (matchIdx !== -1) {
          // Update the existing pending alert's timestamp and message
          const existing = existingPending[matchIdx]
          existing.timestamp = config.timestamp
          existing.message = message
          existing.waitTime = config.waitTime
          existing.standardTime = config.standardTime
          existing.exceedanceRatio = config.exceedanceRatio
          existing.acknowledged = false

          // Write back ALL pending alerts (not just the matched one)
          writeJSON(PENDING_KEY, existingPending)
          try { window.dispatchEvent(new Event('alerts-updated')) } catch { }
          console.log('ALERT SUPPRESSED (pending alert updated):', existing)
          return existing
        }
      } catch (error) {
        console.error('Error checking pending alerts:', error)
      }

      // STEP 2: Check history for recent alerts (within 2 minutes) for the same vehicle+stage
      // Only check history if no pending alert was found (Requirements 1.3, 1.4)
      try {
        const history = readJSON<StoredAlert[]>(HISTORY_KEY) || []
        const now = Date.now()
        const windowMs = 2 * 60 * 1000 // 2 minutes

        const recentHistoryMatch = history.some(a => {
          try {
            if (!a || !a.vehicleRegNo || !a.stage) return false
            if (a.vehicleRegNo !== config.vehicleRegNo) return false
            if (a.stage !== config.stage) return false
            const ts = new Date(a.timestamp).getTime()
            if (isNaN(ts)) {
              console.warn('Invalid timestamp in history alert:', a.timestamp)
              return false
            }
            return (now - ts) <= windowMs
          } catch { return false }
        })

        if (recentHistoryMatch) {
          // Already alerted recently for this vehicle+stage; suppress
          console.log('ALERT SUPPRESSED (recent history match):', config.vehicleRegNo, config.stage)
          return null
        }
      } catch (error) {
        console.error('Error checking history:', error)
      }

      // STEP 3: No duplicate found - Add to pending stack (LIFO)
      // Newest alert goes to the front of the array
      const newPending = [stored, ...existingPending].slice(0, 50) // Limit to 50 to prevent infinite growth

      // Save the updated stack as pending
      writeJSON(PENDING_KEY, newPending)
      try { window.dispatchEvent(new Event('alerts-updated')) } catch { }
      console.log('ALERT TRIGGERED:', stored)
      return stored
    } catch (error) {
      console.error('Error in sendAlert:', error)
      return null
    }
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
    try {
      const pending = readJSON<StoredAlert[]>(PENDING_KEY) || []
      const idx = pending.findIndex((p) => p.id === id)
      if (idx === -1) {
        console.warn(`Alert with id ${id} not found in pending alerts`)
        return false
      }

      const [item] = pending.splice(idx, 1)

      // Validate required fields
      if (!item.vehicleRegNo) {
        console.error('Cannot acknowledge alert: missing vehicleRegNo', item)
        return false
      }

      if (!item.timestamp) {
        console.error('Cannot acknowledge alert: missing timestamp', item)
        return false
      }

      item.acknowledged = true
      item.acknowledged = true
      // We will save to ACKED_KEY *after* formatting the message below
      // so that the table displays the rich message instead of the raw one


      try {
        const ts = new Date(item.timestamp)

        // Validate timestamp
        if (isNaN(ts.getTime())) {
          console.error('Invalid timestamp in alert, using current time as fallback:', item.timestamp)
          ts.setTime(Date.now()) // Use current time as fallback
        }

        const timeStr = ts.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

        // Format message based on stage
        let message: string
        if (item.stage === 'Reporting') {
          // Map stage "Reporting" to "Main Gate" for display (Requirement 3.4)
          message = `Vehicle ${item.vehicleRegNo} has Reported at the Main Gate at ${timeStr}`
        } else if (item.stage === 'Gate Entry') {
          message = `Vehicle ${item.vehicleRegNo} has completed Document Verification at ${timeStr}`
        } else if (item.stage === 'Parking Reached') {
          // Use the custom message from the alert (includes parking spot number)
          message = item.message || `Vehicle ${item.vehicleRegNo} has reached Parking at ${timeStr}`
        } else if (item.stage === 'Parking Left') {
          // Use the custom message from the alert (includes parking spot number)
          message = item.message || `Vehicle ${item.vehicleRegNo} has left Parking at ${timeStr}`
        } else if (item.stage === 'Tare Weight') {
          message = `Vehicle ${item.vehicleRegNo} has completed Tare Weight at ${timeStr}`
        } else if (item.stage === 'Loading') {
          message = `Vehicle ${item.vehicleRegNo} has completed Loading at ${timeStr}`
        } else if (item.stage === 'Wt Post Loading') {
          message = `Vehicle ${item.vehicleRegNo} has completed Wt Post Loading at ${timeStr}`
        } else if (item.stage === 'Gate Exit') {
          message = `Vehicle ${item.vehicleRegNo} has Exited the plant at ${timeStr}`
        } else {
          // Fallback for any other stage
          const displayStage = item.stage || 'Unknown Stage'
          message = `Vehicle ${item.vehicleRegNo} has Reported at the ${displayStage} at ${timeStr}`
        }

        // Update the item's message with the formatted one so it displays correctly in the alarms table
        item.message = message

        // Save the updated item to acknowledged list (this ensures table shows the rich message)
        const ack = readJSON<StoredAlert[]>(ACKED_KEY) || []
        writeJSON(ACKED_KEY, [item, ...ack].slice(0, 500))
        writeJSON(PENDING_KEY, pending)

        const alarm = {
          // use vehicleRegNo as stable id so repeated acknowledgements replace previous footer entry
          id: item.vehicleRegNo,
          timestamp: toStorageTimestamp(ts),
          severity: item.alertLevel === 'critical' ? 'High' : item.alertLevel === 'info' ? 'Info' : 'Medium',
          equipment: item.vehicleRegNo,
          type: item.stage || '',
          message,
          description: item.message || `${item.vehicleRegNo} — ${item.stage}`,
          value: String(item.waitTime ?? ''),
          threshold: String(item.standardTime ?? ''),
          status: 'Acknowledged',
        }

        try {
          window.dispatchEvent(new CustomEvent('alarms-footer:add', { detail: alarm }))
        } catch (error) {
          console.error('Failed to dispatch alarms-footer:add event:', error)
        }
      } catch (error) {
        console.error('Error formatting acknowledgment message:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error acknowledging alert:', error)
      return false
    }
  }
}
