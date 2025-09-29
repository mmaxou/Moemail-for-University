import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import { announcements } from "@/lib/schema"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { eq } from "drizzle-orm"
import { UpdateAnnouncementRequest } from "@/types/announcement"

export const runtime = "edge"

// 更新公告（需要管理员权限）
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const hasPermission = await checkPermission(PERMISSIONS.MANAGE_ANNOUNCEMENT)
  if (!hasPermission) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  const { id } = await params

  try {
    const { title, content, enabled } = await request.json() as UpdateAnnouncementRequest

    if (!title || !content) {
      return NextResponse.json(
        { error: "标题和内容不能为空" },
        { status: 400 }
      )
    }

    const db = createDb()
    
    // 检查公告是否存在
    const existingAnnouncement = await db.query.announcements.findFirst({
      where: eq(announcements.id, id)
    })

    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: "公告不存在" },
        { status: 404 }
      )
    }

    const [updatedAnnouncement] = await db.update(announcements)
      .set({
        title,
        content,
        enabled,
        updatedAt: new Date(),
      })
      .where(eq(announcements.id, id))
      .returning()

    return NextResponse.json(updatedAnnouncement)
  } catch (error) {
    console.error("Failed to update announcement:", error)
    return NextResponse.json(
      { error: "更新公告失败" },
      { status: 500 }
    )
  }
}

// 删除公告（需要管理员权限）
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const hasPermission = await checkPermission(PERMISSIONS.MANAGE_ANNOUNCEMENT)
  if (!hasPermission) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  const { id } = await params

  try {
    const db = createDb()
    
    // 检查公告是否存在
    const existingAnnouncement = await db.query.announcements.findFirst({
      where: eq(announcements.id, id)
    })

    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: "公告不存在" },
        { status: 404 }
      )
    }

    await db.delete(announcements)
      .where(eq(announcements.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete announcement:", error)
    return NextResponse.json(
      { error: "删除公告失败" },
      { status: 500 }
    )
  }
}