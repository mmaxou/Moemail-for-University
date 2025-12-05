import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import { redemptionCodes } from "@/lib/schema"
import { nanoid } from "nanoid"
import { getUserId } from "@/lib/apiKey"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { desc, eq } from "drizzle-orm"

export const runtime = "edge"

// 获取兑换码列表（管理员）- 只返回未使用的
export async function GET() {
  const hasAccess = await checkPermission(PERMISSIONS.PROMOTE_USER)
  if (!hasAccess) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  const db = createDb()
  const codes = await db.query.redemptionCodes.findMany({
    where: eq(redemptionCodes.used, false),
    orderBy: [desc(redemptionCodes.createdAt)]
  })

  return NextResponse.json(codes)
}

// 生成兑换码（管理员）
export async function POST(request: Request) {
  const hasAccess = await checkPermission(PERMISSIONS.PROMOTE_USER)
  if (!hasAccess) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  const userId = await getUserId()
  const { type, count = 1 } = await request.json() as { type: 'A' | 'B'; count?: number }

  if (!['A', 'B'].includes(type)) {
    return NextResponse.json({ error: "无效的兑换码类型" }, { status: 400 })
  }

  if (count < 1 || count > 100) {
    return NextResponse.json({ error: "生成数量必须在1-100之间" }, { status: 400 })
  }

  const db = createDb()
  const codes: string[] = []

  for (let i = 0; i < count; i++) {
    const code = nanoid(16).toUpperCase()
    codes.push(code)
    await db.insert(redemptionCodes).values({
      code,
      type,
      createdBy: userId!
    })
  }

  return NextResponse.json({ codes })
}
