# Implementation Plan: Fix Duplicate Vehicle Alerts

## Overview

This implementation plan addresses the duplicate vehicle alert messages bug by strengthening deduplication logic in the AlertManager and AlarmsFooter component. The approach focuses on using vehicle registration number as a stable identifier and ensuring deduplication occurs at all critical points in the alert lifecycle.

## Tasks

- [x] 1. Fix AlertManager deduplication logic
  - [x] 1.1 Update sendAlert() to check for existing pending alerts
    - Modify the duplicate suppression logic to check pending alerts first
    - If a pending alert exists for the same vehicle+stage, update its timestamp and return it
    - Only move pending to history if no match is found
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ]* 1.2 Write property test for pending alert update
    - **Property 1: Pending Alert Update on Duplicate**
    - **Validates: Requirements 1.2, 1.4**
  
  - [ ]* 1.3 Write property test for history-based suppression
    - **Property 2: History-Based Alert Suppression**
    - **Validates: Requirements 1.3, 1.4**
  
  - [ ]* 1.4 Write unit test for logging suppression
    - Test that suppressed alerts are logged to console
    - _Requirements: 1.5_

- [x] 2. Fix AlertManager acknowledgment flow
  - [x] 2.1 Update acknowledge() to use vehicle reg no as footer entry ID
    - Change the footer entry ID from alert.id to item.vehicleRegNo
    - Ensure the equipment field is set to vehicle registration number
    - Preserve the original alert timestamp in the footer entry
    - _Requirements: 3.2, 3.5, 6.1, 6.3_
  
  - [x] 2.2 Update message formatting to use correct stage name
    - Map stage "Reporting" to "Main Gate" in the footer message
    - Ensure timestamp is formatted in 12-hour format with AM/PM
    - Use the pattern "Vehicle {regNo} has Reported at the Main Gate at {time}"
    - _Requirements: 3.1, 3.3, 3.4_
  
  - [ ]* 2.3 Write property test for timestamp preservation
    - **Property 6: Timestamp Preservation Through Acknowledgment**
    - **Validates: Requirements 3.2, 3.5**
  
  - [ ]* 2.4 Write property test for message format
    - **Property 5: Message Format Consistency**
    - **Validates: Requirements 3.1, 3.3**
  
  - [ ]* 2.5 Write property test for alert lifecycle
    - **Property 7: Alert Lifecycle Transition**
    - **Validates: Requirements 4.2, 4.3, 4.4**

- [x] 3. Checkpoint - Ensure AlertManager tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Fix AlarmsFooter deduplication
  - [x] 4.1 Update initial state loading to deduplicate by vehicle reg no
    - Modify the useState initialization to deduplicate by equipment field
    - Keep only the newest entry for each vehicle registration number
    - Use a Set to track seen vehicle registration numbers
    - _Requirements: 2.3, 2.5_
  
  - [x] 4.2 Update custom event handler to deduplicate before adding
    - Extract vehicle reg no from both equipment field and message text
    - Filter out existing entries that match the vehicle reg no
    - Add the new entry with vehicle reg no as ID
    - _Requirements: 2.1, 2.2, 2.4, 6.2, 6.4, 6.5_
  
  - [ ]* 4.3 Write property test for footer deduplication
    - **Property 3: Footer Deduplication by Vehicle ID**
    - **Validates: Requirements 2.1, 2.2, 2.4, 6.2, 6.5**
  
  - [ ]* 4.4 Write property test for footer persistence deduplication
    - **Property 4: Footer State Persistence Deduplication**
    - **Validates: Requirements 2.3, 2.5**
  
  - [ ]* 4.5 Write property test for vehicle ID extraction
    - **Property 8: Vehicle ID Extraction and Usage**
    - **Validates: Requirements 6.1, 6.3, 6.4**

- [x] 5. Add error handling
  - [x] 5.1 Add try-catch blocks for localStorage operations
    - Wrap all localStorage.getItem() and setItem() calls
    - Log errors to console for debugging
    - Return null or empty arrays as fallback values
    - _Requirements: All requirements (error handling)_
  
  - [x] 5.2 Add validation for event detail structure
    - Check that custom event detail exists before processing
    - Use optional chaining for safe property access
    - Handle missing vehicle registration number gracefully
    - _Requirements: All requirements (error handling)_
  
  - [x] 5.3 Add timestamp validation and fallback
    - Validate timestamp before formatting
    - Use current time as fallback if parsing fails
    - Log invalid timestamps for debugging
    - _Requirements: 3.2, 3.3, 3.5_
  
  - [ ]* 5.4 Write unit tests for error conditions
    - Test corrupted localStorage (invalid JSON)
    - Test missing fields in alert config
    - Test invalid timestamps
    - Test localStorage full scenario

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Verify restart token behavior
  - [x] 7.1 Test that restart token prevents duplicate alerts
    - Verify that the existing token-based logic works with new deduplication
    - Ensure alerts are suppressed when shown flag is set for current token
    - Test fallback to sessionStorage when no restart token exists
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 7.2 Write property test for restart token suppression
    - **Property 9: Restart Token Alert Suppression**
    - **Validates: Requirements 5.2, 5.3**
  
  - [ ]* 7.3 Write unit tests for restart token edge cases
    - Test with no restart token (sessionStorage fallback)
    - Test with special vehicle alert configuration
    - Test that alert has correct stage and alertLevel

- [ ] 8. Integration testing and verification
  - [ ] 8.1 Test the exact bug scenario from the issue
    - Simulate app restart with serverRestartToken
    - Create alert for vehicle MH12AB4829
    - Acknowledge the alert
    - Verify only one footer entry appears
    - Verify message format is correct
    - _Requirements: All requirements_
  
  - [ ]* 8.2 Write integration test for end-to-end flow
    - Test alert creation → acknowledgment → footer display
    - Verify deduplication at each stage
    - Test with multiple vehicles and stages
  
  - [ ] 8.3 Manual testing checklist
    - Clear localStorage and restart app
    - Verify alert popup appears for MH12AB4829
    - Acknowledge the popup
    - Verify exactly one footer message appears
    - Verify message says "Vehicle MH12AB4829 has Reported at the Main Gate at 8:00 AM"
    - Refresh page and verify footer message persists
    - Restart app again and verify no duplicate alert is created

- [ ] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- The implementation focuses on three key areas: AlertManager deduplication, AlarmsFooter deduplication, and error handling
