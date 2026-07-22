# Implementation Plan: Real-Time KPI Updates

## Overview

This plan implements real-time KPI updates for the TTMS dashboard by enhancing the existing `useRealTimeData` hook. The implementation will verify and fix the current KPI update logic in the event listeners for gate entry and gate exit completions, ensuring accurate counting with double-counting prevention via sessionStorage flags.

## Tasks

- [x] 1. Review and verify existing KPI update logic
  - Examine the current `onGateEntryCompleted` and `onGateExitCompleted` event handlers in `useRealTimeData.ts`
  - Verify that the KPI update logic matches the requirements (increment/decrement correct counters)
  - Check that utilization calculation uses the correct formula: `Math.round((trucksInside / plantCapacity) * 100)`
  - Verify that sessionStorage flags are being set correctly with format `kpiGateEntryCounted:{vehicleRegNo}`
  - Document any discrepancies or bugs found
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Fix KPI update logic for gate entry
  - [x] 2.1 Implement correct gate entry KPI updates
    - Ensure `vehicles.inDay` increments by 1
    - Ensure `vehicles.inCum` increments by 1
    - Ensure `capacity.trucksInside` increments by 1
    - Ensure `capacity.utilization` is recalculated using `Math.round((trucksInside / plantCapacity) * 100)`
    - Use functional state updates: `setKpiData((prev) => ({ ...prev, ... }))`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 2.2 Write property test for gate entry increments
    - **Property 1: Gate Entry Increments Counters**
    - **Validates: Requirements 1.1, 1.3, 1.4**
    - Generate random initial KPI state
    - Trigger gate entry for MH12AB4829
    - Assert Trucks Inside += 1, Vehicles IN (Day) += 1, Vehicles IN (Cum) += 1

  - [x] 2.3 Implement sessionStorage flag persistence for gate entry
    - After KPI updates, set sessionStorage flag with key `kpiGateEntryCounted:MH12AB4829`
    - Wrap sessionStorage operations in try-catch for error handling
    - _Requirements: 1.5, 4.3_

  - [ ]* 2.4 Write unit test for sessionStorage flag format
    - Trigger gate entry update
    - Assert sessionStorage contains key `kpiGateEntryCounted:MH12AB4829` with value '1'
    - _Requirements: 1.5, 4.3_

- [x] 3. Fix KPI update logic for gate exit
  - [x] 3.1 Implement correct gate exit KPI updates for Capacity and Vehicle Summary
    - Ensure `vehicles.outDay` increments by 1
    - Ensure `vehicles.outCum` increments by 1
    - Ensure `capacity.trucksInside` decrements by 1 with minimum of 0: `Math.max(0, trucksInside - 1)`
    - Ensure `capacity.utilization` is recalculated using `Math.round((trucksInside / plantCapacity) * 100)`
    - Use functional state updates: `setKpiData((prev) => ({ ...prev, ... }))`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [x] 3.1a Implement gate exit KPI updates for Turnaround Time
    - Calculate turnaround time based on vehicle entry/exit timestamps
    - Update `turnaround.avgDay` with new average for the day
    - Update `turnaround.avgCum` with cumulative average
    - Append new value to `turnaround.sparkline` array
    - Update `turnaround.performanceColor` based on avgDay thresholds (< 90: green, < 110: yellow, else: red)
    - Use functional state updates: `setKpiData((prev) => ({ ...prev, ... }))`
    - _Requirements: 2.1, 2.2_

  - [x] 3.1b Implement gate exit KPI updates for Dwell Time
    - Calculate dwell time based on vehicle stage durations
    - Update `dwell.totalDwellDay` by adding vehicle's dwell time
    - Update `dwell.totalDwellCum` with cumulative total
    - Update `dwell.avgDwellDay` with new average for the day
    - Update `dwell.avgDwellCum` with cumulative average
    - Calculate and update `dwell.totalDwellRatioDay` as (totalDwellDay / totalTurnaroundDay) * 100
    - Calculate and update `dwell.avgDwellRatioDay` as (avgDwellDay / avgTurnaroundDay) * 100
    - Append new value to `dwell.sparkline` array
    - Use functional state updates: `setKpiData((prev) => ({ ...prev, ... }))`
    - _Requirements: 2.1, 2.2_

  - [x] 3.1c Implement gate exit KPI updates for Dispatch Summary
    - Increment `dispatch.today` by 1 (represents completed dispatches for the day)
    - Increment `dispatch.cumMonth` by 1 (represents cumulative dispatches for the month)
    - Use functional state updates: `setKpiData((prev) => ({ ...prev, ... }))`
    - _Requirements: 2.1, 2.2_

  - [ ]* 3.2 Write property test for gate exit updates
    - **Property 2: Gate Exit Increments OUT and Decrements IN**
    - **Validates: Requirements 2.1, 2.3, 2.4**
    - Generate random initial KPI state with trucksInside > 0
    - Trigger gate exit for MH12AB4829
    - Assert Trucks Inside -= 1, Vehicles OUT (Day) += 1, Vehicles OUT (Cum) += 1

  - [ ]* 3.3 Write unit test for trucks inside minimum zero
    - Setup KPI state with trucksInside = 0
    - Trigger gate exit
    - Assert trucksInside remains 0 (not negative)
    - _Requirements: 2.6_

  - [x] 3.4 Implement sessionStorage flag persistence for gate exit
    - After KPI updates, set sessionStorage flag with key `kpiGateExitCounted:MH12AB4829`
    - Wrap sessionStorage operations in try-catch for error handling
    - _Requirements: 2.5, 4.3_

- [x] 4. Implement utilization calculation with edge case handling
  - [x] 4.1 Create utilization calculation helper function
    - Implement function: `calculateUtilization(trucksInside: number, plantCapacity: number): number`
    - Use formula: `Math.round((trucksInside / Math.max(1, plantCapacity)) * 100)`
    - Handle zero capacity by treating it as 1
    - Return rounded integer percentage
    - _Requirements: 1.2, 2.2, 7.1, 7.2, 7.3_

  - [ ]* 4.2 Write property test for utilization calculation
    - **Property 3: Utilization Calculation Correctness**
    - **Validates: Requirements 1.2, 2.2, 7.1, 7.2, 7.3**
    - Generate random trucksInside (0-200) and plantCapacity (0-200)
    - Calculate utilization
    - Assert result equals Math.round((trucksInside / Math.max(1, plantCapacity)) * 100)

  - [ ]* 4.3 Write unit test for zero plant capacity
    - Setup: plantCapacity = 0, trucksInside = 5
    - Calculate utilization
    - Assert no division by zero error and utilization = 500 (5/1 * 100)
    - _Requirements: 7.2_

  - [x] 4.4 Update event handlers to use calculation helper
    - Replace inline utilization calculations in `onGateEntryCompleted` and `onGateExitCompleted`
    - Use the new `calculateUtilization` helper function
    - _Requirements: 7.4_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement double-counting prevention
  - [ ] 6.1 Add sessionStorage flag checks in event handlers
    - In `onGateEntryCompleted`, check for `kpiGateEntryCounted:MH12AB4829` before updating
    - In `onGateExitCompleted`, check for `kpiGateExitCounted:MH12AB4829` before updating
    - Skip KPI updates if flag exists
    - _Requirements: 4.1, 4.2_

  - [ ]* 6.2 Write property test for idempotent updates
    - **Property 6: Idempotent Updates**
    - **Validates: Requirements 4.2, 6.3**
    - Generate random initial KPI state
    - Trigger same gate entry event twice
    - Assert counts only increment once

  - [ ] 6.3 Implement vehicle-specific flag keys
    - Ensure flag keys include vehicle registration number
    - Format: `kpiGateEntryCounted:{vehicleRegNo}` and `kpiGateExitCounted:{vehicleRegNo}`
    - _Requirements: 6.1, 6.2, 6.4_

  - [ ]* 6.4 Write property test for vehicle-specific flags
    - **Property 11: Vehicle-Specific Flag Keys**
    - **Validates: Requirements 6.1, 6.2, 6.4**
    - Generate random vehicle registration numbers
    - Trigger updates for different vehicles
    - Assert each vehicle has its own sessionStorage flag

- [ ] 7. Implement initial state reconciliation
  - [ ] 7.1 Create ensureInitialKpiCounts function
    - Read all RFID assignments from localStorage using `rfidAssignmentService.getAssignments()`
    - Read all gate exit completions from localStorage key `vehicleGateExitCompleted`
    - For each vehicle with RFID assignment and no `kpiGateEntryCounted:{vehicleRegNo}` flag:
      - Apply gate entry KPI updates
      - Set sessionStorage flag
    - For each vehicle with gate exit completion and no `kpiGateExitCounted:{vehicleRegNo}` flag:
      - Apply gate exit KPI updates
      - Set sessionStorage flag
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 7.2 Write property test for reconciliation
    - **Property 10: Reconciliation Applies Missing Updates**
    - **Validates: Requirements 5.3, 5.4, 5.5**
    - Setup localStorage with completed stages for random vehicles
    - Clear sessionStorage
    - Run reconciliation
    - Assert KPI counts reflect completed stages and flags are set

  - [ ] 7.3 Call reconciliation in useEffect
    - Call `ensureInitialKpiCounts()` after initial data load in the existing useEffect
    - Ensure it runs only once on mount
    - _Requirements: 4.4_

  - [ ]* 7.4 Write integration test for page refresh reconciliation
    - Setup localStorage with RFID assignment and gate exit for MH12AB4829
    - Clear sessionStorage
    - Initialize dashboard
    - Assert KPI counts are correct and sessionStorage flags are set
    - _Requirements: 4.4, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8. Verify event dispatching and listening
  - [ ] 8.1 Verify localStorage event dispatching
    - Confirm that saving RFID assignment dispatches `rfidAssignments-updated` event
    - Confirm that saving gate exit completion dispatches `vehicleGateExitCompleted-updated` event
    - This should already be implemented in the codebase
    - _Requirements: 3.1, 3.2_

  - [ ] 8.2 Verify event listeners are properly attached
    - Confirm `onGateEntryCompleted` is attached to `rfidAssignments-updated` event
    - Confirm `onGateExitCompleted` is attached to `vehicleGateExitCompleted-updated` event
    - This should already be implemented in the existing useRealTimeData hook
    - _Requirements: 3.3, 3.4_

  - [ ]* 8.3 Write integration test for event flow
    - Save RFID assignment to localStorage
    - Assert `rfidAssignments-updated` event is dispatched
    - Assert KPI state updates
    - Save gate exit completion to localStorage
    - Assert `vehicleGateExitCompleted-updated` event is dispatched
    - Assert KPI state updates
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 9. Add error handling
  - [ ] 9.1 Wrap localStorage operations in try-catch
    - Add try-catch blocks around all localStorage.getItem and JSON.parse calls
    - Default to empty object on parse failure
    - Log errors to console
    - _Requirements: Error Handling_

  - [ ] 9.2 Wrap sessionStorage operations in try-catch
    - Add try-catch blocks around all sessionStorage.getItem and sessionStorage.setItem calls
    - Allow updates to proceed if sessionStorage fails (may result in double-counting)
    - Log errors to console
    - _Requirements: Error Handling_

  - [ ]* 9.3 Write unit tests for error handling
    - Mock localStorage to throw error
    - Verify system continues with default values
    - Mock sessionStorage to throw error
    - Verify updates still proceed
    - _Requirements: Error Handling_

- [ ] 10. Verify component re-rendering
  - [ ] 10.1 Verify CapacityUtilizationKPI receives updated props
    - Confirm component receives `data.utilization`, `data.plantCapacity`, `data.trucksInside`
    - Confirm component re-renders when kpiData.capacity changes
    - _Requirements: 8.3_

  - [ ] 10.2 Verify VehicleSummaryKPI receives updated props
    - Confirm component receives `data.inDay`, `data.outDay`, `data.inCum`, `data.outCum`
    - Confirm component re-renders when kpiData.vehicles changes
    - _Requirements: 8.4_

  - [ ]* 10.3 Write integration test for component updates
    - Render dashboard with initial KPI state
    - Trigger gate entry update
    - Assert CapacityUtilizationKPI displays new values
    - Assert VehicleSummaryKPI displays new values
    - _Requirements: 8.3, 8.4_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The existing `useRealTimeData` hook already has event listeners and some KPI update logic - this implementation focuses on verifying and fixing that logic
- All KPI updates use React functional state updates to ensure correct access to previous state
- SessionStorage is used instead of localStorage for counting flags to ensure they reset on new browser sessions
- The target vehicle MH12AB4829 is hardcoded in the requirements, but the implementation should support any vehicle registration number for future extensibility
- **IMPORTANT:** Turnaround Time, Dwell Time, and Dispatch Summary KPIs should ONLY update when gate exit stage is completed (not on gate entry)
- Turnaround time calculation requires tracking vehicle entry and exit timestamps
- Dwell time calculation requires tracking time spent in various stages (parking, tare weight, loading, etc.)
- Dispatch count increments by 1 for each completed gate exit (represents a completed vehicle dispatch)
