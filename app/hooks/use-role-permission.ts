"use client"

import { useSession } from "next-auth/react"
import { Permission, Role, hasPermission } from "@/lib/permissions"

export function useRolePermission() {
  const { data: session } = useSession()
  const roles = session?.user?.roles

  const checkPermission = (permission: Permission) => {
    if (!roles) return false
    return hasPermission(roles.map(r => r.name) as Role[], permission)
  }

  const hasRole = (role: Role) => {
    if (!roles) return false
    return roles.some(r => r.name === role)
  }

  return {
    checkPermission,
    hasRole,
    roles,
  }
}