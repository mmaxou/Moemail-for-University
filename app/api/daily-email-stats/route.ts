import { NextRequest, NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import { dailyEmailStats } from "@/lib/schema"
import { eq, sql } from "drizzle-orm"

export const runtime = 'edge'

// 获取今日邮件统计
export async function GET() {
  try {
    const db = createDb()
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD 格式
    
    let stats = await db.query.dailyEmailStats.findFirst({
      where: eq(dailyEmailStats.date, today)
    })
    
    // 如果今日记录不存在，创建一个新记录
    if (!stats) {
      const newStats = await db.insert(dailyEmailStats).values({
        date: today,
        sentCount: 0,
        maxCount: 100
      }).returning()
      stats = newStats[0]
    }
    
    return NextResponse.json({
      date: stats.date,
      sentCount: stats.sentCount,
      maxCount: stats.maxCount
    })
  } catch (error) {
    console.error("Get daily email stats error:", error)
    return NextResponse.json(
      { error: "获取每日邮件统计失败" },
      { status: 500 }
    )
  }
}

// 增加邮件发送计数
export async function POST() {
  try {
    const db = createDb()
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD 格式
    
    // 检查今日记录是否存在
    let stats = await db.query.dailyEmailStats.findFirst({
      where: eq(dailyEmailStats.date, today)
    })
    
    if (!stats) {
      // 如果今日记录不存在，创建一个新记录并设置计数为1
      const newStats = await db.insert(dailyEmailStats).values({
        date: today,
        sentCount: 1,
        maxCount: 100
      }).returning()
      stats = newStats[0]
    } else {
      // 检查是否已达到每日限额
      if (stats.sentCount >= stats.maxCount) {
        return NextResponse.json(
          { error: "今日邮件发送数量已达上限" },
          { status: 429 }
        )
      }
      
      // 增加发送计数
      const updatedStats = await db.update(dailyEmailStats)
        .set({ 
          sentCount: sql`${dailyEmailStats.sentCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(dailyEmailStats.date, today))
        .returning()
      stats = updatedStats[0]
    }
    
    return NextResponse.json({
      date: stats.date,
      sentCount: stats.sentCount,
      maxCount: stats.maxCount
    })
  } catch (error) {
    console.error("Update daily email stats error:", error)
    return NextResponse.json(
      { error: "更新每日邮件统计失败" },
      { status: 500 }
    )
  }
}