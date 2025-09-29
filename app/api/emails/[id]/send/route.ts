import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createDb } from "@/lib/db"
import { messages, emails } from "@/lib/schema"
import { eq, and } from "drizzle-orm"

export const runtime = 'edge'

// 简单的邮件发送函数（使用 SMTP over HTTP API 或者其他服务）
async function sendEmailViaSMTP(config: any, emailData: any) {
  // 这里我们可以使用类似 EmailJS、SendGrid、或者 Resend 等服务
  // 为了演示，我先创建一个基本的 SMTP 实现
  
  // 注意：在实际部署中，你可能需要使用支持 Edge Runtime 的邮件服务
  // 比如 Resend、SendGrid、或者 EmailJS
  
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailData.from,
      to: [emailData.to],
      subject: emailData.subject,
      html: emailData.content.replace(/\n/g, "<br>"),
      text: emailData.content,
    }),
  })

  if (!response.ok) {
    throw new Error(`邮件发送失败: ${response.statusText}`)
  }

  return await response.json()
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户身份
    const session = await auth()
    // 之前使用 session.user.email 来判断授权，但使用本地注册用户时 email 可能为空
    // 改为仅判断用户是否已登录（存在 user.id）。
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    // 获取邮箱ID
    const { id: emailId } = await params

    // 获取表单数据
    const formData = await req.formData()
    const to = formData.get("to") as string
    const subject = formData.get("subject") as string
    const content = formData.get("content") as string
    const from = formData.get("from") as string

    // 验证必填字段
    if (!to || !subject || !content || !from) {
      return NextResponse.json(
        { error: "缺少必填字段" },
        { status: 400 }
      )
    }

    // 检查是否配置了邮件服务
    if (!process.env.RESEND_API_KEY && !process.env.SMTP_SERVER) {
      return NextResponse.json(
        { error: "邮件服务未配置。请配置 RESEND_API_KEY 或 SMTP 相关环境变量。" },
        { status: 500 }
      )
    }

    // 验证发件人邮箱是否属于当前用户
    const db = createDb()
    const email = await db.query.emails.findFirst({
      where: and(
        eq(emails.id, emailId),
        eq(emails.userId, session.user.id!)
      )
    })

    if (!email) {
      return NextResponse.json(
        { error: "邮箱不存在或无权限使用" },
        { status: 403 }
      )
    }

    console.log(`发送邮件从邮箱: ${email.address}`)

    // 处理附件（暂时不支持，因为需要更复杂的实现）
    const attachmentFiles = formData.getAll("attachments") as File[]
    if (attachmentFiles.length > 0) {
      return NextResponse.json(
        { error: "当前版本暂不支持附件，功能开发中" },
        { status: 400 }
      )
    }

    let result
    
    // 优先使用 Resend（支持 Edge Runtime）
    if (process.env.RESEND_API_KEY) {
      result = await sendEmailViaSMTP({}, {
        from,
        to,
        subject,
        content,
      })
    } else {
      // 如果没有配置 Resend，返回错误提示
      return NextResponse.json(
        { error: "请配置 RESEND_API_KEY 环境变量以使用邮件发送功能" },
        { status: 500 }
      )
    }

    // 保存发件记录到数据库
    const sentMessage = await db.insert(messages).values({
      emailId: emailId,
      fromAddress: from,
      toAddress: to,
      subject: subject,
      content: content,
      html: null,
      type: "sent",
      receivedAt: new Date()
    }).returning()

    return NextResponse.json({
      success: true,
      messageId: (result as any)?.id || "unknown",
      sentMessageId: sentMessage[0].id
    })

  } catch (error) {
    console.error("Send email error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "发送邮件失败" },
      { status: 500 }
    )
  }
} 
 