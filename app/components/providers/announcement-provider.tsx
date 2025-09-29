"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useSession } from "next-auth/react"
import { AnnouncementDialog } from "@/components/layout/announcement-dialog"

type Announcement = {
  id: string
  title: string
  content: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

interface AnnouncementContextType {
  announcements: Announcement[]
  showDialog: boolean
  setShowDialog: (show: boolean) => void
  refreshAnnouncements: () => void
}

const AnnouncementContext = createContext<AnnouncementContextType | null>(null)

interface AnnouncementProviderProps {
  children: ReactNode
}

export function AnnouncementProvider({ children }: AnnouncementProviderProps) {
  const { data: session, status } = useSession()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [hasShownToday, setHasShownToday] = useState(false)

  const refreshAnnouncements = async () => {
    try {
      const response = await fetch("/api/announcements")
      if (response.ok) {
        const data = await response.json() as Announcement[]
        setAnnouncements(data)
        return data
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error)
    }
    return []
  }

  // 检查今天是否已经显示过公告
  const checkIfShownToday = () => {
    const today = new Date().toDateString()
    const lastShown = localStorage.getItem("lastAnnouncementShown")
    return lastShown === today
  }

  // 标记今天已显示公告
  const markAsShownToday = () => {
    const today = new Date().toDateString()
    localStorage.setItem("lastAnnouncementShown", today)
    setHasShownToday(true)
  }

  useEffect(() => {
    // 当用户登录时检查公告
    if (status === "authenticated" && session?.user && !hasShownToday) {
      const isShownToday = checkIfShownToday()
      setHasShownToday(isShownToday)

      if (!isShownToday) {
        refreshAnnouncements().then((data) => {
          // 如果有公告且没有在今天显示过，则自动弹出
          if (data && data.length > 0) {
            setShowDialog(true)
            markAsShownToday()
          }
        })
      }
    }
  }, [status, session, hasShownToday])

  const contextValue: AnnouncementContextType = {
    announcements,
    showDialog,
    setShowDialog,
    refreshAnnouncements,
  }

  return (
    <AnnouncementContext.Provider value={contextValue}>
      {children}
      <AnnouncementDialog 
        open={showDialog}
        onOpenChange={setShowDialog}
      />
    </AnnouncementContext.Provider>
  )
}

export function useAnnouncement() {
  const context = useContext(AnnouncementContext)
  if (!context) {
    throw new Error("useAnnouncement must be used within AnnouncementProvider")
  }
  return context
}