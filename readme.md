# TTR Dashboard

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

A comprehensive industrial management solution combining **Tank Truck Management (TTMS)** and **Process Tank Management (PTMS)** into a unified, high-performance dashboard.

## 🚀 Overview

The **TTR Dashboard** is a modern web application designed for real-time monitoring and management of industrial tank operations. It features a robust dual-system architecture:

1.  **TTMS (Tank Truck Management System)**: Focuses on logistics, scheduling, and documentation for transport operations.
2.  **PTMS (Process Tank Management System)**: Provides an HMI-like interface for monitoring plant operations, tank levels, and pump statuses.

Built with performance and user experience in mind, it utilizes the latest React ecosystem technologies.

## ✨ Key Features

### 🚛 TTMS Module
*   **Operational Dashboard**: High-level overview of key metrics and activities.
*   **Smart Scheduling**: Efficient management of truck arrivals and departures.
*   **Document Verification**: Streamlined workflow for regulatory compliance.
*   **Spare Parts Management**: Inventory tracking for critical components.
*   **Alarms & History**: Comprehensive logging of events and historical data analysis.

### 🏭 PTMS Module (HMI)
*   **Interactive HMI**: Visual representations of plant equipment (Tanks, Pumps, Pickling units).
*   **Real-time Monitoring**:
    *   **HMI 01**: Tank Overview & Tabs
    *   **HMI 02**: Pickling Process & Legends
    *   **HMI 03**: Pump Operations
*   **Live Trends**: Dynamic charting for process variables (HMI 04).
*   **Advanced Reporting**: Detailed process reports (HMI 06) and historical data (HMI 07).
*   **System Alarms**: Critical alert monitoring system (HMI 05).

## 🛠️ Tech Stack

*   **Core**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components**: [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/), [Sonner](https://sonner.emilkowal.ski/) (Toast)
*   **State & Data**: [TanStack Query](https://tanstack.com/query/latest)
*   **Routing**: [React Router DOM](https://reactrouter.com/)
*   **Data Visualization**: [Recharts](https://recharts.org/)
*   **Utilities**: `date-fns`, `clsx`, `tailwind-merge`

## 📦 Installation

Prerequisites: Node.js (v18+ recommended).

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd TTMS-2_Project
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```

4.  **Build for production**
    ```bash
    npm run build
    ```

## 📂 Project Structure

```
src/
├── app/              # Main application logic
├── components/       # Shared UI components (ui/, layout/, etc.)
├── ptms/             # Process Tank Management System module
│   └── pages/        # HMI screens (Overview, Trends, Alarms...)
├── ttms/             # Tank Truck Management System module
│   └── pages/        # Dashboard screens (Scheduling, Reports...)
├── services/         # API services
├── styles/           # Global styles
├── types/            # TypeScript definitions
└── utils/            # Helper functions
```

## 🤝 Contributing

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---
*Built with ❤️ for Industrial Excellence.*
