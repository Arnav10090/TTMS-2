/**
 * Utility functions to manage RFID assignments for vehicles
 */

const RFID_ASSIGNMENTS_KEY = 'vehicleRfidAssignments';

export interface RfidAssignments {
    [vehicleRegNo: string]: string; // Maps vehicle registration number to RFID number
}

export const rfidAssignmentService = {
    /**
     * Get all RFID assignments from localStorage
     */
    getAssignments(): RfidAssignments {
        try {
            const raw = localStorage.getItem(RFID_ASSIGNMENTS_KEY);
            if (!raw) return {};
            return JSON.parse(raw) as RfidAssignments;
        } catch {
            return {};
        }
    },

    /**
     * Save RFID assignment for a specific vehicle
     */
    saveAssignment(vehicleRegNo: string, rfidNo: string) {
        try {
            console.log('saveAssignment called:', { vehicleRegNo, rfidNo });
            const assignments = this.getAssignments();
            console.log('Current assignments:', assignments);
            assignments[vehicleRegNo] = rfidNo;
            localStorage.setItem(RFID_ASSIGNMENTS_KEY, JSON.stringify(assignments));
            console.log('Saved to localStorage:', assignments);
            // Dispatch event to notify other components
            window.dispatchEvent(new Event('rfidAssignments-updated'));
            console.log('Event dispatched: rfidAssignments-updated');
        } catch (error) {
            console.error('Failed to save RFID assignment:', error);
        }
    },

    /**
     * Get RFID assignment for a specific vehicle
     */
    getAssignment(vehicleRegNo: string): string | undefined {
        const assignments = this.getAssignments();
        return assignments[vehicleRegNo];
    },

    /**
     * Remove RFID assignment for a specific vehicle
     */
    removeAssignment(vehicleRegNo: string) {
        try {
            const assignments = this.getAssignments();
            delete assignments[vehicleRegNo];
            localStorage.setItem(RFID_ASSIGNMENTS_KEY, JSON.stringify(assignments));
            window.dispatchEvent(new Event('rfidAssignments-updated'));
        } catch (error) {
            console.error('Failed to remove RFID assignment:', error);
        }
    },
};
