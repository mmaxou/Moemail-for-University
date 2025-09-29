import { drizzle } from 'drizzle-orm/d1'
import { emails, messages, users } from '../app/lib/schema'
import { nanoid } from 'nanoid'
import { eq } from 'drizzle-orm'

interface Env {
  DB: D1Database
}

const MAX_EMAIL_COUNT = 5
const MAX_MESSAGE_COUNT = 50
const BATCH_SIZE = 10 // SQLite 变量限制

async function getUserId(db: ReturnType<typeof drizzle>, identifier: string): Promise<string | null> {
  // 尝试通过 email 查找用户
  let user = await db
    .select()
    .from(users)
    .where(eq(users.email, identifier))
    .limit(1)
    .then(rows => rows[0])

  // 如果没找到，尝试通过 username 查找
  if (!user) {
    user = await db
      .select()
      .from(users)
      .where(eq(users.username, identifier))
      .limit(1)
      .then(rows => rows[0])
  }

  return user?.id || null
}

async function generateTestData(env: Env, userIdentifier: string) {
  const db = drizzle(env.DB)
  const now = new Date()

  try {
    // 获取用户 ID
    const userId = await getUserId(db, userIdentifier)
    if (!userId) {
      throw new Error(`未找到用户: ${userIdentifier}`)
    }

    // 生成测试邮箱
    const testEmails = Array.from({ length: MAX_EMAIL_COUNT }).map(() => ({
      id: crypto.randomUUID(),
      address: `${nanoid(6)}@moemail.app`,
      userId: userId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    }))

    // 插入测试邮箱
    const emailResults = await db.insert(emails).values(testEmails).returning()
    console.log('Created test emails:', emailResults)

    // 为每个邮箱生成测试消息
    for (const email of emailResults) {
      const allMessages = Array.from({ length: MAX_MESSAGE_COUNT }).map((_, index) => ({
        id: crypto.randomUUID(),
        emailId: email.id,
        fromAddress: `sender${index + 1}@example.com`,
        subject: `Test Message ${index + 1} - ${nanoid(6)}`,
        content: `This is test message ${index + 1} content.\n\nBest regards,\nSender ${index + 1}`,
        html: `<div>
          <h1>Test Message ${index + 1}</h1>
          <p>This is test message ${index + 1} content.</p>
          <p>With some <strong>HTML</strong> formatting.</p>
          <br>
          <p>Best regards,<br>Sender ${index + 1}</p>
        </div>`,
        receivedAt: new Date(now.getTime() - index * 60 * 60 * 1000),
      }))

      // 分批插入消息
      for (let i = 0; i < allMessages.length; i += BATCH_SIZE) {
        const batch = allMessages.slice(i, i + BATCH_SIZE)
        await db.insert(messages).values(batch)
        console.log(`Created batch of ${batch.length} messages for email ${email.address}`)
      }
    }

    console.log('Test data generation completed successfully!')
  } catch (error) {
    console.error('Failed to generate test data:', error)
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  async fetch(request: Request, env: Env) {
    if (request.method === 'GET') {
      const url = new URL(request.url)
      const userIdentifier = url.searchParams.get('user')
      
      if (!userIdentifier) {
        return new Response('Missing user parameter', { status: 400 })
      }

      await generateTestData(env, userIdentifier)
      return new Response('Test data generated successfully', { status: 200 })
    }
    return new Response('Method not allowed', { status: 405 })
  }
} 