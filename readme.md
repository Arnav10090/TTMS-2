# Truck Turnaround Time Monitoring System (TTR)

A comprehensive React-based dashboard application for monitoring truck turnaround times, facility management, and logistics operations. Built with modern web technologies for real-time data visualization and interactive operational management.

## Overview

The TTR Dashboard provides a centralized platform for tracking and optimizing truck turnaround times at logistics facilities. It includes features for real-time KPI monitoring, vehicle tracking, parking management, document verification, and operational scheduling.

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fast build and dev server)
- **Routing**: React Router v6 for client-side navigation
- **Styling**: Tailwind CSS with PostCSS and Autoprefixer
- **Charting**: Recharts for data visualization
- **Icons**: lucide-react for UI icons
- **Utilities**: date-fns for date formatting, classnames for conditional styling

## Features

### Dashboard
- **Real-time KPI Monitoring**: Track capacity utilization, turnaround times, vehicle summaries, and dispatch metrics
- **Trends & Comparisons**: View trend indicators and compare metrics across different time ranges (Today, Monthly, Yearly)
- **Parking Management**: Visual grid-based parking area management with status indicators
- **Vehicle Tracking**: Comprehensive vehicle table with progress tracking and TTR (Turnaround Time) metrics

### Additional Modules
- **Document Verification**: Upload and manage documents with RFID module integration
- **Scheduling**: Manage facility scheduling with gate status and parking area coordination
- **Reports**: Generate and view operational reports with timeline and analysis
- **Alarms**: System alerts and notifications for operational anomalies
- **Historical Data**: Access and analyze historical performance data

## Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will run at `http://localhost:3000` with hot module reloading.

3. **Build for production**
   ```bash
   npm run build
   ```
   Creates an optimized production build in the `dist/` folder.

4. **Preview the production build**
   ```bash
   npm start
   ```
   Runs the built app on `http://localhost:3000` using Vite preview server.

## Project Structure

```
ttr-dashboard/
├── index.html                 # HTML entry point
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Route definitions with React Router
│   ├── app/                  # Page components (migrated from Next.js structure)
│   │   ├── layout.tsx        # App layout wrapper
│   │   ├── globals.css       # Global styles
│   │   ├── page.tsx          # Main dashboard page
│   │   ├── alarms/page.tsx   # Alarms page
│   │   ├── document-verification/page.tsx
│   │   ├── history/page.tsx
│   │   ├── reports/page.tsx  # Reports page
│   │   ├── scheduling/page.tsx # Scheduling page
│   │   └── spare/page.tsx
│   ├── components/
│   │   ├── layout/           # Layout components
│   │   │   ├── DashboardLayout.tsx  # Main layout wrapper
│   │   │   ├── Header.tsx           # Header with title and date
│   │   │   ├── Navigation.tsx       # Main navigation bar
│   │   │   └── FetchGuard.tsx
│   │   ├── dashboard/        # Dashboard-specific components
│   │   │   ├── AlertBanner.tsx      # Ticker alert banner
│   │   │   ├── CapacityUtilizationKPI.tsx  # Capacity metrics
│   │   │   ├── TurnaroundTimeKPI.tsx       # TTR metrics
│   │   │   ├── VehicleSummaryKPI.tsx      # Vehicle counts
│   │   │   ├── DispatchSummaryKPI.tsx     # Dispatch metrics
│   │   │   ├── ParkingGrid.tsx     # Parking area visualization
│   │   │   └── VehicleTable.tsx    # Vehicle tracking table
│   │   ├── charts/           # Chart components
│   │   │   ├── KPISmallChart.tsx    # Small sparkline charts
│   │   │   ├── TrendsChart.tsx      # Trends comparison chart
│   │   │   └── Sparkline.tsx
│   │   ├── document/         # Document verification components
│   │   │   ├── DocumentUploadZone.tsx
│   │   │   ├── DocumentViewer.tsx
│   │   │   ├── DriverHelperDetails.tsx
│   │   │   ├── GateSelector.tsx
│   │   │   ├── ProgressTracker.tsx
│   │   │   ├── RFIDModule.tsx
│   │   │   ├── SearchableOrderList.tsx
│   │   │   └── SignaturePad.tsx
│   │   ├── filters/          # Filter components
│   │   │   ├── DayWiseFilter.tsx
│   │   │   ├── PeriodFilter.tsx
│   │   │   └── VehicleSearch.tsx
│   │   ├── scheduling/       # Scheduling module components
│   │   │   ├── AlertBar.tsx
│   │   │   ├── FacilityMap.tsx
│   │   │   ├── LoadingGateStatus.tsx
│   │   │   ├── ManualsList.tsx
│   │   │   ├── MultiSelectDropdown.tsx
│   │   │   ├── SchedulingParkingArea.tsx
│   │   │   ├── SchedulingParkingToggle.tsx
│   │   │   ├── Tabs.tsx
│   │   │   └── VehicleEntryTable.tsx
│   │   ├── reports/          # Reports module components
│   │   │   ├── InfoPanel.tsx
│   │   │   ├── ProcessTimeline.tsx
│   │   │   ├── SearchHeader.tsx
│   │   │   ├── SummaryCards.tsx
│   │   │   ├── SystemAlertsBanner.tsx
│   │   │   └── TotalTimeStackedBar.tsx
│   │   └── ui/               # Reusable UI components
│   │       ├── AlertModal.tsx
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── KPICard.tsx          # KPI card wrapper
│   │       ├── Modal.tsx
│   │       ├── ProgressBar.tsx
│   │       ├── TimeRangeHint.tsx    # Data range hint
│   │       └── TimeRangeToggle.tsx  # Time period selector
│   ├── hooks/                # Custom React hooks
│   │   ├── useRealTimeData.ts  # Data fetching and state management
│   │   └── useSchedulingState.ts
│   ├── services/             # API/data services
│   │   └── dashboardService.ts # Mock data and API calls
│   ├── types/                # TypeScript type definitions
│   │   ├── dashboard.ts      # Dashboard data types (ParkingData, etc.)
│   │   ├── kpi.ts            # KPI-related types (CapacityData, TurnaroundData, etc.)
│   │   ├── reports.ts        # Reports data types
│   │   └── vehicle.ts        # Vehicle-related types
│   └── utils/                # Utility functions
│       ├── formatters.ts     # Number and date formatting
│       ├── colors.ts         # Color utilities
│       ├── alerts.ts         # Alert utilities
│       └── range.ts          # Range calculation utilities
└── package.json              # Project dependencies and scripts
```

## Core Components & Features

### Dashboard (Home Page)
The main dashboard (`src/app/page.tsx`) displays:

1. **Time Range Controls** - Toggle between Today, Monthly, Yearly, or Compare views
2. **KPI Cards Grid** - Four key performance indicators:
   - **Capacity Utilization**: Current plant capacity usage with trend
   - **Turnaround Time**: Average TTR with historical comparison
   - **Vehicle Summary**: In/Out vehicles for day and cumulative
   - **Dispatch Summary**: Daily dispatch metrics and targets

3. **Parking Grid** - Visual representation of parking areas with availability status
4. **Vehicle Table** - List of active vehicles with progress, TTR, and stage tracking

### Navigation
- Main Dashboard
- Document Verification
- Scheduling
- Reports
- Alarms
- Historical Data
- Spare Tab

## Data Architecture

### Real-time Data Management
The application uses `useRealTimeData` hook for centralized data management:

- **KPI Data**: Capacity, turnaround, vehicle, and dispatch metrics
- **Vehicle Data**: Vehicle tracking with progress and stage information
- **Parking Data**: Two parking areas (AREA-1, AREA-2) with status tracking

Data is fetched from `dashboardService` and updated every 30 seconds for real-time visualization.

### State Management
- React hooks for local component state
- Custom `useRealTimeData` hook for shared dashboard state
- LocalStorage for persisting parking status overrides and vehicle-to-parking assignments

### Data Types

**KPI Data**:
```typescript
{
  capacity: { utilization, plantCapacity, trucksInside, trend }
  turnaround: { avgDay, avgCum, lastYear, trend, performanceColor, sparkline }
  vehicles: { inDay, outDay, inCum, outCum, trend, target }
  dispatch: { today, cumMonth, targetDay, trend }
}
```

**Vehicle Row**:
```typescript
{
  sn, regNo, rfidNo, tareWt, wtAfter, progress, ttr, timestamp,
  stages: { gateEntry, tareWeighing, loading, postLoadingWeighing, gateExit }
}
```

**Parking Data**:
```typescript
{
  'AREA-1': ParkingCell[][]
  'AREA-2': ParkingCell[][]
}
```

## Key Utilities

- **Formatters** (`utils/formatters.ts`): Number formatting, date/time display
- **Colors** (`utils/colors.ts`): Status-based color mapping
- **Alerts** (`utils/alerts.ts`): Alert message handling
- **Range** (`utils/range.ts`): Numeric range generation

## Configuration

### Tailwind CSS
Custom Tailwind configuration includes:
- Custom colors (cssPrimary, secondary, success, warning, danger, background, card)
- Custom box shadows (card shadow)
- Custom border radius (ui)
- Custom animations (ticker, pulseDot)

### Path Aliases
The project uses Vite's `vite-tsconfig-paths` for convenient imports:
- `@/components/*` → `src/components/*`
- `@/hooks/*` → `src/hooks/*`
- `@/services/*` → `src/services/*`
- `@/types/*` → `src/types/*`
- `@/utils/*` → `src/utils/*`

## Development Notes

- **Component Organization**: Components are organized by feature/module for better maintainability
- **TypeScript**: Full type safety across the application
- **Responsive Design**: Mobile-first approach with Tailwind CSS breakpoints (md, lg)
- **Mock Data**: `dashboardService` provides mock data for development. Replace with API calls when backend is ready
- **Real-time Updates**: Dashboard KPI data and vehicle progress update every 30 seconds
- **Persistent Storage**: Parking status and vehicle assignments persist across page navigation

## Building & Deployment

### Production Build
```bash
npm run build
```
Creates optimized bundles in `dist/` folder.

### Preview Production Build
```bash
npm start
```
Starts a preview server on port 3000.

### Performance Note
The current build has a large chunk size (~1MB). Consider implementing code-splitting with dynamic imports to optimize bundle size for production.

## Browser Support

- Modern browsers supporting ES2020
- React 18+ compatible
- Chrome, Firefox, Safari, Edge (latest versions)

## License

Proprietary - Truck Turnaround Time Monitoring System
