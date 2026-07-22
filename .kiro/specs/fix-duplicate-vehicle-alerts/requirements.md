# Requirements Document

## Introduction

This specification addresses a critical bug in the vehicle alert system where duplicate alert messages appear in the footer after acknowledging a popup alert. When the application restarts and a user acknowledges the popup alert for vehicle MH12AB4829, multiple duplicate messages with different timestamps appear in the footer instead of a single consolidated message. This document defines the requirements to ensure proper alert deduplication and correct footer message formatting.

## Glossary

- **Alert_System**: The subsystem responsible for creating, managing, and displaying vehicle alerts
- **AlertManager**: The singleton service that handles alert creation, storage, and deduplication logic
- **Footer_Component**: The UI component (AlarmsFooter.tsx) that displays acknowledged alerts at the bottom of the screen
- **Pending_Alert**: An alert that has been created but not yet acknowledged by the user
- **Acknowledged_Alert**: An alert that the user has acknowledged via the popup, which should then appear in the footer
- **Vehicle_Stage_Key**: A unique identifier composed of vehicle registration number and stage name (e.g., "MH12AB4829-Reporting")
- **Deduplication**: The process of preventing multiple alerts for the same vehicle and stage combination

## Requirements

### Requirement 1: Alert Creation Deduplication

**User Story:** As a system operator, I want the system to prevent duplicate alerts for the same vehicle and stage, so that I don't receive redundant notifications.

#### Acceptance Criteria

1. WHEN an alert is created for a vehicle and stage combination, THE Alert_System SHALL check if a pending or recent alert exists for the same vehicle and stage
2. WHEN a pending alert exists for the same vehicle and stage, THE Alert_System SHALL update the existing alert's timestamp instead of creating a new alert
3. WHEN a recent alert (within 2 minutes) exists in history for the same vehicle and stage, THE Alert_System SHALL suppress the new alert creation
4. WHEN checking for duplicates, THE Alert_System SHALL use both vehicle registration number and stage name as the composite key
5. WHEN an alert is suppressed due to deduplication, THE Alert_System SHALL log the suppression for debugging purposes

### Requirement 2: Footer Message Deduplication

**User Story:** As a system operator, I want only one footer message per vehicle after acknowledging an alert, so that the footer remains clean and readable.

#### Acceptance Criteria

1. WHEN an alert is acknowledged, THE Footer_Component SHALL remove any existing footer entries for the same vehicle before adding the new entry
2. WHEN identifying duplicate footer entries, THE Footer_Component SHALL match by vehicle registration number
3. WHEN loading footer state from localStorage, THE Footer_Component SHALL deduplicate entries by vehicle registration number keeping the newest entry
4. WHEN a new footer entry is added via the custom event, THE Footer_Component SHALL filter out previous entries that reference the same vehicle
5. THE Footer_Component SHALL maintain deduplication across page refreshes and app restarts

### Requirement 3: Footer Message Format

**User Story:** As a system operator, I want footer messages to display in a consistent format with the correct timestamp, so that I can quickly understand when events occurred.

#### Acceptance Criteria

1. WHEN an alert is acknowledged, THE Alert_System SHALL format the footer message as "Vehicle {regNo} has Reported at the Main Gate at {time}"
2. WHEN formatting the timestamp, THE Alert_System SHALL use the alert's original creation timestamp
3. WHEN formatting the timestamp, THE Alert_System SHALL use 12-hour format with AM/PM notation
4. THE Alert_System SHALL use the stage name "Main Gate" for alerts with stage "Reporting"
5. THE Alert_System SHALL preserve the original alert timestamp through the acknowledgment process

### Requirement 4: Alert Lifecycle Management

**User Story:** As a system operator, I want alerts to transition correctly from pending to acknowledged state, so that the system accurately reflects the current alert status.

#### Acceptance Criteria

1. WHEN an alert is created, THE Alert_System SHALL store it in the pending alerts collection
2. WHEN an alert is acknowledged, THE Alert_System SHALL move it from pending to acknowledged collection
3. WHEN moving an alert to acknowledged state, THE Alert_System SHALL set the acknowledged flag to true
4. WHEN an alert is acknowledged, THE Alert_System SHALL trigger the footer display event with the formatted message
5. THE Alert_System SHALL maintain separate storage for pending, acknowledged, and historical alerts

### Requirement 5: App Restart Alert Handling

**User Story:** As a system operator, I want the special vehicle alert to appear only once per server restart, so that I don't see duplicate alerts on every page refresh.

#### Acceptance Criteria

1. WHEN the application initializes after a server restart, THE Alert_System SHALL check for a server restart token in localStorage
2. WHEN a server restart token exists, THE Alert_System SHALL use it to track whether the special vehicle alert has been shown
3. WHEN the special vehicle alert has already been shown for the current server restart, THE Alert_System SHALL not create a new alert
4. WHEN no server restart token exists, THE Alert_System SHALL fall back to sessionStorage to prevent duplicate alerts within the same session
5. THE Alert_System SHALL create the special vehicle alert with stage "Reporting" and alertLevel "info"

### Requirement 6: Footer Entry Identification

**User Story:** As a system operator, I want footer entries to be uniquely identified by vehicle registration number, so that updates replace previous entries instead of creating duplicates.

#### Acceptance Criteria

1. WHEN creating a footer entry, THE Alert_System SHALL use the vehicle registration number as the entry ID
2. WHEN a footer entry with the same ID already exists, THE Footer_Component SHALL replace it with the new entry
3. THE Footer_Component SHALL use the vehicle registration number from the equipment field as the stable identifier
4. WHEN extracting the vehicle registration number, THE Alert_System SHALL handle both the equipment field and message text parsing
5. THE Footer_Component SHALL maintain ID-based deduplication in the custom event handler
