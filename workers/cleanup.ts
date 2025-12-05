interface Env {
  DB: D1Database
}

const CLEANUP_CONFIG = {
  // 是否删除过期邮箱
  DELETE_EXPIRED_EMAILS: true,
  // 是否删除过期邮箱的消息
  DELETE_MESSAGES_FROM_EXPIRED: true,
  // 未收藏邮件保留天数
  MESSAGE_RETENTION_DAYS: 7,
  // 批处理大小
  BATCH_SIZE: 100,
} as const 

const main = {
  async scheduled(event: ScheduledEvent, env: Env) {
    const now = Date.now()
    const retentionCutoff = now - (CLEANUP_CONFIG.MESSAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000)

    try {
      // 1. 删除未收藏且超过保留期的邮件
      const deleteOldMessages = await env.DB.prepare(`
        DELETE FROM message 
        WHERE starred = 0 AND received_at < ?
      `).bind(retentionCutoff).run()
      
      console.log(`Deleted ${deleteOldMessages.meta.changes} old unstarred messages`)

      // 2. 处理过期邮箱
      const { results: expiredEmails } = await env.DB
        .prepare(`
          SELECT id 
          FROM email 
          WHERE expires_at < ? 
          LIMIT ?
        `)
        .bind(now, CLEANUP_CONFIG.BATCH_SIZE)
        .all()

      if (!expiredEmails?.length) {
        console.log('No expired emails found')
        return
      }

      const expiredEmailIds = expiredEmails.map(email => email.id)
      const placeholders = expiredEmailIds.map(() => '?').join(',')

      if (CLEANUP_CONFIG.DELETE_EXPIRED_EMAILS) {
        // 删除过期邮箱的所有消息（包括收藏的）
        await env.DB.prepare(`
          DELETE FROM message 
          WHERE emailId IN (${placeholders})
        `).bind(...expiredEmailIds).run()
        
        // 删除过期邮箱
        await env.DB.prepare(`
          DELETE FROM email 
          WHERE id IN (${placeholders})
        `).bind(...expiredEmailIds).run()
        
        console.log(`Deleted ${expiredEmails.length} expired emails and their messages`)
      } else if (CLEANUP_CONFIG.DELETE_MESSAGES_FROM_EXPIRED) {
        await env.DB.prepare(`
          DELETE FROM message 
          WHERE emailId IN (${placeholders})
        `).bind(...expiredEmailIds).run()
        
        console.log(`Deleted messages from ${expiredEmails.length} expired emails`)
      }
    } catch (error) {
      console.error('Failed to cleanup:', error)
      throw error
    }
  }
}

export default main
