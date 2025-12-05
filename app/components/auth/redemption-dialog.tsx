"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Gift, Mail } from "lucide-react"

interface RedemptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RedemptionDialog({ open, onOpenChange, onSuccess }: RedemptionDialogProps) {
  const [code, setCode] = useState("")
  const [emailPrefix, setEmailPrefix] = useState("")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'code' | 'prefix'>('code')
  const { toast } = useToast()

  const handleSubmitCode = async () => {
    if (!code.trim()) {
      toast({ title: "错误", description: "请输入兑换码", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/redemption/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() })
      })

      const data = await response.json() as { needPrefix?: boolean; error?: string; message?: string }

      if (!response.ok) {
        // 如果是类型B且需要邮箱前缀
        if (data.needPrefix) {
          setStep('prefix')
          setLoading(false)
          return
        }
        toast({ title: "错误", description: data.error || "兑换失败", variant: "destructive" })
        setLoading(false)
        return
      }

      toast({ title: "成功", description: data.message || "兑换成功" })
      onOpenChange(false)
      onSuccess?.()
      window.location.reload()
    } catch {
      toast({ title: "错误", description: "兑换失败，请稍后重试", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitWithPrefix = async () => {
    if (!emailPrefix.trim()) {
      toast({ title: "错误", description: "请输入邮箱前缀", variant: "destructive" })
      return
    }

    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(emailPrefix)) {
      toast({ title: "错误", description: "邮箱前缀格式不正确（3-30位字母数字）", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/redemption/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), emailPrefix: emailPrefix.trim() })
      })

      const data = await response.json() as { error?: string; message?: string }

      if (!response.ok) {
        toast({ title: "错误", description: data.error || "兑换失败", variant: "destructive" })
        return
      }

      toast({ title: "成功", description: data.message || "兑换成功" })
      onOpenChange(false)
      onSuccess?.()
      window.location.reload()
    } catch {
      toast({ title: "错误", description: "兑换失败，请稍后重试", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            学生认证
          </DialogTitle>
          <DialogDescription>
            {step === 'code' 
              ? "请输入兑换码完成学生认证，获取教育邮箱"
              : "请输入您想要的邮箱前缀"
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'code' ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">兑换码</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="请输入16位兑换码"
                maxLength={16}
                className="font-mono tracking-wider"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleSkip}>
                稍后再说
              </Button>
              <Button onClick={handleSubmitCode} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                验证
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="prefix" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                邮箱前缀
              </Label>
              <Input
                id="prefix"
                value={emailPrefix}
                onChange={(e) => setEmailPrefix(e.target.value.toLowerCase())}
                placeholder="例如: zhangsan"
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground">
                3-30位字母、数字、点、下划线或横线
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setStep('code')}>
                返回
              </Button>
              <Button onClick={handleSubmitWithPrefix} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                确认创建
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
