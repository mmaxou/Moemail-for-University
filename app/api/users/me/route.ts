import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import { users, emails } from "@/lib/schema"
import { eq, count } from "drizzle-orm"
import { getUserId } from "@/lib/apiKey"
import { EMAIL_CONFIG } from "@/config"

export const runtime = "edge"

export async function GET() {
  try {
    const userId = await getUserId()
    
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const db = createDb()
    
    // 获取用户信息
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        name: true,
        username: true,
        email: true,
        maxEmails: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    // 获取用户当前的邮箱数量
    const emailCountResult = await db
      .select({ count: count() })
      .from(emails)
      .where(eq(emails.userId, userId))

    const currentEmailCount = emailCountResult[0]?.count || 0

    return NextResponse.json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      maxEmails: user.maxEmails ?? EMAIL_CONFIG.MAX_ACTIVE_EMAILS,
      currentEmailCount: currentEmailCount
    })

  } catch (error) {
    console.error("获取用户信息失败:", error)
    return NextResponse.json(
      { error: "获取用户信息失败" },
      { status: 500 }
    )
  }
}
