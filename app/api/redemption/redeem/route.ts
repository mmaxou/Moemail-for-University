import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import { redemptionCodes, emails, users, roles, userRoles } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { getUserId } from "@/lib/apiKey"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { ROLES } from "@/lib/permissions"

export const runtime = "edge"

// 兑换码兑换
export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  const { code, emailPrefix } = await request.json() as { code: string; emailPrefix?: string }

  if (!code) {
    return NextResponse.json({ error: "请输入兑换码" }, { status: 400 })
  }

  const db = createDb()
  const env = getRequestContext().env

  // 查找兑换码
  const redemption = await db.query.redemptionCodes.findFirst({
    where: eq(redemptionCodes.code, code.toUpperCase())
  })

  if (!redemption) {
    return NextResponse.json({ error: "兑换码不存在" }, { status: 404 })
  }

  if (redemption.used) {
    return NextResponse.json({ error: "兑换码已被使用" }, { status: 400 })
  }

  // 类型 B 需要邮箱前缀，如果没有提供则返回提示
  if (redemption.type === 'B' && !emailPrefix) {
    return NextResponse.json({ 
      needPrefix: true, 
      type: 'B',
      message: "请输入您想要的邮箱前缀" 
    }, { status: 400 })
  }

  // 获取域名
  const domainString = await env.SITE_CONFIG.get("EMAIL_DOMAINS")
  const domains = domainString ? domainString.split(',') : ["moemail.app"]
  const domain = domains[0]

  let createdEmail = null

  // 类型 A：自动创建16位随机邮箱
  if (redemption.type === 'A') {
    const prefix = nanoid(16)
    const address = `${prefix}@${domain}`
    
    const [email] = await db.insert(emails).values({
      address,
      userId,
      expiresAt: new Date('9999-01-01T00:00:00.000Z')
    }).returning()
    
    createdEmail = email.address
  }

  // 类型 B：用户自定义邮箱前缀
  if (redemption.type === 'B' && emailPrefix) {
    // 验证前缀格式
    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(emailPrefix)) {
      return NextResponse.json({ error: "邮箱前缀格式不正确（3-30位字母数字）" }, { status: 400 })
    }

    const address = `${emailPrefix}@${domain}`
    
    // 检查是否已存在
    const existing = await db.query.emails.findFirst({
      where: eq(emails.address, address)
    })
    
    if (existing) {
      return NextResponse.json({ error: "该邮箱地址已被使用" }, { status: 409 })
    }

    const [email] = await db.insert(emails).values({
      address,
      userId,
      expiresAt: new Date('9999-01-01T00:00:00.000Z')
    }).returning()
    
    createdEmail = email.address
  }

  // 升级用户为 KNIGHT（认证学生）
  const knightRole = await db.query.roles.findFirst({
    where: eq(roles.name, ROLES.KNIGHT)
  })

  if (knightRole) {
    await db.delete(userRoles).where(eq(userRoles.userId, userId))
    await db.insert(userRoles).values({
      userId,
      roleId: knightRole.id
    })
  }

  // 更新用户邮箱配额
  await db.update(users).set({ maxEmails: 1 }).where(eq(users.id, userId))

  // 标记兑换码已使用
  await db.update(redemptionCodes).set({
    used: true,
    usedBy: userId,
    usedAt: new Date()
  }).where(eq(redemptionCodes.id, redemption.id))

  return NextResponse.json({
    success: true,
    type: redemption.type,
    email: createdEmail,
    message: redemption.type === 'A' 
      ? `认证成功！已为您创建邮箱: ${createdEmail}`
      : `认证成功！已创建邮箱: ${createdEmail}`
  })
}
