"use client"

import { Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAnnouncement } from "@/components/providers/announcement-provider"

export function AnnouncementButton() {
  const { setShowDialog } = useAnnouncement()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setShowDialog(true)}
      className="rounded-full"
    >
      <Megaphone className="h-5 w-5" />
      <span className="sr-only">查看公告</span>
    </Button>
  )
}