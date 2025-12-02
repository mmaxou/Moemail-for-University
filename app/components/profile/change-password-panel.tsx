"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KeyRound, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface FormErrors {
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

interface ChangePasswordPanelProps {
  hasPassword: boolean
}

export function ChangePasswordPanel({ hasPassword }: ChangePasswordPanelProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { toast } = useToast()

  // 如果用户是通过 GitHub 登录的，没有密码字段
  if (!hasPassword) {
    return (
      <div className="bg-background rounded-lg border-2 border-primary/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">修改密码</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          您的账号通过 GitHub 登录，无法修改密码。
        </p>
      </div>
    )
  }

  const validateForm = () => {
    const newErrors: FormErrors = {}
    if (!currentPassword) newErrors.currentPassword = "请输入当前密码"
    if (!newPassword) newErrors.newPassword = "请输入新密码"
    if (newPassword && newPassword.length < 8) newErrors.newPassword = "新密码长度必须大于等于8位"
    if (!confirmPassword) newErrors.confirmPassword = "请确认新密码"
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = "两次输入的密码不一致"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const res = await fetch("/api/users/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        })
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          title: "修改失败",
          description: data.error || "请稍后重试",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "修改成功",
        description: "密码已更新，下次登录请使用新密码"
      })

      // 清空表单
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setErrors({})
    } catch (error) {
      toast({
        title: "修改失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background rounded-lg border-2 border-primary/20 p-6">
      <div className="flex items-center gap-2 mb-6">
        <KeyRound className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">修改密码</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">当前密码</label>
          <div className="relative">
            <Input
              className={cn(
                "pr-10",
                errors.currentPassword && "border-destructive focus-visible:ring-destructive"
              )}
              type={showCurrentPassword ? "text" : "password"}
              placeholder="请输入当前密码"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value)
                setErrors({})
              }}
              disabled={loading}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-xs text-destructive">{errors.currentPassword}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">新密码</label>
          <div className="relative">
            <Input
              className={cn(
                "pr-10",
                errors.newPassword && "border-destructive focus-visible:ring-destructive"
              )}
              type={showNewPassword ? "text" : "password"}
              placeholder="请输入新密码（至少8位）"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                setErrors({})
              }}
              disabled={loading}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-xs text-destructive">{errors.newPassword}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">确认新密码</label>
          <div className="relative">
            <Input
              className={cn(
                "pr-10",
                errors.confirmPassword && "border-destructive focus-visible:ring-destructive"
              )}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="请再次输入新密码"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setErrors({})
              }}
              disabled={loading}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword}</p>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full"
        >
          {loading ? "保存中..." : "保存修改"}
        </Button>
      </div>
    </div>
  )
}
