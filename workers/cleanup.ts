interface Env {
  DB: D1Database
}

const CLEANUP_CONFIG = {
  // Whether to delete expired emails
  DELETE_EXPIRED_EMAILS: true,
  
  // Whether to delete messages from expired emails if not deleting the emails themselves
  DELETE_MESSAGES_FROM_EXPIRED: true,
  
  // Batch processing size
  BATCH_SIZE: 100,
} as const 

const main = {
  async scheduled(event: ScheduledEvent, env: Env) {
    const now = Date.now()

    try {
      // Find expired emails
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
        // First delete associated messages
        await env.DB.prepare(`
          DELETE FROM message 
          WHERE emailId IN (${placeholders})
        `).bind(...expiredEmailIds).run()
        
        // Then delete the emails
        await env.DB.prepare(`
          DELETE FROM email 
          WHERE id IN (${placeholders})
        `).bind(...expiredEmailIds).run()
        
        console.log(`Deleted ${expiredEmails.length} expired emails and their messages`)
      } else if (CLEANUP_CONFIG.DELETE_MESSAGES_FROM_EXPIRED) {
        // Only delete messages from expired emails
        await env.DB.prepare(`
          DELETE FROM message 
          WHERE emailId IN (${placeholders})
        `).bind(...expiredEmailIds).run()
        
        console.log(`Deleted messages from ${expiredEmails.length} expired emails`)
      } else {
        console.log('No cleanup actions performed (disabled in config)')
      }
    } catch (error) {
      console.error('Failed to cleanup:', error)
      throw error
    }
  }
}

export default main
