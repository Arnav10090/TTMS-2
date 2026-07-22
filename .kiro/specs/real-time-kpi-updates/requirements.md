# Requirements Document

## Introduction

This document specifies the requirements for implementing real-time KPI updates in the TTMS dashboard. The system shall automatically update KPI cards when specific vehicle stage completions occur, providing immediate feedback to users without requiring page refreshes.

## Glossary

- **KPI**: Key Performance Indicator - A measurable value that demonstrates how effectively the system is achieving key business objectives
- **Dashboard**: The main monitoring interface displaying real-time KPI metrics and vehicle status
- **Gate_Entry_Stage**: The initial stage where a vehicle enters the plant and receives RFID assignment
- **Gate_Exit_Stage**: The final stage where a vehicle exits the plant after completing all operations
- **Capacity_Utilization_KPI**: A KPI card displaying plant capacity utilization percentage and trucks inside count
- **Vehicle_Summary_KPI**: A KPI card displaying vehicle in/out counts for day and cumulative periods
- **RFID_Assignment**: The process of assigning an RFID tag to a vehicle, stored in localStorage under key 'vehicleRfidAssignments'
- **Gate_Exit_Completion**: The process of marking a vehicle's gate exit as completed, stored in localStorage under key 'vehicleGateExitCompleted'
- **Plant_Capacity**: The maximum number of trucks that can be inside the plant simultaneously
- **Trucks_Inside**: The current count of trucks physically present inside the plant
- **Utilization_Percentage**: The ratio of trucks inside to plant capacity, expressed as a percentage
- **Session_Storage**: Browser storage mechanism used to prevent double-counting of KPI updates across page refreshes
- **Target_Vehicle**: The specific vehicle registration number MH12AB4829 for which KPI updates are tracked

## Requirements

### Requirement 1: Gate Entry KPI Updates

**User Story:** As a dashboard user, I want the Capacity Utilization and Vehicle Summary KPIs to update immediately when a vehicle completes gate entry, so that I can see real-time plant status.

#### Acceptance Criteria

1. WHEN Gate_Entry_Stage is completed for Target_Vehicle, THE Capacity_Utilization_KPI SHALL increment Trucks_Inside by 1
2. WHEN Gate_Entry_Stage is completed for Target_Vehicle, THE Capacity_Utilization_KPI SHALL recalculate Utilization_Percentage as (Trucks_Inside / Plant_Capacity) * 100
3. WHEN Gate_Entry_Stage is completed for Target_Vehicle, THE Vehicle_Summary_KPI SHALL increment "Vehicles IN (Day)" by 1
4. WHEN Gate_Entry_Stage is completed for Target_Vehicle, THE Vehicle_Summary_KPI SHALL increment "Vehicles IN (Cum)" by 1
5. WHEN Gate_Entry_Stage is completed for Target_Vehicle, THE Dashboard SHALL persist the update flag in Session_Storage to prevent double-counting

### Requirement 2: Gate Exit KPI Updates

**User Story:** As a dashboard user, I want the Capacity Utilization and Vehicle Summary KPIs to update immediately when a vehicle completes gate exit, so that I can track vehicle throughput in real-time.

#### Acceptance Criteria

1. WHEN Gate_Exit_Stage is completed for Target_Vehicle, THE Capacity_Utilization_KPI SHALL decrement Trucks_Inside by 1
2. WHEN Gate_Exit_Stage is completed for Target_Vehicle, THE Capacity_Utilization_KPI SHALL recalculate Utilization_Percentage as (Trucks_Inside / Plant_Capacity) * 100
3. WHEN Gate_Exit_Stage is completed for Target_Vehicle, THE Vehicle_Summary_KPI SHALL increment "Vehicles OUT (Day)" by 1
4. WHEN Gate_Exit_Stage is completed for Target_Vehicle, THE Vehicle_Summary_KPI SHALL increment "Vehicles OUT (Cum)" by 1
5. WHEN Gate_Exit_Stage is completed for Target_Vehicle, THE Dashboard SHALL persist the update flag in Session_Storage to prevent double-counting
6. IF Trucks_Inside would become negative, THEN THE Capacity_Utilization_KPI SHALL set Trucks_Inside to 0

### Requirement 3: Event-Driven Updates

**User Story:** As a system architect, I want KPI updates to be triggered by localStorage events, so that updates propagate across all dashboard instances without polling.

#### Acceptance Criteria

1. WHEN RFID_Assignment is saved to localStorage for Target_Vehicle, THE Dashboard SHALL dispatch 'rfidAssignments-updated' event
2. WHEN Gate_Exit_Completion is saved to localStorage for Target_Vehicle, THE Dashboard SHALL dispatch 'vehicleGateExitCompleted-updated' event
3. WHEN 'rfidAssignments-updated' event is received, THE Dashboard SHALL execute gate entry KPI update logic
4. WHEN 'vehicleGateExitCompleted-updated' event is received, THE Dashboard SHALL execute gate exit KPI update logic

### Requirement 4: Double-Counting Prevention

**User Story:** As a dashboard user, I want KPI counts to remain accurate across page refreshes, so that metrics reflect true vehicle counts without duplication.

#### Acceptance Criteria

1. WHEN Dashboard initializes, THE Dashboard SHALL check Session_Storage for existing update flags for Target_Vehicle
2. WHEN an update flag exists in Session_Storage for Target_Vehicle, THE Dashboard SHALL skip the corresponding KPI update
3. WHEN a KPI update is applied for Target_Vehicle, THE Dashboard SHALL store a unique flag in Session_Storage with format 'kpiGateEntryCounted:{vehicleRegNo}' or 'kpiGateExitCounted:{vehicleRegNo}'
4. WHEN Session_Storage is cleared, THE Dashboard SHALL re-apply KPI updates for any completed stages found in localStorage

### Requirement 5: Initial State Reconciliation

**User Story:** As a dashboard user, I want KPI counts to reflect already-completed vehicle stages when I load the dashboard, so that I see accurate current state immediately.

#### Acceptance Criteria

1. WHEN Dashboard loads, THE Dashboard SHALL read all RFID_Assignment entries from localStorage
2. WHEN Dashboard loads, THE Dashboard SHALL read all Gate_Exit_Completion entries from localStorage
3. FOR ALL vehicles with RFID_Assignment and no corresponding Session_Storage flag, THE Dashboard SHALL apply gate entry KPI updates
4. FOR ALL vehicles with Gate_Exit_Completion and no corresponding Session_Storage flag, THE Dashboard SHALL apply gate exit KPI updates
5. WHEN initial reconciliation completes, THE Dashboard SHALL set Session_Storage flags to prevent duplicate updates

### Requirement 6: Vehicle-Specific Tracking

**User Story:** As a system administrator, I want KPI updates to be tracked per vehicle registration number, so that each vehicle's stage completions are counted exactly once.

#### Acceptance Criteria

1. WHEN storing update flags in Session_Storage, THE Dashboard SHALL include the vehicle registration number in the key
2. WHEN checking for existing updates, THE Dashboard SHALL query Session_Storage using the vehicle-specific key
3. WHEN Target_Vehicle completes a stage multiple times in the same session, THE Dashboard SHALL only count the first completion
4. WHEN a different vehicle completes the same stage, THE Dashboard SHALL count it independently

### Requirement 7: Utilization Calculation Accuracy

**User Story:** As a dashboard user, I want the utilization percentage to be calculated correctly, so that I can trust the capacity metrics displayed.

#### Acceptance Criteria

1. WHEN calculating Utilization_Percentage, THE Dashboard SHALL use the formula: Math.round((Trucks_Inside / Plant_Capacity) * 100)
2. WHEN Plant_Capacity is 0, THE Dashboard SHALL treat it as 1 to prevent division by zero
3. WHEN Utilization_Percentage is calculated, THE Dashboard SHALL round to the nearest integer
4. WHEN Trucks_Inside changes, THE Dashboard SHALL immediately recalculate and update Utilization_Percentage

### Requirement 8: React State Management

**User Story:** As a developer, I want KPI updates to use React state management, so that UI components re-render automatically when data changes.

#### Acceptance Criteria

1. WHEN a KPI update occurs, THE Dashboard SHALL use setKpiData state updater function
2. WHEN updating KPI state, THE Dashboard SHALL use functional state updates to access previous state
3. WHEN KPI state changes, THE Dashboard SHALL trigger re-render of Capacity_Utilization_KPI component
4. WHEN KPI state changes, THE Dashboard SHALL trigger re-render of Vehicle_Summary_KPI component
