import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { PERMISSIONS } from "@/lib/permissions"
import { checkPermission } from "@/lib/auth"
import { Permission } from "@/lib/permissions"

const API_PERMISSIONS: Record<string, Permission> = {
  '/api/emails': PERMISSIONS.MANAGE_EMAIL,
  '/api/roles/promote': PERMISSIONS.PROMOTE_USER,
  '/api/config': PERMISSIONS.MANAGE_CONFIG,
  '/api/announcements': PERMISSIONS.MANAGE_ANNOUNCEMENT,
  '/api/redemption': PERMISSIONS.PROMOTE_USER,
}

export async function middleware(request: Request) {
  const pathname = new URL(request.url).pathname

  // Session 认证
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json(
      { error: "未授权" },
      { status: 401 }
    )
  }

  if (pathname === '/api/config' && request.method === 'GET') {
    return NextResponse.next()
  }

  if (pathname === '/api/announcements' && request.method === 'GET') {
    return NextResponse.next()
  }

  // 兑换码兑换接口允许所有登录用户访问
  if (pathname === '/api/redemption/redeem' && request.method === 'POST') {
    return NextResponse.next()
  }

  for (const [route, permission] of Object.entries(API_PERMISSIONS)) {
    if (pathname.startsWith(route)) {
      const hasAccess = await checkPermission(permission)

      if (!hasAccess) {
        return NextResponse.json(
          { error: "权限不足" },
          { status: 403 }
        )
      }
      break
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/emails/:path*',
    '/api/roles/:path*',
    '/api/config/:path*',
    '/api/announcements/:path*',
    '/api/redemption/:path*',
  ]
} 