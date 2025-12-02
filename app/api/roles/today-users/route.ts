import { createDb } from "@/lib/db"
import { userRoles } from "@/lib/schema"
import { gte } from "drizzle-orm"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"

export const runtime = "edge"

interface TodayUser {
  id: string
  name: string | null
  username: string | null
  email: string | null
  role: string
  createdAt: Date | null
}

export async function GET() {
  const hasPermission = await checkPermission(PERMISSIONS.PROMOTE_USER)
  if (!hasPermission) {
    return Response.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const db = createDb()
    
    // 获取今天的开始时间（UTC 0:00）
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    // 查询今天注册的用户（通过 userRoles 的 createdAt 判断）
    const todayUserRoles = await db.query.userRoles.findMany({
      where: gte(userRoles.createdAt, today),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            username: true,
            email: true,
          }
        },
        role: {
          columns: {
            name: true,
          }
        }
      }
    })

    // 格式化返回数据
    const todayUsers: TodayUser[] = todayUserRoles.map(ur => ({
      id: ur.user.id,
      name: ur.user.name,
      username: ur.user.username,
      email: ur.user.email,
      role: ur.role.name,
      createdAt: ur.createdAt
    }))

    // 按创建时间降序排序
    todayUsers.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return timeB - timeA
    })

    return Response.json({
      users: todayUsers,
      count: todayUsers.length
    })
  } catch (error) {
    console.error("Failed to get today's users:", error)
    return Response.json(
      { error: "获取今日注册用户失败" },
      { status: 500 }
    )
  }
}
