"use client"

import { useState, useEffect } from "react"
import { Megaphone, Loader2, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Announcement } from "@/types/announcement"

interface AnnouncementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AnnouncementDialog({ open, onOpenChange }: AnnouncementDialogProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open) return

    const fetchAnnouncements = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/announcements")
        if (response.ok) {
          const data = await response.json() as Announcement[]
          setAnnouncements(data)
        }
      } catch (error) {
        console.error("Failed to fetch announcements:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            网站公告
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无公告</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement: any, index: any) => (
                <div
                  key={announcement.id}
                  className={`p-4 rounded-lg border ${
                    index === 0 
                      ? "border-primary/50 bg-primary/5" 
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {index === 0 && (
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium mb-2">
                        {announcement.title}
                        {index === 0 && (
                          <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            最新
                          </span>
                        )}
                      </h3>
                      <div className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
                        {announcement.content}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        发布时间: {new Date(announcement.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}