"use client"

import { useState, useEffect } from "react"
import { Mail, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface DailyEmailCounterProps {
  className?: string
  onStatsChange?: (stats: { sentCount: number; maxCount: number }) => void
}

interface EmailStats {
  sentCount: number
  maxCount: number
  date: string
}

export function DailyEmailCounter({ className, onStatsChange }: DailyEmailCounterProps) {
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setError(null)
      const response = await fetch("/api/daily-email-stats")
      if (!response.ok) {
        throw new Error("获取邮件统计失败")
      }
      const data = await response.json()
      setStats(data)
      onStatsChange?.(data)
    } catch (err) {
      console.error("Failed to fetch email stats:", err)
      setError(err instanceof Error ? err.message : "未知错误")
    } finally {
      setLoading(false)
    }
  }

  // 刷新统计数据的方法，可以被父组件调用
  const refreshStats = () => {
    fetchStats()
  }

  useEffect(() => {
    fetchStats()
  }, [])

  // 计算进度百分比
  const progressPercentage = stats ? (stats.sentCount / stats.maxCount) * 100 : 0
  
  // 判断是否接近或达到限额
  const isWarning = progressPercentage >= 80
  const isCritical = progressPercentage >= 100

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-gray-500", className)}>
        <Mail className="w-4 h-4" />
        <span>加载中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-red-500", className)}>
        <AlertCircle className="w-4 h-4" />
        <span>统计加载失败</span>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <Mail className={cn(
        "w-4 h-4",
        isCritical ? "text-red-500" : isWarning ? "text-orange-500" : "text-blue-500"
      )} />
      <div className="flex items-center gap-2">
        <span className={cn(
          "font-medium",
          isCritical ? "text-red-600" : isWarning ? "text-orange-600" : "text-gray-700"
        )}>
          今日邮件: {stats.sentCount}/{stats.maxCount}
        </span>
        
        {/* 进度条 */}
        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              isCritical ? "bg-red-500" : isWarning ? "bg-orange-500" : "bg-blue-500"
            )}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
        
        {isCritical && (
          <span className="text-xs text-red-500 font-medium">已达上限</span>
        )}
      </div>
    </div>
  )
}

// 导出刷新方法，供外部组件使用
export { type EmailStats }