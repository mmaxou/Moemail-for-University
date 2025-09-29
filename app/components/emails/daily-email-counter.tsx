"use client"

import { useState, useEffect } from "react"
import { Mail } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"

interface DailyEmailCounterProps {
  onStatsChange?: (stats: { sentCount: number; maxCount: number }) => void
}

interface DailyStats {
  date: string
  sentCount: number
  maxCount: number
}

export function DailyEmailCounter({ onStatsChange }: DailyEmailCounterProps) {
  const [stats, setStats] = useState<DailyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/daily-stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
        onStatsChange?.(data)
      } else {
        throw new Error("Failed to fetch stats")
      }
    } catch (error) {
      console.error("Error fetching daily stats:", error)
      toast({
        title: "获取统计信息失败",
        description: "无法获取今日邮件发送统计",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  // 提供给外部组件刷新统计的方法
  useEffect(() => {
    const refreshStats = () => {
      fetchStats()
    }
    
    // 监听自定义事件来刷新统计
    window.addEventListener('refreshDailyStats', refreshStats)
    
    return () => {
      window.removeEventListener('refreshDailyStats', refreshStats)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Mail className="w-4 h-4" />
        <span>加载中...</span>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Mail className="w-4 h-4" />
        <span>统计不可用</span>
      </div>
    )
  }

  const percentage = (stats.sentCount / stats.maxCount) * 100
  const isNearLimit = percentage >= 80
  const isAtLimit = percentage >= 100

  return (
    <div className="flex items-center gap-2 text-sm">
      <Mail className="w-4 h-4" />
      <span className="text-gray-600">今日发送:</span>
      <Badge 
        variant={isAtLimit ? "destructive" : isNearLimit ? "secondary" : "outline"}
        className="font-mono"
      >
        {stats.sentCount}/{stats.maxCount}
      </Badge>
      {isAtLimit && (
        <span className="text-xs text-red-500">已达上限</span>
      )}
      {isNearLimit && !isAtLimit && (
        <span className="text-xs text-orange-500">接近上限</span>
      )}
    </div>
  )
}
