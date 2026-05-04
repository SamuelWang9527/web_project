import { useState, useEffect, useCallback } from 'react'
import * as api from '../utils/api'
import type { NotificationItem } from '../utils/api'

interface UseNotificationsResult {
  notifications: NotificationItem[]
  unreadCount: number
  markAllRead: () => Promise<void>
}

export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchList = useCallback(async () => {
    try {
      const res = await api.getNotifications()
      setNotifications(res.data.data)
      setUnreadCount(res.data.unreadCount)
    } catch {
      // ignore — 401 on logout is expected
    }
  }, [])

  useEffect(() => {
    fetchList()

    const token = localStorage.getItem('token')
    if (!token) return

    const es = new EventSource(`/api/notifications/sse?token=${token}`)

    es.onmessage = (event: MessageEvent) => {
      const payload = JSON.parse(event.data) as { unreadCount: number }
      setUnreadCount(payload.unreadCount)
      fetchList()
    }

    es.onerror = () => es.close()

    return () => es.close()
  }, [fetchList])

  const markAllRead = useCallback(async () => {
    await api.markAllNotificationsRead()
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }, [])

  return { notifications, unreadCount, markAllRead }
}
