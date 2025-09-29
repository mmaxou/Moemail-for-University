"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useCallback } from "react"
import { EMAIL_CONFIG } from "@/config"

interface UserInfo {
  id: string
  name?: string
  username?: string
  email?: string
  maxEmails: number
  currentEmailCount: number
}

export function useUserInfo() {
  const { data: session } = useSession()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUserInfo = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/users/me`)
      if (!response.ok) {
        throw new Error("获取用户信息失败")
      }

      const data = await response.json() as UserInfo
      setUserInfo(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取用户信息失败")
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserInfo()
    }
  }, [session?.user?.id, fetchUserInfo])

  return {
    userInfo,
    loading,
    error,
    refetch: fetchUserInfo,
    maxEmails: userInfo?.maxEmails ?? EMAIL_CONFIG.MAX_ACTIVE_EMAILS,
    currentEmailCount: userInfo?.currentEmailCount || 0
  }
}
