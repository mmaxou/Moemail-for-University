"use client"

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useMemo } from "react"
import {Mail, Calendar, RefreshCw, Trash2, Search, Send, Trash, Inbox, SendHorizontal} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useThrottle } from "@/hooks/use-throttle"
import { EMAIL_CONFIG } from "@/config"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input"

interface Message {
  id: string
  from_address: string
  subject: string
  received_at: number
  type?: 'sent' | 'received' // 添加类型字段，用于区分发件和收件
  to_address?: string // 发件时的收件人地址
}

interface MessageListProps {
  email: {
    id: string
    address: string
  }
  onMessageSelect: (messageId: string | null) => void
  selectedMessageId?: string | null
  onComposeClick?: () => void
}

interface MessageResponse {
  messages: Message[]
  nextCursor: string | null
  total: number
}

interface MessageListRef {
  refresh: () => void
}

export const MessageList = forwardRef<MessageListRef, MessageListProps>(function MessageList({ email, onMessageSelect, selectedMessageId, onComposeClick }, ref) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const pollTimeoutRef = useRef<ReturnType<typeof setInterval>>();
  const messagesRef = useRef<Message[]>([]) // 添加 ref 来追踪最新的消息列表
  const [total, setTotal] = useState(0)
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([])
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)
  const [messageType, setMessageType] = useState<'all' | 'received' | 'sent'>('all') // 邮件类型过滤
  const { toast } = useToast()

  // 当 messages 改变时更新 ref
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // 消息已经包含收件和发件，按时间排序
  const allMessages = useMemo(() => {
    return [...messages].sort((a, b) => b.received_at - a.received_at)
  }, [messages])

  // 根据邮件类型过滤消息
  const typeFilteredMessages = messageType === 'all'
    ? allMessages
    : allMessages.filter((message: Message) => message.type === messageType)

  // 当搜索条件或邮件类型变化时更新过滤后的消息列表
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMessages(typeFilteredMessages)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = typeFilteredMessages.filter((message: Message) =>
      message.subject.toLowerCase().includes(query) ||
      message.from_address.toLowerCase().includes(query) ||
      (message.to_address && message.to_address.toLowerCase().includes(query))
    )
    setFilteredMessages(filtered)
  }, [searchQuery, typeFilteredMessages, messageType])

  const fetchMessages = useCallback(async (cursor?: string) => {
    try {
      const url = new URL(`/api/emails/${email.id}`, window.location.origin)
      if (cursor) {
        url.searchParams.set('cursor', cursor)
      }
      const response = await fetch(url)
      const data = await response.json() as MessageResponse

      if (!cursor) {
        const newMessages = data.messages
        const oldMessages = messagesRef.current

        const lastDuplicateIndex = newMessages.findIndex(
          (newMsg: Message) => oldMessages.some((oldMsg: Message) => oldMsg.id === newMsg.id)
        )

        if (lastDuplicateIndex === -1) {
          setMessages(newMessages)
          setNextCursor(data.nextCursor)
          setTotal(data.total)
          return
        }
        const uniqueNewMessages = newMessages.slice(0, lastDuplicateIndex)
        setMessages([...uniqueNewMessages, ...oldMessages])
        setTotal(data.total)
        return
      }
  setMessages((prev: Message[]) => [...prev, ...data.messages])
      setNextCursor(data.nextCursor)
      setTotal(data.total)
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }, [email.id])

  const startPolling = () => {
    stopPolling()
    pollTimeoutRef.current = setInterval(() => {
      if (!refreshing && !loadingMore) {
        fetchMessages()
      }
    }, EMAIL_CONFIG.POLL_INTERVAL)
  }

  const stopPolling = () => {
    if (pollTimeoutRef.current) {
      clearInterval(pollTimeoutRef.current)
      pollTimeoutRef.current = undefined
    }
  }

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchMessages()
  }, [fetchMessages])

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    refresh: handleRefresh
  }), [handleRefresh])

  const handleScroll = useThrottle((e: React.UIEvent<HTMLDivElement>) => {
    if (loadingMore) return

    const { scrollHeight, scrollTop, clientHeight } = e.currentTarget
    const threshold = clientHeight * 1.5
    const remainingScroll = scrollHeight - scrollTop

    if (remainingScroll <= threshold && nextCursor) {
      setLoadingMore(true)
      fetchMessages(nextCursor)
    }
  }, 200)

  const handleDelete = async (message: Message) => {
    try {
      const response = await fetch(`/api/emails/${email.id}/${message.id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const data = await response.json()
        toast({
          title: "错误",
          description: (data as { error: string }).error,
          variant: "destructive"
        })
        return
      }

  setMessages((prev: Message[]) => prev.filter((e: Message) => e.id !== message.id))
  setTotal((prev: number) => prev - 1)

      toast({
        title: "成功",
        description: "邮件已删除"
      })

      if (selectedMessageId === message.id) {
        onMessageSelect(null)
      }
    } catch {
      toast({
        title: "错误",
        description: "删除邮件失败",
        variant: "destructive"
      })
    } finally {
      setMessageToDelete(null)
    }
  }

  const handleDeleteAll = async () => {
    const idsToDelete = filteredMessages.map((msg: Message) => msg.id)
    if (idsToDelete.length === 0) {
      return
    }

    setDeletingAll(true)
    try {
      const response = await fetch(`/api/emails/${email.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "deleteMessagesByIds", ids: idsToDelete })
      })

      if (!response.ok) {
        const data = await response.json()
        toast({
          title: "错误",
          description: (data as { error: string }).error,
          variant: "destructive"
        })
        return
      }

      const result = await response.json() as { success: boolean; deletedCount: number; deletedIds: string[] }

      const deletedIdSet = new Set(result.deletedIds)

      const remainingMessages = messagesRef.current.filter((m: Message) => !deletedIdSet.has(m.id))
      messagesRef.current = remainingMessages
      setMessages(remainingMessages)
      setTotal((prev: number) => Math.max(0, prev - result.deletedCount))

      if (selectedMessageId && deletedIdSet.has(selectedMessageId)) {
        onMessageSelect(null)
      }

      toast({
        title: "成功",
        description: `已删除 ${result.deletedCount} 封邮件`
      })
    } catch (error) {
      console.error("Delete all messages error:", error)
      toast({
        title: "错误",
        description: "批量删除失败",
        variant: "destructive"
      })
    } finally {
      setDeletingAll(false)
      setShowDeleteAllDialog(false)
    }
  }

  useEffect(() => {
    if (!email.id) {
      return
    }
    setLoading(true)
    setNextCursor(null)
    fetchMessages()
    startPolling() 

    return () => {
      stopPolling() 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email.id])

  return (
  <>
    <div className="h-full flex flex-col">
      {/* 邮件类型切换按钮 */}
      <div className="p-2 border-b border-primary/10">
        <div className="flex items-center gap-1">
          <Button
            variant={messageType === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMessageType('all')}
            className="h-7 px-3 text-xs"
          >
            全部
          </Button>
          <Button
            variant={messageType === 'received' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMessageType('received')}
            className="h-7 px-3 text-xs"
          >
            <Inbox className="w-3 h-3 mr-1" />
            收件箱
          </Button>
          <Button
            variant={messageType === 'sent' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMessageType('sent')}
            className="h-7 px-3 text-xs"
          >
            <SendHorizontal className="w-3 h-3 mr-1" />
            发件箱
          </Button>
        </div>
      </div>

      {/* 功能按钮栏 */}
      <div className="p-2 flex items-center border-b border-primary/20 gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={refreshing}
          className={cn("h-8 w-8 flex-shrink-0", refreshing && "animate-spin")}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onComposeClick}
          className="h-8 w-8 flex-shrink-0"
          title="发送邮件"
        >
          <Send className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowDeleteAllDialog(true)}
          disabled={typeFilteredMessages.length === 0 || deletingAll}
          className="h-8 w-8 flex-shrink-0"
          title={typeFilteredMessages.length === 0 ? "无可删除邮件" : `删除所有${messageType === 'all' ? '邮件' : messageType === 'received' ? '收件' : '发件'}`}
        >
          <Trash className="h-4 w-4 text-destructive" />
        </Button>

        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索邮件..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        
        <span className="text-xs text-gray-500 flex-shrink-0">
          {filteredMessages.length > 0
            ? searchQuery || messageType !== 'all'
              ? `${filteredMessages.length}/${typeFilteredMessages.length} 封邮件`
              : `${total} 封邮件`
            : messageType === 'received'
              ? "暂无收件"
              : messageType === 'sent'
                ? "暂无发件"
                : "暂无邮件"}
        </span>
      </div>

      <div className="flex-1 overflow-auto" onScroll={handleScroll}>
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">加载中...</div>
        ) : filteredMessages.length > 0 ? (
          <div className="divide-y divide-primary/10">
            {filteredMessages.map((message: Message) => (
              <div
                key={message.id}
                onClick={() => onMessageSelect(message.id)}
                className={cn(
                  "p-3 hover:bg-primary/5 cursor-pointer group",
                  selectedMessageId === message.id && "bg-primary/10"
                )}
              >
                <div className="flex items-start gap-3">
                  {message.type === 'sent' ? (
                    <Send className="w-4 h-4 text-green-600 mt-1" />
                  ) : (
                    <Mail className="w-4 h-4 text-primary/60 mt-1" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{message.subject}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <span className="truncate">
                        {message.type === 'sent'
                          ? `发送至: ${message.to_address}`
                          : message.from_address
                        }
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(message.received_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMessageToDelete(message)
                      }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {loadingMore && (
              <div className="text-center text-sm text-gray-500 py-2">
                加载更多...
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-gray-500">
            {searchQuery ? "没有匹配的邮件" : "暂无邮件"}
          </div>
        )}
      </div>
    </div>
    <AlertDialog open={!!messageToDelete} onOpenChange={() => setMessageToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除邮件 {messageToDelete?.subject} 吗？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => messageToDelete && handleDelete(messageToDelete)}
          >
            删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除所有{messageType === 'all' ? '邮件' : messageType === 'received' ? '收件' : '发件'}</AlertDialogTitle>
          <AlertDialogDescription>
            {messageType === 'all' && `此操作将删除该邮箱中的全部 ${total} 封邮件（包含收件与发件），不可撤销。`}
            {messageType === 'received' && `此操作将删除该邮箱中的所有收件（不会删除发件记录），不可撤销。`}
            {messageType === 'sent' && `此操作将删除该邮箱中的所有发件记录（不会影响收件），不可撤销。`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletingAll}>取消</AlertDialogCancel>
          <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteAll}
              disabled={deletingAll}
          >
            {deletingAll ? "删除中..." : "确认删除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  )
})
