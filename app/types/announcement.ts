// 公告相关类型定义

export interface Announcement {
  id: string
  title: string
  content: string
  enabled: boolean
  createdAt: string | Date
  updatedAt: string | Date
}

// 创建公告的请求体类型
export interface CreateAnnouncementRequest {
  title: string
  content: string
  enabled?: boolean
}

// 更新公告的请求体类型
export interface UpdateAnnouncementRequest {
  title: string
  content: string
  enabled: boolean
}