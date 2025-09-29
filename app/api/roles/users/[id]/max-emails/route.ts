import { createDb } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 检查权限 - 只有有用户提升权限的管理员才能修改邮箱数量限制
    const hasPermission = await checkPermission(PERMISSIONS.PROMOTE_USER)
    if (!hasPermission) {
      return NextResponse.json({ error: "权限不足" }, { status: 403 })
    }

    const { id: userId } = await params
    const { maxEmails } = await request.json() as { maxEmails: number }

    // 验证输入
    if (typeof maxEmails !== 'number' || maxEmails < 0) {
      return NextResponse.json(
        { error: "邮箱数量限制必须是非负整数" },
        { status: 400 }
      )
    }

    if (maxEmails > 1000) {
      return NextResponse.json(
        { error: "邮箱数量限制不能超过1000" },
        { status: 400 }
      )
    }

    const db = createDb()

    // 检查用户是否存在
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    })

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    // 更新用户的邮箱数量限制
    await db
      .update(users)
      .set({ maxEmails })
      .where(eq(users.id, userId))

    return NextResponse.json({
      success: true,
      message: `已将用户 ${user.username || user.email} 的邮箱数量限制更新为 ${maxEmails}`
    })

  } catch (error) {
    console.error("更新邮箱数量限制失败:", error)
    return NextResponse.json(
      { error: "更新失败，请稍后重试" },
      { status: 500 }
    )
  }
}
