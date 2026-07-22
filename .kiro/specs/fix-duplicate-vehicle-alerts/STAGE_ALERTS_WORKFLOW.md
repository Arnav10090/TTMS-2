# Stage Completion Alerts Workflow

## Overview

The system now automatically generates popup alerts as vehicle MH12AB4829 completes each stage of the logistics process.

## Alert Workflow

### 1. **Reporting (Initial Alert)**
- **Trigger**: On app restart (via serverRestartToken)
- **Popup Message**: "Vehicle MH12AB4829 is delayed at Reporting (0m)"
- **Footer Message**: "Vehicle MH12AB4829 has Reported at the Main Gate at 8:00 AM"
- **Stage**: Reporting → Main Gate

### 2. **Gate Entry / Document Verification**
- **Trigger**: When RFID is assigned to vehicle (document verification completed)
- **Event**: `rfidAssignments-updated`
- **Popup Message**: "Vehicle MH12AB4829 is delayed at Gate Entry (0m)"
- **Footer Message**: "Vehicle MH12AB4829 has completed Document Verification"
- **Stage**: Gate Entry

### 3. **Parking**
- **Trigger**: When parking spot is released and marked as completed
- **Event**: `vehicleParkingCompleted-updated`
- **Popup Message**: "Vehicle MH12AB4829 is delayed at Parking (0m)"
- **Footer Message**: "Vehicle MH12AB4829 has completed Parking"
- **Stage**: Parking

### 4. **Tare Weight**
- **Trigger**: When tare weight station is completed
- **Event**: `vehicleTareWeightCompleted-updated`
- **Popup Message**: "Vehicle MH12AB4829 is delayed at Tare Weight (0m)"
- **Footer Message**: "Vehicle MH12AB4829 has completed Tare Weight"
- **Stage**: Tare Weight

### 5. **Loading**
- **Trigger**: When loading gate is completed
- **Event**: `vehicleLoadingGateCompleted-updated`
- **Popup Message**: "Vehicle MH12AB4829 is delayed at Loading (0m)"
- **Footer Message**: "Vehicle MH12AB4829 has completed Loading"
- **Stage**: Loading

### 6. **Wt Post Loading**
- **Trigger**: When weight post loading is completed
- **Event**: `vehicleWtPostLoadingCompleted-updated`
- **Popup Message**: "Vehicle MH12AB4829 is delayed at Wt Post Loading (0m)"
- **Footer Message**: "Vehicle MH12AB4829 has completed Wt Post Loading"
- **Stage**: Wt Post Loading

### 7. **Gate Exit**
- **Trigger**: When gate exit is completed
- **Event**: `vehicleGateExitCompleted-updated`
- **Popup Message**: "Vehicle MH12AB4829 is delayed at Gate Exit (0m)"
- **Footer Message**: "Vehicle MH12AB4829 has completed Gate Exit"
- **Stage**: Gate Exit

## Implementation Details

### Event Listeners (useRealTimeData.ts)

Each stage completion triggers an event listener that:
1. Checks if the special vehicle (MH12AB4829) has completed the stage
2. Checks if alert has already been shown (using sessionStorage)
3. Calls `AlertManager.sendAlert()` with stage-specific information
4. Marks alert as shown to prevent duplicates

### Message Formatting (alerts.ts)

The `AlertManager.acknowledge()` method formats messages based on stage:
- **Reporting**: "Vehicle {regNo} has Reported at the Main Gate at {time}"
- **Other stages**: "Vehicle {regNo} has completed {StageName}"

### Deduplication

- Each stage alert is shown only once per session (using sessionStorage)
- Footer deduplicates by vehicle registration number
- Only the newest alert for each vehicle is displayed

## Testing Workflow

### Complete Flow Test:

1. **Restart App**
   - Footer is empty
   - Wait ~5 seconds
   - Popup appears: "Reporting" alert
   - Acknowledge → Footer shows: "Vehicle MH12AB4829 has Reported at the Main Gate at 8:00 AM"

2. **Complete Document Verification**
   - Go to Document Verification page
   - Complete doc verification for MH12AB4829
   - RFID is assigned
   - Popup appears: "Gate Entry" alert
   - Acknowledge → Footer shows: "Vehicle MH12AB4829 has completed Document Verification"

3. **Complete Parking**
   - Vehicle is assigned to parking spot
   - After 25 seconds, parking is marked as completed
   - Popup appears: "Parking" alert
   - Acknowledge → Footer shows: "Vehicle MH12AB4829 has completed Parking"

4. **Complete Tare Weight**
   - Vehicle is assigned to tare weight station
   - After 25 seconds, tare weight is marked as completed
   - Popup appears: "Tare Weight" alert
   - Acknowledge → Footer shows: "Vehicle MH12AB4829 has completed Tare Weight"

5. **Complete Loading**
   - Vehicle is assigned to loading gate
   - After 25 seconds, loading is marked as completed
   - Popup appears: "Loading" alert
   - Acknowledge → Footer shows: "Vehicle MH12AB4829 has completed Loading"

6. **Complete Wt Post Loading**
   - Vehicle is assigned to wt post loading
   - After 25 seconds, wt post loading is marked as completed
   - Popup appears: "Wt Post Loading" alert
   - Acknowledge → Footer shows: "Vehicle MH12AB4829 has completed Wt Post Loading"

7. **Complete Gate Exit**
   - Vehicle is automatically assigned to gate exit
   - After 15 seconds, gate exit is marked as completed
   - Popup appears: "Gate Exit" alert
   - Acknowledge → Footer shows: "Vehicle MH12AB4829 has completed Gate Exit"

### Expected Footer State:

After completing all stages and acknowledging all alerts, the footer should show only ONE entry:
- **"Vehicle MH12AB4829 has completed Gate Exit"** (the most recent alert)

All previous alerts for the same vehicle are replaced by the newest one (deduplication by vehicle reg no).

## Files Modified

1. **src/hooks/useRealTimeData.ts**
   - Added event listeners for all stage completions
   - Each listener triggers `AlertManager.sendAlert()` for MH12AB4829
   - Uses sessionStorage to prevent duplicate alerts per session

2. **src/utils/alerts.ts**
   - Updated `acknowledge()` method to format messages based on stage
   - Special handling for "Reporting" → "Main Gate"
   - Completion messages for all other stages

3. **src/components/reports/SystemAlertsBanner.tsx**
   - Already updated to handle deduplication and persistence
   - Shows only acknowledged alerts
   - Clears on server restart, persists on page refresh
