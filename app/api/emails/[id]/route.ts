import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import { emails, messages } from "@/lib/schema"
import { eq, and, lt, or, sql, desc, inArray } from "drizzle-orm"
import { encodeCursor, decodeCursor } from "@/lib/cursor"
import { getUserId } from "@/lib/apiKey"
export const runtime = "edge"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()

  try {
    const db = createDb()
    const { id } = await params
    const email = await db.query.emails.findFirst({
      where: and(
        eq(emails.id, id),
        eq(emails.userId, userId!)
      )
    })

    if (!email) {
      return NextResponse.json(
        { error: "邮箱不存在或无权限删除" },
        { status: 403 }
      )
    }
    await db.delete(messages)
      .where(eq(messages.emailId, id))

    await db.delete(emails)
      .where(eq(emails.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete email:', error)
    return NextResponse.json(
      { error: "删除邮箱失败" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()

  try {
    const db = createDb()
    const { id } = await params
  const body = await request.json() as { action: string; scope?: 'all' | 'received' | 'sent'; ids?: string[] }

    // 验证邮箱权限
    const email = await db.query.emails.findFirst({
      where: and(
        eq(emails.id, id),
        eq(emails.userId, userId!)
      )
    })

    if (!email) {
      return NextResponse.json(
        { error: "邮箱不存在或无权限操作" },
        { status: 403 }
      )
    }

    // 处理批量删除所有邮件
  if (body.action === "deleteMessagesByIds") {
  const ids = Array.isArray(body.ids) ? body.ids.filter((value): value is string => typeof value === 'string' && value.trim() !== '') : []

    if (ids.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        deletedIds: []
      })
    }

    const result = await db.delete(messages)
      .where(and(eq(messages.emailId, id), inArray(messages.id, ids)))
      .returning({ id: messages.id })

    return NextResponse.json({
      success: true,
      deletedCount: result.length,
      deletedIds: result.map((item: { id: string }) => item.id)
    })
  }

  if (body.action === "deleteAllMessages") {
      const scope = body.scope || 'all'
      const base = eq(messages.emailId, id)
      const scopeFilter = scope === 'received'
        ? eq(messages.type, 'received')
        : scope === 'sent'
          ? eq(messages.type, 'sent')
          : null

      const result = await db.delete(messages)
        .where(scopeFilter ? and(base, scopeFilter) : base)
        .returning({ id: messages.id })

      return NextResponse.json({
        success: true,
        deletedCount: result.length,
        scope,
        deletedIds: result.map((item: { id: string }) => item.id)
      })
    }

    return NextResponse.json(
      { error: "无效的操作" },
      { status: 400 }
    )
  } catch (error) {
    console.error('Failed to perform batch operation:', error)
    return NextResponse.json(
      { error: "批量操作失败" },
      { status: 500 }
    )
  }
}

const PAGE_SIZE = 20

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url)
  const cursorStr = searchParams.get('cursor')

  try {
    const db = createDb()
    const { id } = await params

    const userId = await getUserId()

    const email = await db.query.emails.findFirst({
      where: and(
        eq(emails.id, id),
        eq(emails.userId, userId!)
      )
    })

    if (!email) {
      return NextResponse.json(
        { error: "无权限查看" },
        { status: 403 }
      )
    }

    const baseConditions = eq(messages.emailId, id)

    const totalResult = await db.select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(baseConditions)
    const totalCount = Number(totalResult[0].count)

    const conditions = [baseConditions]

    if (cursorStr) {
      const { timestamp, id } = decodeCursor(cursorStr)
      const cursorCondition = or(
        lt(messages.receivedAt, new Date(timestamp)),
        and(
          eq(messages.receivedAt, new Date(timestamp)),
          lt(messages.id, id)
        )
      ) as any
      conditions.push(cursorCondition)
    }

    const results = await db.query.messages.findMany({
      where: and(...conditions),
      orderBy: [
        desc(messages.receivedAt),
        desc(messages.id)
      ],
      limit: PAGE_SIZE + 1
    })
    
    const hasMore = results.length > PAGE_SIZE
    const nextCursor = hasMore 
      ? encodeCursor(
          results[PAGE_SIZE - 1].receivedAt.getTime(),
          results[PAGE_SIZE - 1].id
        )
      : null
    const messageList = hasMore ? results.slice(0, PAGE_SIZE) : results

    return NextResponse.json({
      messages: messageList.map((msg: typeof messages.$inferSelect) => ({
        id: msg.id,
        from_address: msg.fromAddress,
        to_address: msg.toAddress,
        subject: msg.subject,
        type: msg.type,
        received_at: msg.receivedAt.getTime()
      })),
      nextCursor,
      total: totalCount
    })
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
} 