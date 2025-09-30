"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { CreateDialog } from "./create-dialog"
import { Mail, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useThrottle } from "@/hooks/use-throttle"
import { ROLES } from "@/lib/permissions"
import { useUserRole } from "@/hooks/use-user-role"
import { useUserInfo } from "@/hooks/use-user-info"

interface Email {
  id: string
  address: string
  createdAt: number
  expiresAt: number
}

interface EmailListProps {
  onEmailSelect: (email: Email | null) => void
  selectedEmailId?: string
}

interface EmailResponse {
  emails: Email[]
  nextCursor: string | null
  total: number
}

export function EmailList({ onEmailSelect, selectedEmailId }: EmailListProps) {
  const { data: session } = useSession()
  const { role } = useUserRole()
  const { maxEmails } = useUserInfo()
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const fetchEmails = useCallback(async (cursor?: string) => {
    try {
      setError(null)
      if (!cursor) setLoading(true)
      else setLoadingMore(true)
      
      const url = new URL("/api/emails", window.location.origin)
      if (cursor) {
        url.searchParams.set('cursor', cursor)
      }
      const response = await fetch(url)
      const rawData = await response.json()
      
      if (!response.ok) {
        throw new Error((rawData as { error?: string }).error || "加载邮箱失败")
      }
      
      const data = rawData as EmailResponse
      
      if (!cursor) {
        setEmails(data.emails)
        setNextCursor(data.nextCursor)
        setTotal(data.total)
        return
      }
      setEmails(prev => [...prev, ...data.emails])
      setNextCursor(data.nextCursor)
      setTotal(data.total)
    } catch (error) {
      console.error("Failed to fetch emails:", error)
      setError(error instanceof Error ? error.message : "加载邮箱列表失败")
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchEmails()
  }

  const handleScroll = useThrottle((e: React.UIEvent<HTMLDivElement>) => {
    if (loadingMore) return

    const { scrollHeight, scrollTop, clientHeight } = e.currentTarget
    const threshold = clientHeight * 1.5
    const remainingScroll = scrollHeight - scrollTop

    if (remainingScroll <= threshold && nextCursor) {
      setLoadingMore(true)
      fetchEmails(nextCursor)
    }
  }, 200)

  useEffect(() => {
    if (session) fetchEmails()
  }, [session, fetchEmails])

  if (!session) return null

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="p-2 flex justify-between items-center border-b border-primary/20">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className={cn("h-8 w-8", refreshing && "animate-spin")}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <span className="text-xs text-gray-500">
              {role === ROLES.EMPEROR ? (
                `${total}/∞ 个邮箱`
              ) : (
                `${total}/${maxEmails} 个邮箱`
              )}
            </span>
          </div>
          {/** 对于校长(EMPEROR) 传递无限制的 maxEmails 以允许始终创建 */}
          <CreateDialog onEmailCreated={handleRefresh} maxEmails={role === ROLES.EMPEROR ? Number.POSITIVE_INFINITY : maxEmails} total={total} />
        </div>
        
        <div className="flex-1 overflow-auto p-2" onScroll={handleScroll}>
          {loading ? (
            <div className="text-center text-sm text-gray-500">加载中...</div>
          ) : error ? (
            <div className="text-center text-sm text-destructive p-2">
              <div className="mb-2">{error}</div>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                重试
              </Button>
            </div>
          ) : emails.length > 0 ? (
            <div className="space-y-1">
              {emails.map(email => (
                <div
                  key={email.id}
                  className={cn("flex items-center gap-2 p-2 rounded cursor-pointer text-sm group",
                    "hover:bg-primary/5",
                    selectedEmailId === email.id && "bg-primary/10"
                  )}
                  onClick={() => onEmailSelect(email)}
                >
                  <Mail className="h-4 w-4 text-primary/60" />
                  <div className="truncate flex-1">
                    <div className="font-medium truncate">{email.address}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(email.expiresAt).getFullYear() === 9999 ? (
                        "永久有效"
                      ) : (
                        `过期时间: ${new Date(email.expiresAt).toLocaleString()}`
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loadingMore && (
                <div className="text-center text-sm text-gray-500 py-2">
                  加载更多...
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500 p-4">
              {maxEmails === 0 ? (
                <div>
                  <div className="mb-2">您当前没有创建邮箱的权限</div>
                  <div className="text-xs">请联系管理员申请邮箱使用权限</div>
                </div>
              ) : (
                "还没有邮箱，创建一个吧！"
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
} 
