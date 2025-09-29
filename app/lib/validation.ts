import { z } from "zod"

export const authSchema = z.object({
  username: z.string()
    .min(1, "用户名不能为空")
    .max(20, "用户名不能超过20个字符")
    .regex(/^[a-zA-Z0-9_-]+$/, "用户名只能包含字母、数字、下划线和横杠")
    .refine(val => !val.includes('@'), "用户名不能是邮箱格式"),
  password: z.string()
    .min(8, "密码长度必须大于等于8位")
})

export type AuthSchema = z.infer<typeof authSchema>