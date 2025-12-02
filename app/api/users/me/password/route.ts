import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { getUserId } from "@/lib/apiKey"
import { hashPassword, comparePassword } from "@/lib/utils"
import { changePasswordSchema } from "@/lib/validation"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const userId = await getUserId()
    
    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const body = await request.json()
    
    // 验证输入
    const result = changePasswordSchema.safeParse(body)
    if (!result.success) {
      const firstError = result.error.errors[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    const { currentPassword, newPassword } = result.data

    const db = createDb()
    
    // 获取用户信息
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        password: true,
        email: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    // 检查用户是否是通过用户名密码注册的（而非 GitHub OAuth）
    if (!user.password) {
      return NextResponse.json({ 
        error: "您的账号通过 GitHub 登录，无法修改密码" 
      }, { status: 400 })
    }

    // 验证当前密码
    const isValid = await comparePassword(currentPassword, user.password)
    if (!isValid) {
      return NextResponse.json({ error: "当前密码错误" }, { status: 400 })
    }

    // 检查新密码是否与旧密码相同
    const isSamePassword = await comparePassword(newPassword, user.password)
    if (isSamePassword) {
      return NextResponse.json({ error: "新密码不能与当前密码相同" }, { status: 400 })
    }

    // 更新密码
    const hashedPassword = await hashPassword(newPassword)
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId))

    return NextResponse.json({ success: true, message: "密码修改成功" })
  } catch (error) {
    console.error("修改密码失败:", error)
    return NextResponse.json({ error: "服务器错误，请稍后重试" }, { status: 500 })
  }
}
