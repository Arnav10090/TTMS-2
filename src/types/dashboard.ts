import { KPIData } from './kpi'

export type ParkingCell = { status: 'available'|'occupied'|'reserved'; label: string }
export type ParkingGrid = ParkingCell[][]
export type ParkingData = { 'AREA-1': ParkingGrid; 'AREA-2': ParkingGrid }

export type DashboardData = {
  kpi: KPIData
}
