# Implementation Notes: SystemAlertsBanner Fix

## Problem Summary

The SystemAlertsBanner component (the actual footer in the app) had several critical issues:

1. **Showed ALL alerts** (pending + acknowledged + history) instead of only acknowledged alerts
2. **No deduplication** - multiple entries for the same vehicle appeared
3. **Refreshed every 5 seconds** from AlertManager, overwriting any state
4. **Showed pending alerts immediately** - alerts appeared in footer before being acknowledged

## Root Cause

The component was using a 5-second interval to fetch ALL alerts from AlertManager:
```typescript
// OLD CODE - WRONG
const pending = AlertManager.listPending() || []
const acked = AlertManager.listAcknowledged() || []
const history = AlertManager.listHistory() || []
const combined = [...pending, ...acked, ...history]
```

This meant:
- Pending alerts (not yet acknowledged) appeared in the footer
- No deduplication by vehicle registration number
- The footer showed stale data every 5 seconds

## Solution Implemented

### 1. Load Only Acknowledged Alerts on Mount

```typescript
useEffect(() => {
  const acked = AlertManager.listAcknowledged() || []
  
  // Deduplicate by vehicle registration number
  const vehicleMap = new Map<string, any>()
  for (const alert of acked) {
    const vehicleRegNo = alert.vehicleRegNo || ''
    if (!vehicleRegNo) continue
    
    const existing = vehicleMap.get(vehicleRegNo)
    if (!existing || new Date(alert.timestamp) > new Date(existing.timestamp)) {
      vehicleMap.set(vehicleRegNo, alert)
    }
  }
  
  // Convert to display format
  const deduped = Array.from(vehicleMap.values())
  setRows(deduped.map(formatAlert))
}, [])
```

### 2. Listen for Real-Time Updates via Custom Event

```typescript
useEffect(() => {
  const handler = (e: Event) => {
    const custom = e as CustomEvent<any>
    const vehicleRegNo = extractVehicleRegNo(custom.detail)
    
    setRows((prev) => {
      // Remove existing entry for this vehicle
      const filtered = prev.filter((row) => row.id !== vehicleRegNo)
      
      // Add new entry at the beginning
      return [newRow, ...filtered].slice(0, 10)
    })
  }
  
  window.addEventListener('alarms-footer:add', handler)
  return () => window.removeEventListener('alarms-footer:add', handler)
}, [])
```

### 3. Removed Demo Data

Changed from:
```typescript
const [rows, setRows] = useState<Row[]>(initial) // Demo data
```

To:
```typescript
const [rows, setRows] = useState<Row[]>([]) // Empty on start
```

### 4. Added Empty State Message

```typescript
{rows.length === 0 ? (
  <div className="px-6 py-4 text-sm text-slate-500 text-center">
    No acknowledged alerts yet
  </div>
) : (
  // Display rows
)}
```

## Expected Behavior After Fix

### On App Restart:
1. Footer shows "No acknowledged alerts yet" (empty state)
2. After ~5 seconds, popup appears for vehicle MH12AB4829
3. User acknowledges the popup
4. Footer immediately shows ONE entry: "Vehicle MH12AB4829 has Reported at the Main Gate at [time]"
5. Entry persists across page refreshes

### On Subsequent Alerts:
1. New alert appears in popup
2. User acknowledges
3. Footer updates in real-time
4. If same vehicle has multiple alerts, only the newest is shown
5. Maximum 10 alerts displayed

## Testing Checklist

- [ ] Clear localStorage
- [ ] Restart app
- [ ] Verify footer shows "No acknowledged alerts yet"
- [ ] Wait for popup to appear (MH12AB4829)
- [ ] Acknowledge popup
- [ ] Verify exactly ONE footer entry appears
- [ ] Verify message format: "Vehicle MH12AB4829 has Reported at the Main Gate at [time]"
- [ ] Refresh page
- [ ] Verify footer entry persists
- [ ] Restart app again
- [ ] Verify no duplicate alert is created (restart token logic)

## Files Modified

1. `src/components/reports/SystemAlertsBanner.tsx`
   - Removed 5-second polling interval
   - Added deduplication by vehicle registration number
   - Added custom event listener for real-time updates
   - Changed to show only acknowledged alerts
   - Added empty state message

## Related Requirements

- Requirement 2.1: Footer deduplication by vehicle registration number ✓
- Requirement 2.2: Matching by vehicle registration number ✓
- Requirement 2.3: Deduplication on load from localStorage ✓
- Requirement 2.4: Filter out previous entries for same vehicle ✓
- Requirement 2.5: Maintain deduplication across page refreshes ✓
- Requirement 3.1: Correct message format ✓
- Requirement 3.2: Use original timestamp ✓
- Requirement 3.3: 12-hour format with AM/PM ✓
- Requirement 6.2: Replace existing entries with same ID ✓
- Requirement 6.5: ID-based deduplication in event handler ✓
