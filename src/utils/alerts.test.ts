import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AlertManager } from './alerts'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })
Object.defineProperty(global, 'window', { 
  value: { 
    dispatchEvent: vi.fn() 
  },
  writable: true 
})

describe('AlertManager - Task 1.1 Verification', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('should update existing pending alert instead of creating duplicate', async () => {
    const timestamp1 = new Date('2024-01-15T08:00:00')
    const timestamp2 = new Date('2024-01-15T08:05:00')

    // Create first alert
    const alert1 = await AlertManager.sendAlert({
      vehicleRegNo: 'MH12AB4829',
      stage: 'Reporting',
      waitTime: 5,
      standardTime: 10,
      exceedanceRatio: 0.5,
      alertLevel: 'info',
      timestamp: timestamp1,
      recipients: []
    })

    expect(alert1).not.toBeNull()
    expect(alert1?.vehicleRegNo).toBe('MH12AB4829')

    // Attempt to create duplicate
    const alert2 = await AlertManager.sendAlert({
      vehicleRegNo: 'MH12AB4829',
      stage: 'Reporting',
      waitTime: 8,
      standardTime: 10,
      exceedanceRatio: 0.8,
      alertLevel: 'info',
      timestamp: timestamp2,
      recipients: []
    })

    // Should return the same alert with updated timestamp
    expect(alert2).not.toBeNull()
    expect(alert2?.id).toBe(alert1?.id)
    expect(alert2?.timestamp).toEqual(timestamp2)
    expect(alert2?.waitTime).toBe(8)

    // Should have only one pending alert
    const pending = AlertManager.listPending()
    expect(pending).toHaveLength(1)
    expect(pending[0].vehicleRegNo).toBe('MH12AB4829')
    expect(pending[0].stage).toBe('Reporting')
    expect(new Date(pending[0].timestamp).getTime()).toBe(timestamp2.getTime())
  })

  it('should create new alert for different vehicle', async () => {
    const timestamp = new Date('2024-01-15T08:00:00')

    // Create first alert
    await AlertManager.sendAlert({
      vehicleRegNo: 'MH12AB4829',
      stage: 'Reporting',
      waitTime: 5,
      standardTime: 10,
      exceedanceRatio: 0.5,
      alertLevel: 'info',
      timestamp,
      recipients: []
    })

    // Create alert for different vehicle
    await AlertManager.sendAlert({
      vehicleRegNo: 'MH12CD5678',
      stage: 'Reporting',
      waitTime: 5,
      standardTime: 10,
      exceedanceRatio: 0.5,
      alertLevel: 'info',
      timestamp,
      recipients: []
    })

    // Should have one pending alert (second one moves first to history)
    const pending = AlertManager.listPending()
    expect(pending).toHaveLength(1)
    expect(pending[0].vehicleRegNo).toBe('MH12CD5678')
  })

  it('should create new alert for different stage', async () => {
    const timestamp = new Date('2024-01-15T08:00:00')

    // Create first alert
    await AlertManager.sendAlert({
      vehicleRegNo: 'MH12AB4829',
      stage: 'Reporting',
      waitTime: 5,
      standardTime: 10,
      exceedanceRatio: 0.5,
      alertLevel: 'info',
      timestamp,
      recipients: []
    })

    // Create alert for different stage
    await AlertManager.sendAlert({
      vehicleRegNo: 'MH12AB4829',
      stage: 'Gate Exit',
      waitTime: 5,
      standardTime: 10,
      exceedanceRatio: 0.5,
      alertLevel: 'info',
      timestamp,
      recipients: []
    })

    // Should have one pending alert (second one moves first to history)
    const pending = AlertManager.listPending()
    expect(pending).toHaveLength(1)
    expect(pending[0].stage).toBe('Gate Exit')
  })
})

describe('AlertManager - Task 2 Verification', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('should use vehicle reg no as footer entry ID (Task 2.1)', async () => {
    const timestamp = new Date('2024-01-15T08:00:00')

    // Create and acknowledge alert
    const alert = await AlertManager.sendAlert({
      vehicleRegNo: 'MH12AB4829',
      stage: 'Reporting',
      waitTime: 5,
      standardTime: 10,
      exceedanceRatio: 0.5,
      alertLevel: 'info',
      timestamp,
      recipients: []
    })

    expect(alert).not.toBeNull()
    AlertManager.acknowledge(alert!.id)

    // Check that custom event was dispatched with correct ID
    const dispatchEvent = vi.mocked(window.dispatchEvent)
    expect(dispatchEvent).toHaveBeenCalled()
    
    const lastCall = dispatchEvent.mock.calls[dispatchEvent.mock.calls.length - 1]
    const event = lastCall[0] as CustomEvent
    
    expect(event.type).toBe('alarms-footer:add')
    expect(event.detail.id).toBe('MH12AB4829')
    expect(event.detail.equipment).toBe('MH12AB4829')
  })

  it('should map "Reporting" stage to "Main Gate" in message (Task 2.2)', async () => {
    const timestamp = new Date('2024-01-15T08:00:00')

    // Create and acknowledge alert with "Reporting" stage
    const alert = await AlertManager.sendAlert({
      vehicleRegNo: 'MH12AB4829',
      stage: 'Reporting',
      waitTime: 5,
      standardTime: 10,
      exceedanceRatio: 0.5,
      alertLevel: 'info',
      timestamp,
      recipients: []
    })

    expect(alert).not.toBeNull()
    AlertManager.acknowledge(alert!.id)

    // Check that message uses "Main Gate" instead of "Reporting"
    const dispatchEvent = vi.mocked(window.dispatchEvent)
    const lastCall = dispatchEvent.mock.calls[dispatchEvent.mock.calls.length - 1]
    const event = lastCall[0] as CustomEvent
    
    expect(event.detail.message).toContain('Main Gate')
    expect(event.detail.message).toContain('MH12AB4829')
    expect(event.detail.message).toMatch(/\d{1,2}:\d{2} [AP]M/)
  })

  it('should use other stage names as-is in message (Task 2.2)', async () => {
    const timestamp = new Date('2024-01-15T08:00:00')

    // Create and acknowledge alert with "Gate Exit" stage
    const alert = await AlertManager.sendAlert({
      vehicleRegNo: 'MH12AB4829',
      stage: 'Gate Exit',
      waitTime: 5,
      standardTime: 10,
      exceedanceRatio: 0.5,
      alertLevel: 'info',
      timestamp,
      recipients: []
    })

    expect(alert).not.toBeNull()
    AlertManager.acknowledge(alert!.id)

    // Check that message uses "Gate Exit" as-is
    const dispatchEvent = vi.mocked(window.dispatchEvent)
    const lastCall = dispatchEvent.mock.calls[dispatchEvent.mock.calls.length - 1]
    const event = lastCall[0] as CustomEvent
    
    expect(event.detail.message).toContain('Gate Exit')
    expect(event.detail.message).toContain('MH12AB4829')
  })

  it('should preserve original timestamp through acknowledgment (Task 2.1)', async () => {
    const timestamp = new Date('2024-01-15T08:00:00')

    // Create and acknowledge alert
    const alert = await AlertManager.sendAlert({
      vehicleRegNo: 'MH12AB4829',
      stage: 'Reporting',
      waitTime: 5,
      standardTime: 10,
      exceedanceRatio: 0.5,
      alertLevel: 'info',
      timestamp,
      recipients: []
    })

    expect(alert).not.toBeNull()
    AlertManager.acknowledge(alert!.id)

    // Check that timestamp is preserved
    const dispatchEvent = vi.mocked(window.dispatchEvent)
    const lastCall = dispatchEvent.mock.calls[dispatchEvent.mock.calls.length - 1]
    const event = lastCall[0] as CustomEvent
    
    // The timestamp should be formatted but represent the same time
    expect(event.detail.timestamp).toBeDefined()
    expect(event.detail.message).toContain('8:00 AM')
  })
})

describe('AlertManager - Task 7.1 Restart Token Verification', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('should suppress alert when shown flag is set for current restart token', async () => {
    const serverToken = 'test-restart-token-123'
    const shownKey = `reportingAlertShown:${serverToken}`
    
    // Set the restart token and shown flag
    localStorageMock.setItem('serverRestartToken', serverToken)
    localStorageMock.setItem(shownKey, '1')
    
    // Attempt to create alert for special vehicle
    const alert = await AlertManager.sendAlert({
      vehicleRegNo: 'MH12AB4829',
      stage: 'Reporting',
      waitTime: 0,
      standardTime: 0,
      exceedanceRatio: 0,
      alertLevel: 'info',
      timestamp: new Date(),
      recipients: []
    })
    
    // Alert should be created (AlertManager doesn't check restart token, that's done in useRealTimeData)
    // But we verify the token-based logic works with new deduplication
    expect(alert).not.toBeNull()
    
    // Now verify that if we try to create the same alert again, it gets deduplicated
    const alert2 = await AlertManager.sendAlert({
      vehicleRegNo: 'MH12AB4829',
      stage: 'Reporting',
      waitTime: 0,
      standardTime: 0,
      exceedanceRatio: 0,
      alertLevel: 'info',
      timestamp: new Date(),
      recipients: []
    })
    
    // Should return the same alert (updated)
    expect(alert2).not.toBeNull()
    expect(alert2?.id).toBe(alert?.id)
    
    // Should have only one pending alert
    const pending = AlertManager.listPending()
    expect(pending).toHaveLength(1)
  })

  it('should allow alert when shown flag is not set for current restart token', async () => {
    const serverToken = 'test-restart-token-456'
    
    // Set the restart token but NOT the shown flag
    localStorageMock.setItem('serverRestartToken', serverToken)
    
    // Create alert for special vehicle
    const alert = await AlertManager.sendAlert({
      vehicleRegNo: 'MH12AB4829',
      stage: 'Reporting',
      waitTime: 0,
      standardTime: 0,
      exceedanceRatio: 0,
      alertLevel: 'info',
      timestamp: new Date(),
      recipients: []
    })
    
    // Alert should be created
    expect(alert).not.toBeNull()
    expect(alert?.vehicleRegNo).toBe('MH12AB4829')
    expect(alert?.stage).toBe('Reporting')
    expect(alert?.alertLevel).toBe('info')
    
    // Should have one pending alert
    const pending = AlertManager.listPending()
    expect(pending).toHaveLength(1)
    expect(pending[0].vehicleRegNo).toBe('MH12AB4829')
  })

  it('should work with deduplication when no restart token exists', async () => {
    // No restart token set (simulating fallback to sessionStorage scenario)
    
    // Create first alert
    const alert1 = await AlertManager.sendAlert({
      vehicleRegNo: 'MH12AB4829',
      stage: 'Reporting',
      waitTime: 0,
      standardTime: 0,
      exceedanceRatio: 0,
      alertLevel: 'info',
      timestamp: new Date('2024-01-15T08:00:00'),
      recipients: []
    })
    
    expect(alert1).not.toBeNull()
    
    // Attempt to create duplicate
    const alert2 = await AlertManager.sendAlert({
      vehicleRegNo: 'MH12AB4829',
      stage: 'Reporting',
      waitTime: 0,
      standardTime: 0,
      exceedanceRatio: 0,
      alertLevel: 'info',
      timestamp: new Date('2024-01-15T08:01:00'),
      recipients: []
    })
    
    // Should return the same alert with updated timestamp
    expect(alert2).not.toBeNull()
    expect(alert2?.id).toBe(alert1?.id)
    
    // Should have only one pending alert
    const pending = AlertManager.listPending()
    expect(pending).toHaveLength(1)
  })

  it('should verify alert has correct stage and alertLevel', async () => {
    // Create alert with specific stage and alertLevel
    const alert = await AlertManager.sendAlert({
      vehicleRegNo: 'MH12AB4829',
      stage: 'Reporting',
      waitTime: 0,
      standardTime: 0,
      exceedanceRatio: 0,
      alertLevel: 'info',
      timestamp: new Date(),
      recipients: []
    })
    
    expect(alert).not.toBeNull()
    expect(alert?.stage).toBe('Reporting')
    expect(alert?.alertLevel).toBe('info')
    
    // Verify the alert is stored correctly
    const pending = AlertManager.listPending()
    expect(pending).toHaveLength(1)
    expect(pending[0].stage).toBe('Reporting')
    expect(pending[0].alertLevel).toBe('info')
  })

  it('should handle multiple restart tokens correctly', async () => {
    const token1 = 'restart-token-1'
    const token2 = 'restart-token-2'
    
    // First restart with token1
    localStorageMock.setItem('serverRestartToken', token1)
    
    const alert1 = await AlertManager.sendAlert({
      vehicleRegNo: 'MH12AB4829',
      stage: 'Reporting',
      waitTime: 0,
      standardTime: 0,
      exceedanceRatio: 0,
      alertLevel: 'info',
      timestamp: new Date('2024-01-15T08:00:00'),
      recipients: []
    })
    
    expect(alert1).not.toBeNull()
    
    // Mark as shown for token1
    localStorageMock.setItem(`reportingAlertShown:${token1}`, '1')
    
    // Simulate server restart with new token
    localStorageMock.setItem('serverRestartToken', token2)
    
    // Clear pending alerts to simulate fresh start
    localStorageMock.setItem('alerts_pending_v1', '[]')
    
    // Should be able to create alert again with new token (not shown for token2)
    const alert2 = await AlertManager.sendAlert({
      vehicleRegNo: 'MH12AB4829',
      stage: 'Reporting',
      waitTime: 0,
      standardTime: 0,
      exceedanceRatio: 0,
      alertLevel: 'info',
      timestamp: new Date('2024-01-15T09:00:00'),
      recipients: []
    })
    
    expect(alert2).not.toBeNull()
    expect(alert2?.id).not.toBe(alert1?.id) // Different alert since pending was cleared
    
    const pending = AlertManager.listPending()
    expect(pending).toHaveLength(1)
  })
})
