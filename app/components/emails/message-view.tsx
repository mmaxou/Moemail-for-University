"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Loader2, Reply } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"

interface Message {
  id: string
  from_address: string
  subject: string
  content: string
  html: string | null
  received_at: number
  type?: 'sent' | 'received'
  to_address?: string
}

interface MessageViewProps {
  emailId: string
  messageId: string
  onClose: () => void
  onReply?: (replyTo: string, replySubject: string, replyContent: string) => void
}

type ViewMode = "html" | "text"

export function MessageView({ emailId, messageId, onClose, onReply }: MessageViewProps) {
  const [message, setMessage] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("html")
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setMessage(null)
    setViewMode("html")

    const fetchMessage = async () => {
      try {
        const response = await fetch(`/api/emails/${emailId}/${messageId}`)
        if (!response.ok) {
          if (response.status === 404 && onClose) {
            onClose()
          }
          return
        }

        const data = await response.json() as { message: Message }
        if (!cancelled) {
          setMessage(data.message)
          if (!data.message.html) {
            setViewMode("text")
          }
        }
      } catch (error) {
        console.error("Failed to fetch message:", error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchMessage()
    return () => {
      cancelled = true
    }
  }, [emailId, messageId, onClose])

  const iframeDocument = useMemo(() => {
    if (!message?.html) return null

    return `<!DOCTYPE html><html><head><base target="_blank"><style>
      html, body {
        margin: 0;
        padding: 0;
        min-height: 100%;
        font-family: system-ui, -apple-system, sans-serif;
        color: ${theme === 'dark' ? '#fff' : '#000'};
        background: ${theme === 'dark' ? '#1a1a1a' : '#fff'};
      }
      body {
        padding: 20px;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      img {
        max-width: 100%;
        height: auto;
      }
      a { color: #2563eb; }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb {
        background: ${theme === 'dark' ? 'rgba(130, 109, 217, 0.3)' : 'rgba(130, 109, 217, 0.2)'};
        border-radius: 9999px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: ${theme === 'dark' ? 'rgba(130, 109, 217, 0.5)' : 'rgba(130, 109, 217, 0.4)'};
      }
      * {
        scrollbar-width: thin;
        scrollbar-color: ${theme === 'dark' ? 'rgba(130, 109, 217, 0.3) transparent' : 'rgba(130, 109, 217, 0.2) transparent'};
      }
    </style></head><body>${message.html}</body></html>`
  }, [message?.html, theme])

  useEffect(() => {
    if (viewMode !== "html") return
    if (!iframeRef.current) return
    if (!iframeDocument) return

    iframeRef.current.srcdoc = iframeDocument
  }, [iframeDocument, viewMode])

  // 处理回复按钮点击
  const handleReply = () => {
    if (!message || !onReply) return

    // 只对收件邮件显示回复按钮
    if (message.type === 'sent') return

    const replySubject = message.subject.startsWith('Re: ')
      ? message.subject
      : `Re: ${message.subject}`

    const replyContent = `\n\n--- 原始邮件 ---\n发件人: ${message.from_address}\n时间: ${new Date(message.received_at).toLocaleString()}\n主题: ${message.subject}\n\n${message.content}`

    onReply(message.from_address, replySubject, replyContent)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
      </div>
    )
  }

  if (!message) return null

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 space-y-3 border-b border-primary/20">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold flex-1">{message.subject}</h3>
          {message.type !== 'sent' && onReply && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReply}
              className="shrink-0"
            >
              <Reply className="h-4 w-4 mr-1" />
              回复
            </Button>
          )}
        </div>
        <div className="text-xs text-gray-500 space-y-1">
          {message.type === 'sent' ? (
            <>
              <p>收件人：{message.to_address}</p>
              <p>发件人：{message.from_address}</p>
            </>
          ) : (
            <p>发件人：{message.from_address}</p>
          )}
          <p>时间：{new Date(message.received_at).toLocaleString()}</p>
        </div>
      </div>
      
      {message.html && (
        <div className="border-b border-primary/20 p-2">
          <RadioGroup
            value={viewMode}
            onValueChange={(value) => setViewMode(value as ViewMode)}
            className="flex items-center gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="html" id="html" />
              <Label 
                htmlFor="html" 
                className="text-xs cursor-pointer"
              >
                HTML 格式
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="text" id="text" />
              <Label 
                htmlFor="text" 
                className="text-xs cursor-pointer"
              >
                纯文本格式
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}
      
      <div className="flex-1 overflow-auto relative">
        {viewMode === "html" && message.html ? (
          <iframe
            ref={iframeRef}
            className="absolute inset-0 w-full h-full border-0 bg-transparent"
            sandbox="allow-same-origin allow-popups"
          />
        ) : (
          <div className="p-4 text-sm whitespace-pre-wrap">
            {message.content}
          </div>
        )}
      </div>
    </div>
  )
} 
