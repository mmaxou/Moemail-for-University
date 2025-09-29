import { createDb } from "@/lib/db"
import { users, emails } from "@/lib/schema"
import { eq, count } from "drizzle-orm"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const { searchText } = json as { searchText: string }

    if (!searchText) {
      return Response.json({ error: "请提供用户名或邮箱地址" }, { status: 400 })
    }

    const db = createDb()

    const user = await db.query.users.findFirst({
      where: searchText.includes('@') ? eq(users.email, searchText) : eq(users.username, searchText),
      with: {
        userRoles: {
          with: {
            role: true
          }
        }
      }
    });

    if (!user) {
      return Response.json({ error: "未找到用户" }, { status: 404 })
    }

    // 获取用户当前的邮箱数量
    const emailCountResult = await db
      .select({ count: count() })
      .from(emails)
      .where(eq(emails.userId, user.id))

    const currentEmailCount = emailCountResult[0]?.count || 0

    return Response.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.userRoles[0]?.role.name,
        maxEmails: user.maxEmails ?? 1, // 最大邮箱数量限制（默认为1）
        currentEmailCount: currentEmailCount // 当前邮箱数量
      }
    })
  } catch (error) {
    console.error("Failed to find user:", error)
    return Response.json(
      { error: "查询用户失败" },
      { status: 500 }
    )
  }
} 