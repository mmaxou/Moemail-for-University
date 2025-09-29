"use client"

import { useSession } from "next-auth/react"
import { Role } from "@/lib/permissions"
import { useEffect, useState } from "react"

export function useUserRole() {
  const { data: session } = useSession()
  const [role, setRole] = useState<Role | null>(null)

  useEffect(() => {
    if (session?.user?.roles?.[0]?.name) {
      setRole(session.user.roles[0].name as Role)
    }
  }, [session])

  return {
    role,
    loading: !session
  }
} 