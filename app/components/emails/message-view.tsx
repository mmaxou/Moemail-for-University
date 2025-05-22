"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Loader2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"

interface Message {
  id: string
  from_address: string
  subject: string
  content: string
  html: string | null
  received_at: number
}

interface MessageViewProps {
  emailId: string
  messageId: string
  onClose: () => void
}

type ViewMode = "html" | "text"

export function MessageView({ emailId, messageId }: MessageViewProps) {
  const [message, setMessage] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("html")
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const response = await fetch(`/api/emails/${emailId}/${messageId}`)
        const data = await response.json() as { message: Message }
        setMessage(data.message)
        if (!data.message.html) {
          setViewMode("text")
        }
      } catch (error) {
        console.error("Failed to fetch message:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMessage()
  }, [emailId, messageId])

  const updateIframeContent = useCallback(() => {
    if (viewMode === "html" && message?.html && iframeRef.current) {
      const iframe = iframeRef.current
      const doc = iframe.contentDocument || iframe.contentWindow?.document

      if (doc) {
        doc.open()
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <base target="_blank">
              <style>
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
                }
                img {
                  max-width: 100%;
                  height: auto;
                }
                a {
                  color: #2563eb;
                }
                /* 滚动条样式 */
                ::-webkit-scrollbar {
                  width: 6px;
                  height: 6px;
                }
                ::-webkit-scrollbar-track {
                  background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                  background: ${theme === 'dark'
                    ? 'rgba(130, 109, 217, 0.3)'
                    : 'rgba(130, 109, 217, 0.2)'};
                  border-radius: 9999px;
                  transition: background-color 0.2s;
                }
                ::-webkit-scrollbar-thumb:hover {
                  background: ${theme === 'dark'
                    ? 'rgba(130, 109, 217, 0.5)'
                    : 'rgba(130, 109, 217, 0.4)'};
                }
                /* Firefox 滚动条 */
                * {
                  scrollbar-width: thin;
                  scrollbar-color: ${theme === 'dark'
                    ? 'rgba(130, 109, 217, 0.3) transparent'
                    : 'rgba(130, 109, 217, 0.2) transparent'};
                }
              </style>
            </head>
            <body>${message.html}</body>
          </html>
        `)
        doc.close()

        // 更新高度以填充容器
        const updateHeight = () => {
          const container = iframe.parentElement
          if (container) {
            iframe.style.height = `${container.clientHeight}px`
          }
        }

        updateHeight()
        window.addEventListener('resize', updateHeight)

        // 监听内容变化
        const resizeObserver = new ResizeObserver(updateHeight)
        resizeObserver.observe(doc.body)

        // 监听图片加载
        doc.querySelectorAll('img').forEach((img: HTMLImageElement) => {
          img.onload = updateHeight
        })

        return () => {
          window.removeEventListener('resize', updateHeight)
          resizeObserver.disconnect()
        }
      }
    }
  }, [viewMode, message, theme]);

  // 监听主题变化和内容变化
  useEffect(() => {
    updateIframeContent()
  }, [updateIframeContent])

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
        <h3 className="text-base font-bold">{message.subject}</h3>
        <div className="text-xs text-gray-500 space-y-1">
          <p>发件人：{message.from_address}</p>
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
