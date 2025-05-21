"use client"

import { Button } from "@/components/ui/button"
import { Gem, Sword, User2, Loader2, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ROLES, Role } from "@/lib/permissions"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const roleIcons = {
  [ROLES.DUKE]: Gem,
  [ROLES.KNIGHT]: Sword,
  [ROLES.CIVILIAN]: User2,
} as const

const roleNames = {
  [ROLES.DUKE]: "教授",
  [ROLES.KNIGHT]: "认证学生",
  [ROLES.CIVILIAN]: "未认证",
  [ROLES.EMPEROR]: "校长",
} as const

type RoleWithoutEmperor = Exclude<Role, typeof ROLES.EMPEROR>

export function PromotePanel() {
  const [searchText, setSearchText] = useState("")
  const [loading, setLoading] = useState(false)
  const [targetRole, setTargetRole] = useState<RoleWithoutEmperor>(ROLES.KNIGHT)
  const { toast } = useToast()
  const [foundUser, setFoundUser] = useState<{
    id: string;
    name?: string;
    username?: string;
    email?: string;
    role?: string;
  } | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)

  // 定义API响应类型
  type SearchResponse = {
    error?: string;
    user?: {
      id: string;
      name?: string;
      username?: string;
      email?: string;
      role?: string;
    };
  };

  // 简单搜索用户，不使用debounce
  const handleSearch = async () => {
    if (!searchText.trim()) return
    
    setLoading(true)
    setFoundUser(null)
    setSearchError(null)

    try {
      const res = await fetch("/api/roles/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchText })
      })
      const data: SearchResponse = await res.json()

      if (!res.ok) {
        setSearchError(data.error || "查询失败")
        return
      }

      if (data.user) {
        setFoundUser(data.user)
      } else {
        setSearchError("未找到用户")
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) { 
      setSearchError("查询失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!searchText || !foundUser) return

    setLoading(true)
    try {
      if (foundUser.role === targetRole) {
        toast({
          title: `用户已是${roleNames[targetRole as keyof typeof roleNames]}`,
          description: "无需重复设置",
        })
        setLoading(false)
        return
      }

      const promoteRes = await fetch("/api/roles/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: foundUser.id,
          roleName: targetRole
        })
      })

      if (!promoteRes.ok) {
        const errorData: {error?: string} = await promoteRes.json()
        throw new Error(errorData.error || "设置失败")
      }

      toast({
        title: "设置成功",
        description: `已将用户 ${foundUser.username || foundUser.email} 设为${roleNames[targetRole as keyof typeof roleNames]}`,
      })
      
      // 刷新用户信息
      setFoundUser({
        ...foundUser,
        role: targetRole
      })
    } catch (error) {
      toast({
        title: "设置失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const renderUserInfo = () => {
    if (!foundUser) return null
    
    let roleName = "未设置"
    if (foundUser.role && roleNames[foundUser.role as keyof typeof roleNames]) {
      roleName = roleNames[foundUser.role as keyof typeof roleNames]
    }

    return (
      <div className="mb-4 bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm">
            <strong>用户名：</strong>
            <span>{foundUser.username || foundUser.email}</span>
          </div>
          {foundUser.name && (
            <div className="flex items-center gap-2 text-sm">
              <strong>昵称：</strong>
              <span>{foundUser.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <strong>当前角色：</strong>
            <span>{roleName}</span>
          </div>
        </div>
      </div>
    )
  }

  // 使用类型断言确保图标类型安全
  const Icon = roleIcons[targetRole as keyof typeof roleIcons]

  return (
    <div className="bg-background rounded-lg border-2 border-primary/20 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">角色管理</h2>
      </div>

      <div className="space-y-4">
        {/* 用户信息显示区域 */}
        {foundUser && renderUserInfo()}

        {/* 错误信息 */}
        {searchError && (
          <div className="mb-4 bg-destructive/10 border border-destructive text-destructive rounded-lg p-4 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              {searchError}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="输入用户名或邮箱"
              disabled={loading}
            />
          </div>
          <Button 
            onClick={handleSearch}
            disabled={!searchText.trim() || loading}
            size="sm"
          >
            查询
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <div className="text-sm">设置为：</div>
          <Select value={targetRole} onValueChange={(value) => setTargetRole(value as RoleWithoutEmperor)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ROLES.DUKE}>
                <div className="flex items-center gap-2">
                  <Gem className="w-4 h-4" />
                  教授
                </div>
              </SelectItem>
              <SelectItem value={ROLES.KNIGHT}>
                <div className="flex items-center gap-2">
                  <Sword className="w-4 h-4" />
                  认证学生
                </div>
              </SelectItem>
              <SelectItem value={ROLES.CIVILIAN}>
                <div className="flex items-center gap-2">
                  <User2 className="w-4 h-4" />
                  未认证
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleAction}
          disabled={loading || !searchText.trim() || !foundUser}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            `设为${roleNames[targetRole as keyof typeof roleNames]}`
          )}
        </Button>
      </div>
    </div>
  )
} 
