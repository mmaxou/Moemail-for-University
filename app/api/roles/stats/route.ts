import { createDb } from "@/lib/db";
import { roles, userRoles } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { ROLES } from "@/lib/permissions";

export const runtime = "edge";

export async function GET() {
  try {
    const db = createDb();
    
    // 获取所有角色
    const allRoles = await db.query.roles.findMany({
      orderBy: [asc(roles.name)],
      with: {
        userRoles: true
      }
    });
    
    // 计算每个角色的用户数量
    const stats = allRoles.map(role => ({
      name: role.name,
      count: role.userRoles.length
    }));
    
    // 按角色排序和格式化结果
    const formattedStats = {
      [ROLES.EMPEROR]: 0,
      [ROLES.DUKE]: 0,
      [ROLES.KNIGHT]: 0,
      [ROLES.CIVILIAN]: 0
    };
    
    stats.forEach(stat => {
      if (stat.name in formattedStats) {
        formattedStats[stat.name as keyof typeof formattedStats] = stat.count;
      }
    });

    return Response.json(formattedStats);
  } catch (error) {
    console.error("Failed to get role statistics:", error);
    return Response.json(
      { error: "获取角色统计失败" },
      { status: 500 }
    );
  }
} 
