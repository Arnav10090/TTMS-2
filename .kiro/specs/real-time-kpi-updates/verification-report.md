# KPI Update Logic Verification Report

## Task 1: Review and Verify Existing KPI Update Logic

**Date:** February 3, 2026  
**File Reviewed:** `src/hooks/useRealTimeData.ts`

---

## Executive Summary

The existing `useRealTimeData` hook contains KPI update logic for both gate entry and gate exit events. After thorough review, I found **CRITICAL BUGS** in the implementation that violate the requirements. The logic has duplicate KPI updates and incorrect sessionStorage flag handling.

---

## Detailed Findings

### 1. Gate Entry Event Handler (`onGateEntryCompleted`)

**Location:** Lines 711-759

**Current Implementation:**
```typescript
const onGateEntryCompleted = () => {
  try {
    const rfidMap = rfidAssignmentService.getAssignments()
    const special = 'MH12AB4829'
    const shownKey = 'gateEntryAlertShown'
    const alreadyShown = sessionStorage.getItem(shownKey)
    
    // FIRST KPI UPDATE (lines 715-732)
    try {
      const kpiEntryKey = `kpiGateEntryCounted:${special}`
      if (rfidMap[special] && !sessionStorage.getItem(kpiEntryKey)) {
        setKpiData((prev) => {
          const inDay = (prev.vehicles.inDay || 0) + 1
          const inCum = (prev.vehicles.inCum || 0) + 1
          const trucksInside = (prev.capacity.trucksInside || 0) + 1
          const plantCapacity = prev.capacity.plantCapacity || 1
          const utilization = Math.round((trucksInside / plantCapacity) * 100)
          try { sessionStorage.setItem(kpiEntryKey, '1') } catch {}
          return {
            ...prev,
            vehicles: { ...prev.vehicles, inDay, inCum },
            capacity: { ...prev.capacity, trucksInside, utilization },
          }
        })
      }
    } catch {}

    if (rfidMap[special] && !alreadyShown) {
      setTimeout(() => {
        // Alert logic...
        
        // SECOND KPI UPDATE (lines 743-757) - DUPLICATE!
        try {
          const kpiEntryKey = `kpiGateEntryCounted:${special}`
          if (!sessionStorage.getItem(kpiEntryKey)) {
            setKpiData((prev) => {
              const inDay = (prev.vehicles.inDay || 0) + 1
              const inCum = (prev.vehicles.inCum || 0) + 1
              const trucksInside = (prev.capacity.trucksInside || 0) + 1
              const plantCapacity = prev.capacity.plantCapacity || 1
              const utilization = Math.round((trucksInside / plantCapacity) * 100)
              return {
                ...prev,
                vehicles: { ...prev.vehicles, inDay, inCum },
                capacity: { ...prev.capacity, trucksInside, utilization },
              }
            })
            try { sessionStorage.setItem(kpiEntryKey, '1') } catch {}
          }
        } catch {}
      }, 3000)
    }
  } catch {}
}
```

#### Issues Found:

**🔴 CRITICAL BUG #1: Duplicate KPI Updates**
- The handler contains TWO separate KPI update blocks (lines 715-732 and 743-757)
- The first update runs immediately when the event fires
- The second update runs after a 3-second delay inside the alert logic
- This can cause double-counting if both conditions are met

**🔴 CRITICAL BUG #2: Incorrect sessionStorage Flag Setting**
- In the first update block (line 724), the sessionStorage flag is set INSIDE the setKpiData callback
- This is problematic because React state updates are asynchronous
- The flag should be set AFTER the state update completes, not inside the callback
- In the second update block (line 756), the flag is set OUTSIDE the callback but AFTER the setTimeout, which is also incorrect

**🟡 ISSUE #3: Alert-Dependent Logic**
- The second KPI update is nested inside the alert logic (`if (rfidMap[special] && !alreadyShown)`)
- This couples KPI updates to alert display, which violates separation of concerns
- If the alert has already been shown, the second update won't run (though the first will)

**✅ CORRECT ASPECTS:**
- Uses functional state updates: `setKpiData((prev) => ...)`
- Increments correct counters: `inDay`, `inCum`, `trucksInside`
- Uses correct utilization formula: `Math.round((trucksInside / plantCapacity) * 100)`
- Uses correct sessionStorage key format: `kpiGateEntryCounted:${special}`
- Handles zero plant capacity: `prev.capacity.plantCapacity || 1`

---

### 2. Gate Exit Event Handler (`onGateExitCompletedToast`)

**Location:** Lines 641-709

**Current Implementation:**
```typescript
const onGateExitCompletedToast = () => {
  try {
    const raw = localStorage.getItem('vehicleGateExitCompleted')
    const map = raw ? JSON.parse(raw) as Record<string, string> : {}
    const special = 'MH12AB4829'
    const shownKey = 'gateExitToastShown'
    const alreadyShown = sessionStorage.getItem(shownKey)
    
    // KPI UPDATE (lines 648-663)
    try {
      const kpiExitKey = `kpiGateExitCounted:${special}`
      if (map[special] && !sessionStorage.getItem(kpiExitKey)) {
        setKpiData((prev) => {
          const outDay = (prev.vehicles.outDay || 0) + 1
          const outCum = (prev.vehicles.outCum || 0) + 1
          const trucksInside = Math.max(0, (prev.capacity.trucksInside || 0) - 1)
          const plantCapacity = prev.capacity.plantCapacity || 1
          const utilization = Math.round((trucksInside / plantCapacity) * 100)
          try { sessionStorage.setItem(kpiExitKey, '1') } catch {}
          return {
            ...prev,
            vehicles: { ...prev.vehicles, outDay, outCum },
            capacity: { ...prev.capacity, trucksInside, utilization },
          }
        })
      }
    } catch {}

    if (map[special] && !alreadyShown) {
      setTimeout(() => {
        // Alert logic only, no duplicate KPI update
      }, 3000)
    }
  } catch {}
}
```

#### Issues Found:

**🔴 CRITICAL BUG #4: Incorrect sessionStorage Flag Setting**
- The sessionStorage flag is set INSIDE the setKpiData callback (line 658)
- Same issue as gate entry: React state updates are asynchronous
- The flag should be set AFTER the state update completes

**✅ CORRECT ASPECTS:**
- Only ONE KPI update block (no duplication like gate entry)
- Uses functional state updates: `setKpiData((prev) => ...)`
- Increments correct counters: `outDay`, `outCum`
- Decrements `trucksInside` with minimum of 0: `Math.max(0, (prev.capacity.trucksInside || 0) - 1)`
- Uses correct utilization formula: `Math.round((trucksInside / plantCapacity) * 100)`
- Uses correct sessionStorage key format: `kpiGateExitCounted:${special}`
- Handles zero plant capacity: `prev.capacity.plantCapacity || 1`

---

### 3. Initial State Reconciliation (`ensureInitialKpiCounts`)

**Location:** Lines 289-337

**Current Implementation:**
```typescript
const ensureInitialKpiCounts = () => {
  try {
    const rfidMap = rfidAssignmentService.getAssignments()
    const gateExitRaw = localStorage.getItem('vehicleGateExitCompleted')
    const gateExitMap = gateExitRaw ? JSON.parse(gateExitRaw) as Record<string,string> : {}

    // Gate Entry Reconciliation
    Object.keys(rfidMap || {}).forEach((reg) => {
      try {
        const entryKey = `kpiGateEntryCounted:${reg}`
        if (!sessionStorage.getItem(entryKey)) {
          setKpiData((prev) => {
            const inDay = (prev.vehicles.inDay || 0) + 1
            const inCum = (prev.vehicles.inCum || 0) + 1
            const trucksInside = (prev.capacity.trucksInside || 0) + 1
            const plantCapacity = prev.capacity.plantCapacity || 1
            const utilization = Math.round((trucksInside / plantCapacity) * 100)
            try { sessionStorage.setItem(entryKey, '1') } catch {}
            return {
              ...prev,
              vehicles: { ...prev.vehicles, inDay, inCum },
              capacity: { ...prev.capacity, trucksInside, utilization },
            }
          })
        }
      } catch {}
    })

    // Gate Exit Reconciliation
    Object.keys(gateExitMap || {}).forEach((reg) => {
      try {
        const exitKey = `kpiGateExitCounted:${reg}`
        if (!sessionStorage.getItem(exitKey)) {
          setKpiData((prev) => {
            const outDay = (prev.vehicles.outDay || 0) + 1
            const outCum = (prev.vehicles.outCum || 0) + 1
            const trucksInside = Math.max(0, (prev.capacity.trucksInside || 0) - 1)
            const plantCapacity = prev.capacity.plantCapacity || 1
            const utilization = Math.round((trucksInside / plantCapacity) * 100)
            try { sessionStorage.setItem(exitKey, '1') } catch {}
            return {
              ...prev,
              vehicles: { ...prev.vehicles, outDay, outCum },
              capacity: { ...prev.capacity, trucksInside, utilization },
            }
          })
        }
      } catch {}
    })
  } catch {}
}
```

#### Issues Found:

**🔴 CRITICAL BUG #5: Incorrect sessionStorage Flag Setting**
- Both gate entry and gate exit reconciliation set the sessionStorage flag INSIDE the setKpiData callback
- Same issue: React state updates are asynchronous
- Flags should be set AFTER state updates complete

**✅ CORRECT ASPECTS:**
- Reads all RFID assignments from localStorage
- Reads all gate exit completions from localStorage
- Iterates through all vehicles (not just MH12AB4829)
- Checks for sessionStorage flags before applying updates
- Uses correct KPI update logic for both entry and exit
- Uses vehicle-specific flag keys: `kpiGateEntryCounted:${reg}` and `kpiGateExitCounted:${reg}`

---

## Requirements Verification Matrix

| Requirement | Status | Notes |
|-------------|--------|-------|
| **1.1** - Increment Trucks Inside on gate entry | ✅ PASS | Correctly increments by 1 |
| **1.2** - Recalculate utilization on gate entry | ✅ PASS | Uses correct formula |
| **1.3** - Increment Vehicles IN (Day) on gate entry | ✅ PASS | Correctly increments by 1 |
| **1.4** - Increment Vehicles IN (Cum) on gate entry | ✅ PASS | Correctly increments by 1 |
| **1.5** - Persist sessionStorage flag on gate entry | 🔴 FAIL | Flag set inside async callback |
| **2.1** - Decrement Trucks Inside on gate exit | ✅ PASS | Correctly decrements by 1 with min 0 |
| **2.2** - Recalculate utilization on gate exit | ✅ PASS | Uses correct formula |
| **2.3** - Increment Vehicles OUT (Day) on gate exit | ✅ PASS | Correctly increments by 1 |
| **2.4** - Increment Vehicles OUT (Cum) on gate exit | ✅ PASS | Correctly increments by 1 |
| **2.5** - Persist sessionStorage flag on gate exit | 🔴 FAIL | Flag set inside async callback |

---

## Summary of Bugs

### Critical Bugs (Must Fix)

1. **Duplicate KPI Updates in Gate Entry Handler**
   - Two separate update blocks can cause double-counting
   - Second update is coupled to alert display logic
   - **Impact:** KPI counts may be incorrect (double-counted)

2. **Incorrect sessionStorage Flag Timing**
   - Flags are set inside setKpiData callbacks (all 3 locations)
   - React state updates are asynchronous, so flag may be set before state actually updates
   - **Impact:** Race conditions, potential double-counting on rapid events

### Recommendations

1. **Remove duplicate KPI update** from gate entry handler
2. **Move sessionStorage flag setting** outside of setKpiData callbacks
3. **Separate KPI update logic** from alert display logic
4. **Add error handling** for localStorage/sessionStorage operations (already present but could be improved)

---

## Additional Finding: Missing KPI Updates for Other Cards

### Issue: Turnaround Time, Dwell Time, and Dispatch Summary Not Updated

**🔴 CRITICAL MISSING FEATURE:**

The current implementation only updates the **Capacity Utilization** and **Vehicle Summary** KPI cards. However, the following KPI cards should also update when gate exit is completed:

1. **Turnaround Time KPI** (`kpiData.turnaround`)
   - Should update: `avgDay`, `avgCum`, `sparkline`
   - Currently: No updates in gate exit handler

2. **Dwell Time KPI** (`kpiData.dwell`)
   - Should update: `totalDwellDay`, `totalDwellCum`, `avgDwellDay`, `avgDwellCum`, `sparkline`
   - Currently: No updates in gate exit handler

3. **Dispatch Summary KPI** (`kpiData.dispatch`)
   - Should update: `today`, `cumMonth`
   - Currently: No updates in gate exit handler

**Current Gate Exit Handler Only Updates:**
```typescript
setKpiData((prev) => {
  const outDay = (prev.vehicles.outDay || 0) + 1
  const outCum = (prev.vehicles.outCum || 0) + 1
  const trucksInside = Math.max(0, (prev.capacity.trucksInside || 0) - 1)
  const plantCapacity = prev.capacity.plantCapacity || 1
  const utilization = Math.round((trucksInside / plantCapacity) * 100)
  try { sessionStorage.setItem(kpiExitKey, '1') } catch {}
  return {
    ...prev,
    vehicles: { ...prev.vehicles, outDay, outCum },
    capacity: { ...prev.capacity, trucksInside, utilization },
  }
})
```

**Missing Updates:**
- `turnaround.avgDay` - Average turnaround time for the day
- `turnaround.avgCum` - Cumulative average turnaround time
- `turnaround.sparkline` - Historical trend data
- `dwell.totalDwellDay` - Total dwell time for the day
- `dwell.totalDwellCum` - Cumulative total dwell time
- `dwell.avgDwellDay` - Average dwell time for the day
- `dwell.avgDwellCum` - Cumulative average dwell time
- `dwell.sparkline` - Historical trend data
- `dispatch.today` - Dispatches completed today
- `dispatch.cumMonth` - Cumulative dispatches for the month

**Impact:**
- Users will not see real-time updates for Turnaround Time, Dwell Time, and Dispatch Summary KPIs
- These cards will only update via the 30-second interval timer (which adds random jitter)
- This violates the requirement for real-time KPI updates on gate exit completion

**Recommendation:**
- Add logic to calculate and update these KPI values in the gate exit handler
- Calculate turnaround time based on vehicle entry/exit timestamps
- Calculate dwell time based on vehicle stage durations
- Increment dispatch count when gate exit completes

---

## Next Steps

Based on this verification, the following tasks need to be implemented:

- **Task 2:** Fix gate entry KPI update logic (remove duplicate, fix flag timing)
- **Task 3:** Fix gate exit KPI update logic (fix flag timing, add missing KPI updates)
- **Task 4:** Implement utilization calculation helper function
- **Task 6:** Implement double-counting prevention (already partially implemented)
- **Task 7:** Fix initial state reconciliation (fix flag timing)
- **NEW:** Add Turnaround Time, Dwell Time, and Dispatch Summary updates to gate exit handler

---

## Conclusion

The existing implementation has the **correct logic** for KPI calculations and counter increments, but suffers from **critical bugs** and **missing features**:

1. Duplicate updates in gate entry handler
2. Incorrect sessionStorage flag timing in all three locations
3. **Missing KPI updates for Turnaround Time, Dwell Time, and Dispatch Summary on gate exit**

These bugs must be fixed to ensure accurate KPI counts and prevent double-counting. Additionally, the missing KPI updates must be implemented to provide complete real-time updates across all dashboard cards.
