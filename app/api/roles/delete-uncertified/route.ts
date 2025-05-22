import { createDb } from "@/lib/db";
import { users, roles } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
import { ROLES } from "@/lib/permissions";

export const runtime = "edge";

export async function DELETE() {
  try {
    const db = createDb();
    
    // 首先找到所有的未认证用户
    const civilianRole = await db.query.roles.findFirst({
      where: eq(roles.name, ROLES.CIVILIAN),
      with: {
        userRoles: {
          with: {
            user: true
          }
        }
      }
    });

    if (!civilianRole) {
      return Response.json(
        { error: "未找到未认证角色" },
        { status: 404 }
      );
    }

    // 获取所有未认证用户的ID
    const userIds = civilianRole.userRoles.map(ur => ur.user.id);
    
    if (userIds.length === 0) {
      return Response.json({ 
        success: true,
        message: "没有找到未认证用户",
        deleted: 0 
      });
    }

    // 删除这些用户
    await db.delete(users)
      .where(
        inArray(users.id, userIds)
      );

    return Response.json({ 
      success: true,
      message: "已成功删除未认证用户",
      deleted: userIds.length 
    });
  } catch (error) {
    console.error("Failed to delete uncertified users:", error);
    return Response.json(
      { error: "删除未认证用户失败" },
      { status: 500 }
    );
  }
} 
