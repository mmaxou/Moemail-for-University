"use client"

import { useState } from "react"
import { Send, Paperclip, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { DailyEmailCounter } from "./daily-email-counter"

interface ComposeEmailProps {
  emailId: string
  emailAddress: string
  onClose?: () => void
  onSentEmail?: () => void
  // 回复相关的预填充参数
  replyTo?: string
  replySubject?: string
  replyContent?: string
}

interface Attachment {
  file: File
  id: string
}

export function ComposeEmail({ emailId, emailAddress, onClose, onSentEmail, replyTo, replySubject, replyContent }: ComposeEmailProps) {
  const [to, setTo] = useState(replyTo || "")
  const [subject, setSubject] = useState(replySubject || "")
  const [content, setContent] = useState(replyContent || "")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // 检查文件大小
    const validFiles = files.filter(file => {
      if (file.size > 1024 * 1024) { // 1MB
        toast({
          title: "文件太大",
          description: `${file.name} 超过 1MB 限制`,
          variant: "destructive"
        })
        return false
      }
      return true
    })

    // 添加文件到附件列表
    const newAttachments = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7)
    }))
    
    setAttachments(prev => [...prev, ...newAttachments])
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  const handleSend = async () => {
    // 验证必填字段
    if (!to.trim()) {
      toast({
        title: "错误",
        description: "请输入收件人地址",
        variant: "destructive"
      })
      return
    }

    if (!subject.trim()) {
      toast({
        title: "错误",
        description: "请输入邮件主题",
        variant: "destructive"
      })
      return
    }

    if (!content.trim()) {
      toast({
        title: "错误",
        description: "请输入邮件内容",
        variant: "destructive"
      })
      return
    }

    setSending(true)

    try {
      // 创建 FormData，暂时不发送附件
      const formData = new FormData()
      formData.append("to", to)
      formData.append("subject", subject)
      formData.append("content", content)
      formData.append("from", emailAddress)

      const response = await fetch(`/api/emails/${emailId}/send`, {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error((data as any)?.error || "发送失败")
      }

      toast({
        title: "成功",
        description: "邮件已发送"
      })

      // 刷新每日统计显示
      window.dispatchEvent(new CustomEvent('refreshDailyStats'))

      // 通知父组件发件成功
      if (onSentEmail) {
        onSentEmail()
      }

      // 清空表单
      setTo("")
      setSubject("")
      setContent("")
      setAttachments([])

      if (onClose) {
        onClose()
      }
    } catch (error) {
      toast({
        title: "发送失败",
        description: error instanceof Error ? error.message : "发送邮件时出错",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    else if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB'
    else return Math.round(bytes / (1024 * 1024) * 10) / 10 + ' MB'
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 space-y-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold">{replyTo ? "回复邮件" : "撰写新邮件"}</h3>
          <DailyEmailCounter />
        </div>
        <div className="text-xs text-gray-500">
          发件人：{emailAddress}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="to" className="text-sm">收件人</Label>
            <Input
              id="to"
              type="email"
              placeholder="example@email.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={sending}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="subject" className="text-sm">主题</Label>
            <Input
              id="subject"
              placeholder="邮件主题"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={sending}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="content" className="text-sm">内容</Label>
            <Textarea
              id="content"
              placeholder="邮件内容..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={sending}
              className="mt-1 min-h-[200px] resize-none"
            />
          </div>

          {/* 附件功能暂时隐藏 */}
          {false && (
          <div>
            <Label className="text-sm">附件（最大 1MB）</Label>
            <div className="mt-2 space-y-2">
              {attachments.map(attachment => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm truncate">{attachment.file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({formatFileSize(attachment.file.size)})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAttachment(attachment.id)}
                    disabled={sending}
                    className="h-6 w-6"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              
              <label
                htmlFor="file-upload"
                className={cn(
                  "flex items-center gap-2 p-2 border-2 border-dashed border-gray-300 dark:border-gray-600",
                  "rounded cursor-pointer hover:border-primary/50 transition-colors",
                  sending && "opacity-50 cursor-not-allowed"
                )}
              >
                <Paperclip className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-500">添加附件</span>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  disabled={sending}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-primary/20 flex justify-end gap-2">
        {onClose && (
          <Button
            variant="outline"
            onClick={onClose}
            disabled={sending}
          >
            取消
          </Button>
        )}
        <Button
          onClick={handleSend}
          disabled={sending}
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              发送中...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              发送
            </>
          )}
        </Button>
      </div>
    </div>
  )
} 