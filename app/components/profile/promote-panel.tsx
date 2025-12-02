"use client"

import { Button } from "@/components/ui/button"
import { Gem, Sword, User2, Loader2, AlertCircle, Users, Trash, Mail, Edit, Check, X, UserPlus, ChevronDown, ChevronUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ROLES, Role } from "@/lib/permissions"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

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

interface RoleStats {
  [ROLES.EMPEROR]: number;
  [ROLES.DUKE]: number;
  [ROLES.KNIGHT]: number;
  [ROLES.CIVILIAN]: number;
}

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
    maxEmails?: number;
    currentEmailCount?: number;
  } | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [roleStats, setRoleStats] = useState<RoleStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editingMaxEmails, setEditingMaxEmails] = useState(false)
  const [newMaxEmails, setNewMaxEmails] = useState<number>(1)
  const [updatingMaxEmails, setUpdatingMaxEmails] = useState(false)
  const [todayUsers, setTodayUsers] = useState<{
    id: string;
    name?: string;
    username?: string;
    email?: string;
    role: string;
    createdAt?: Date;
  }[]>([])
  const [loadingTodayUsers, setLoadingTodayUsers] = useState(false)
  const [showTodayUsers, setShowTodayUsers] = useState(false)

  // 定义API响应类型
  type SearchResponse = {
    error?: string;
    user?: {
      id: string;
      name?: string;
      username?: string;
      email?: string;
      role?: string;
      maxEmails?: number;
      currentEmailCount?: number;
    };
  };

  // 获取角色统计数据
  const fetchRoleStats = useCallback(async () => {
    try {
      setLoadingStats(true)
      const response = await fetch("/api/roles/stats")

      if (!response.ok) {
        throw new Error("获取统计数据失败")
      }

      const data = await response.json()
      setRoleStats(data as RoleStats)
    } catch (error) {
      console.error("获取角色统计失败:", error)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  // 初始化时获取角色统计与今日用户
  useEffect(() => {
    fetchRoleStats()
    fetchTodayUsers()
  }, [fetchRoleStats, fetchTodayUsers])

  // 获取今日注册用户
  const fetchTodayUsers = useCallback(async () => {
    try {
      setLoadingTodayUsers(true)
      const response = await fetch("/api/roles/today-users")

      if (!response.ok) {
        throw new Error("获取今日注册用户失败")
      }

      const data = await response.json() as {
        users: typeof todayUsers;
        count: number;
      }
      setTodayUsers(data.users || [])
    } catch (error) {
      console.error("获取今日注册用户失败:", error)
    } finally {
      setLoadingTodayUsers(false)
    }
  }, [])

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
      
      // 刷新用户信息和角色统计
      setFoundUser({
        ...foundUser,
        role: targetRole
      })
      
      // 更新角色统计
      fetchRoleStats()
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

  // 删除未认证用户
  const handleDeleteUncertified = async () => {
    setDeleteLoading(true)
    try {
      const res = await fetch("/api/roles/delete-uncertified", {
        method: "DELETE"
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error((data as {error?: string}).error || "删除失败")
      }

      toast({
        title: "删除成功",
        description: (data as {message?: string, deleted?: number}).message || `已删除 ${(data as {deleted?: number}).deleted} 个未认证用户`,
      })

      // 更新角色统计
      fetchRoleStats()
    } catch (error) {
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive"
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  // 更新用户邮箱数量限制
  const handleUpdateMaxEmails = async () => {
    if (!foundUser) return

    setUpdatingMaxEmails(true)
    try {
      const res = await fetch(`/api/roles/users/${foundUser.id}/max-emails`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxEmails: newMaxEmails })
      })

      const data = await res.json() as { error?: string; message?: string }

      if (!res.ok) {
        throw new Error(data.error || "更新失败")
      }

      toast({
        title: "更新成功",
        description: data.message || "邮箱数量限制已更新",
      })

      // 更新本地状态
      setFoundUser({
        ...foundUser,
        maxEmails: newMaxEmails
      })

      setEditingMaxEmails(false)
    } catch (error) {
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive"
      })
    } finally {
      setUpdatingMaxEmails(false)
    }
  }

  const renderUserInfo = () => {
    if (!foundUser) return null

    let roleName = "未设置"
    if (foundUser.role && roleNames[foundUser.role as keyof typeof roleNames]) {
      roleName = roleNames[foundUser.role as keyof typeof roleNames]
    }

    return (
      <div className="mb-3 bg-primary/5 border border-primary/20 rounded-lg p-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs">
            <strong>用户名：</strong>
            <span>{foundUser.username || foundUser.email}</span>
          </div>
          {foundUser.name && (
            <div className="flex items-center gap-2 text-xs">
              <strong>昵称：</strong>
              <span>{foundUser.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs">
            <strong>当前角色：</strong>
            <span>{roleName}</span>
          </div>

          {/* 邮箱数量信息 */}
          <div className="border-t border-primary/10 pt-2 mt-1">
            <div className="flex items-center gap-2 text-xs mb-1">
              <Mail className="w-3 h-3" />
              <strong>邮箱使用情况：</strong>
              <span>
                {foundUser.currentEmailCount || 0} / {foundUser.maxEmails ?? 1}
              </span>
            </div>

            {/* 邮箱数量限制编辑 */}
            <div className="flex items-center gap-2 text-xs">
              <strong>邮箱数量限制：</strong>
              {editingMaxEmails ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={newMaxEmails}
                    onChange={(e) => setNewMaxEmails(Number(e.target.value))}
                    className="h-6 w-16 text-xs"
                    min="0"
                    max="1000"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={handleUpdateMaxEmails}
                    disabled={updatingMaxEmails}
                  >
                    {updatingMaxEmails ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setEditingMaxEmails(false)
                      setNewMaxEmails(foundUser.maxEmails ?? 1)
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span>{foundUser.maxEmails ?? 1}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setEditingMaxEmails(true)
                      setNewMaxEmails(foundUser.maxEmails ?? 1)
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
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

      {/* 角色统计卡片 */}
      <Card className="p-4 mb-6 bg-primary/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <h3 className="font-medium">用户角色统计</h3>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={fetchRoleStats}
            disabled={loadingStats}
          >
            <Loader2 className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-2">
          {roleStats ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-1">
                  <Gem className="w-3 h-3" /> 教授
                </span>
                <Badge variant="secondary">{roleStats[ROLES.DUKE]}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-1">
                  <Sword className="w-3 h-3" /> 认证学生
                </span>
                <Badge variant="secondary">{roleStats[ROLES.KNIGHT]}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-1">
                  <User2 className="w-3 h-3" /> 未认证
                </span>
                <Badge variant="secondary">{roleStats[ROLES.CIVILIAN]}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-1">
                  总计
                </span>
                <Badge>
                  {roleStats[ROLES.EMPEROR] + 
                   roleStats[ROLES.DUKE] + 
                   roleStats[ROLES.KNIGHT] + 
                   roleStats[ROLES.CIVILIAN]}
                </Badge>
              </div>
            </>
          ) : (
            <div className="col-span-2 text-center py-2 text-sm text-muted-foreground">
              {loadingStats ? "加载中..." : "无数据"}
            </div>
          )}
        </div>
        
        {/* 删除未认证用户按钮 */}
        <div className="mt-4 pt-2 border-t border-primary/10">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm"
                className="w-full"
                disabled={deleteLoading || (roleStats ? roleStats[ROLES.CIVILIAN] === 0 : false)}
              >
                {deleteLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash className="w-4 h-4 mr-2" />
                )}
                删除所有未认证用户
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除</AlertDialogTitle>
                <AlertDialogDescription>
                  此操作将删除所有未认证用户的账号信息，删除后无法恢复。确定要继续吗？
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={handleDeleteUncertified}
                >
                  删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>

      <div className="space-y-3">
        {/* 今日注册用户列表 */}
        <Card className="p-4 bg-primary/5">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              className="flex items-center gap-2 hover:text-primary transition-colors"
              onClick={() => setShowTodayUsers(!showTodayUsers)}
            >
              <UserPlus className="w-4 h-4" />
              <h3 className="font-medium text-sm">今日注册用户</h3>
              <Badge variant="secondary" className="ml-1">{todayUsers.length}</Badge>
              {showTodayUsers ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={fetchTodayUsers}
              disabled={loadingTodayUsers}
              className="h-6 w-6"
            >
              <Loader2 className={`w-3 h-3 ${loadingTodayUsers ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {showTodayUsers && (
            <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
              {loadingTodayUsers ? (
                <div className="text-center py-2 text-sm text-muted-foreground">
                  加载中...
                </div>
              ) : todayUsers.length === 0 ? (
                <div className="text-center py-2 text-sm text-muted-foreground">
                  今日暂无新注册用户
                </div>
              ) : (
                todayUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-primary/10 cursor-pointer"
                    onClick={() => {
                      setSearchText(user.username || user.email || "")
                      setFoundUser({
                        id: user.id,
                        name: user.name,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                      })
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">
                        {user.username || user.email || user.name || "未知用户"}
                      </span>
                      {user.name && user.username && (
                        <span className="text-xs text-muted-foreground">
                          ({user.name})
                        </span>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {roleNames[user.role as keyof typeof roleNames] || user.role}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>

        {/* 用户信息显示区域 */}
        {foundUser && renderUserInfo()}

        {/* 错误信息 */}
        {searchError && (
          <div className="mb-3 bg-destructive/10 border border-destructive text-destructive rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              {searchError}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="输入用户名或邮箱"
              disabled={loading}
              className="h-8 text-sm"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={!searchText.trim() || loading}
            size="sm"
            className="h-8 px-3 text-xs"
          >
            查询
          </Button>
          <Button
            onClick={handleAction}
            disabled={loading || !searchText.trim() || !foundUser}
            size="sm"
            className="h-8 px-3 text-xs"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              `设为${roleNames[targetRole as keyof typeof roleNames]}`
            )}
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <div className="text-xs text-muted-foreground">设置为：</div>
          <Select value={targetRole} onValueChange={(value) => setTargetRole(value as RoleWithoutEmperor)}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ROLES.DUKE}>
                <div className="flex items-center gap-1.5">
                  <Gem className="w-3 h-3" />
                  <span className="text-xs">教授</span>
                </div>
              </SelectItem>
              <SelectItem value={ROLES.KNIGHT}>
                <div className="flex items-center gap-1.5">
                  <Sword className="w-3 h-3" />
                  <span className="text-xs">认证学生</span>
                </div>
              </SelectItem>
              <SelectItem value={ROLES.CIVILIAN}>
                <div className="flex items-center gap-1.5">
                  <User2 className="w-3 h-3" />
                  <span className="text-xs">未认证</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
} 
