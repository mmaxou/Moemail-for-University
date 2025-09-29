import { createDb } from "../app/lib/db"
import { readFileSync } from "fs"
import { join } from "path"

async function migrate() {
  const db = createDb()
  
  console.log("开始迁移数据库...")
  
  try {
    // 读取迁移文件
    const migrationPath = join(process.cwd(), "drizzle", "0016_add_daily_email_stats.sql")
    const migrationSql = readFileSync(migrationPath, "utf-8")
    
    // 分割并执行每个SQL语句
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
    
    for (const statement of statements) {
      console.log("执行:", statement)
      await db.run(statement)
    }
    
    console.log("数据库迁移完成!")
  } catch (error) {
    console.error("迁移失败:", error)
    process.exit(1)
  }
}

migrate()