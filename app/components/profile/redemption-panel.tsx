"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Ticket, Copy, Loader2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useCopy } from "@/hooks/use-copy"

interface RedemptionCode {
  id: string
  code: string
  type: 'A' | 'B'
  used: boolean
  usedBy: string | null
  usedAt: string | null
  createdAt: string
}

export function RedemptionPanel() {
  const [codes, setCodes] = useState<RedemptionCode[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [type, setType] = useState<'A' | 'B'>('A')
  const [count, setCount] = useState(1)
  const { toast } = useToast()
  const { copyToClipboard } = useCopy()

  const fetchCodes = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/redemption")
      if (res.ok) {
        const data = await res.json() as RedemptionCode[]
        setCodes(data)
      }
    } catch {
      toast({ title: "错误", description: "获取兑换码失败", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCodes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generateCodes = async () => {
    setGenerating(true)
    try {
      const res = await fetch("/api/redemption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, count })
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        toast({ title: "错误", description: data.error, variant: "destructive" })
        return
      }

      const data = await res.json() as { codes: RedemptionCode[] }
      toast({ title: "成功", description: `已生成 ${data.codes.length} 个兑换码` })
      fetchCodes()
    } catch {
      toast({ title: "错误", description: "生成失败", variant: "destructive" })
    } finally {
      setGenerating(false)
    }
  }

  const copyAllUnused = () => {
    const unusedCodes = codes.filter(c => !c.used).map(c => c.code).join('\n')
    if (unusedCodes) {
      copyToClipboard(unusedCodes)
      toast({ title: "已复制", description: "未使用的兑换码已复制到剪贴板" })
    }
  }

  return (
    <div className="bg-background rounded-lg border-2 border-primary/20 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Ticket className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">兑换码管理</h2>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="space-y-2">
            <Label>类型</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as 'A' | 'B')} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="A" id="type-a" />
                <Label htmlFor="type-a" className="cursor-pointer text-sm">A - 自动创建邮箱</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="B" id="type-b" />
                <Label htmlFor="type-b" className="cursor-pointer text-sm">B - 自定义邮箱前缀</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>数量</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-24"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={generateCodes} disabled={generating}>
              {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              生成兑换码
            </Button>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">
              共 {codes.length} 个兑换码，{codes.filter(c => !c.used).length} 个未使用
            </span>
            <Button variant="outline" size="sm" onClick={copyAllUnused}>
              <Copy className="w-4 h-4 mr-1" />
              复制未使用
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {codes.map((code) => (
                <div
                  key={code.id}
                  className={`flex items-center justify-between p-2 rounded border ${
                    code.used ? 'bg-muted/50 opacity-60' : 'bg-background'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      code.type === 'A' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {code.type}
                    </span>
                    <code className="font-mono text-sm">{code.code}</code>
                    {code.used && (
                      <span className="text-xs text-muted-foreground">已使用</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(code.code)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
