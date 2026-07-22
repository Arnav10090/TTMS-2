export const VEHICLE_NUMBERS = [
    'MH12AB4829', 'MH14KT7391', 'MH01ZX2046', 'MH20LP6583', 'MH15QR9104',
    'MH04NM3728', 'MH18DX5610', 'MH09UV8492', 'MH27AS1357', 'MH10BK6649',
    'MH13CJ2905', 'MH02RT7816', 'MH16PL4480', 'MH22EX9032', 'MH05WD5174',
    'MH19FY8261', 'MH11GH3409', 'MH26MP6948', 'MH08AL0725', 'MH23TS4586',
    'MH06RN8193', 'MH21DV5627', 'MH03KP9941', 'MH17HB6308', 'MH25XC1749'
];

// Historical vehicles that have already completed all stages (for History table)
export const HISTORY_VEHICLE_NUMBERS = [
    'MH07JF4821', 'MH24QD7609', 'MH28BR1954', 'MH30CU8437', 'MH31EG6028',
    'MH32HM9145', 'MH33JK2786', 'MH34LN5302', 'MH35PO7614', 'MH36RS4098',
    'MH37TA8520', 'MH38UV1947', 'MH39WX6381', 'MH40YZ7206', 'MH41AC9653',
    'MH42DE1849', 'MH43FG5726', 'MH44HJ8305', 'MH45KL4192', 'MH46MN7608',
    'MH47PQ2059', 'MH48RS6813', 'MH49TU9347', 'MH50VW1584', 'MH51XY7062'
];

// Deterministic accessor
export const getVehicleByIndex = (index: number): string => {
    return VEHICLE_NUMBERS[Math.abs(index) % VEHICLE_NUMBERS.length];
};

export const getHistoricalVehicleByIndex = (index: number): string => {
    return HISTORY_VEHICLE_NUMBERS[Math.abs(index) % HISTORY_VEHICLE_NUMBERS.length];
};

export const getRandomVehicle = (): string => {
    return getVehicleByIndex(Math.floor(Math.random() * VEHICLE_NUMBERS.length));
};

// Deterministic time generation:
// Base time: Today at 8:00 AM
// Increment: 15 minutes per index
export const getVehicleEntryTime = (index: number): Date => {
    const baseDate = new Date();
    baseDate.setHours(8, 0, 0, 0); // Start at 8:00 AM today
    // Add index * 15 minutes
    return new Date(baseDate.getTime() + Math.abs(index) * 15 * 60000);
};

// Historical vehicle entry times (past dates)
// Base time: Yesterday at 6:00 AM
// Increment: 30 minutes per index
export const getHistoricalVehicleEntryTime = (index: number): Date => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 1); // Yesterday
    baseDate.setHours(6, 0, 0, 0); // Start at 6:00 AM
    // Add index * 30 minutes
    return new Date(baseDate.getTime() + Math.abs(index) * 30 * 60000);
};
