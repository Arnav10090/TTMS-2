import React from 'react'
import './globals.css'

// This file remains for compatibility but is not used by the React Router app.
// Keeping it simple avoids TypeScript errors from Next.js-specific imports.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
