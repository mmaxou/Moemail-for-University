"use client"

import { SessionProvider } from "next-auth/react"
import { AnnouncementProvider } from "@/components/providers/announcement-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AnnouncementProvider>
        {children}
      </AnnouncementProvider>
    </SessionProvider>
  )
} 