import { createDb } from "@/lib/db"
import { dailyEmailStats } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export const runtime = "edge"

// 获取今日邮件统计
export async function GET() {
  try {
    const db = createDb()
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD 格式
    
    let todayStats = await db.query.dailyEmailStats.findFirst({
      where: eq(dailyEmailStats.date, today)
    })

    // 如果今天的记录不存在，创建一条
    if (!todayStats) {
      const [newRecord] = await db.insert(dailyEmailStats).values({
        date: today,
        sentCount: 0,
        maxCount: 100,
      }).returning()
      todayStats = newRecord
    }

    return NextResponse.json({
      date: todayStats.date,
      sentCount: todayStats.sentCount,
      maxCount: todayStats.maxCount,
    })
  } catch (error) {
    console.error("Get daily stats error:", error)
    return NextResponse.json(
      { error: "获取每日统计失败" },
      { status: 500 }
    )
  }
}

// 增加今日发送邮件数量
export async function POST() {
  try {
    const db = createDb()
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD 格式
    
    // 检查今日记录是否存在
    const todayStats = await db.query.dailyEmailStats.findFirst({
      where: eq(dailyEmailStats.date, today)
    })

    if (!todayStats) {
      // 创建今日记录并设置为 1
      const [newRecord] = await db.insert(dailyEmailStats).values({
        date: today,
        sentCount: 1,
        maxCount: 100,
      }).returning()
      return NextResponse.json({
        date: newRecord.date,
        sentCount: newRecord.sentCount,
        maxCount: newRecord.maxCount,
      })
    } else {
      // 检查是否已达到上限
      if (todayStats.sentCount >= todayStats.maxCount) {
        return NextResponse.json(
          { error: `今日邮件发送数量已达上限 (${todayStats.maxCount})` },
          { status: 429 }
        )
      }

      // 增加发送数量
      const [updatedRecord] = await db
        .update(dailyEmailStats)
        .set({ 
          sentCount: todayStats.sentCount + 1,
          updatedAt: new Date()
        })
        .where(eq(dailyEmailStats.date, today))
        .returning()

      return NextResponse.json({
        date: updatedRecord.date,
        sentCount: updatedRecord.sentCount,
        maxCount: updatedRecord.maxCount,
      })
    }
  } catch (error) {
    console.error("Update daily stats error:", error)
    return NextResponse.json(
      { error: "更新每日统计失败" },
      { status: 500 }
    )
  }
}