import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import { announcements } from "@/lib/schema"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { desc, eq } from "drizzle-orm"

export const runtime = "edge"

// 获取所有公告（公开接口）
export async function GET() {
  try {
    const db = createDb()
    const allAnnouncements = await db.query.announcements.findMany({
      where: eq(announcements.enabled, true),
      orderBy: [desc(announcements.createdAt)]
    })

    return NextResponse.json(allAnnouncements)
  } catch (error) {
    console.error("Failed to fetch announcements:", error)
    return NextResponse.json(
      { error: "获取公告失败" },
      { status: 500 }
    )
  }
}

// 创建新公告（需要管理员权限）
export async function POST(request: Request) {
  const hasPermission = await checkPermission(PERMISSIONS.MANAGE_ANNOUNCEMENT)
  if (!hasPermission) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const { title, content, enabled = true } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: "标题和内容不能为空" },
        { status: 400 }
      )
    }

    const db = createDb()
    const [newAnnouncement] = await db.insert(announcements)
      .values({
        title,
        content,
        enabled,
      })
      .returning()

    return NextResponse.json(newAnnouncement)
  } catch (error) {
    console.error("Failed to create announcement:", error)
    return NextResponse.json(
      { error: "创建公告失败" },
      { status: 500 }
    )
  }
}