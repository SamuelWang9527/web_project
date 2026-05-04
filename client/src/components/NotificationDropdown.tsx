import React, { useState } from 'react'
import { Popover, Badge, Button, List, Typography } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications'
import type { NotificationItem } from '../utils/api'

const { Text } = Typography

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  return `${Math.floor(hours / 24)} 天前`
}

const NotificationDropdown: React.FC = () => {
  const { notifications, unreadCount, markAllRead } = useNotifications()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleItemClick = (item: NotificationItem) => {
    setOpen(false)
    navigate(item.linkPath)
  }

  const content = (
    <div style={{ width: 360 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: '1px solid #ede9fe',
      }}>
        <Text strong style={{ fontSize: 14, color: '#1e1b4b' }}>通知</Text>
        {unreadCount > 0 && (
          <Button
            type="link" size="small"
            style={{ padding: 0, fontSize: 12, color: '#6366f1' }}
            onClick={markAllRead}
          >
            全部已读
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
          暂无通知
        </div>
      ) : (
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: item.isRead ? '#fff' : '#faf5ff',
                  borderBottom: '1px solid #f3f0ff',
                  alignItems: 'flex-start',
                }}
                onClick={() => handleItemClick(item)}
              >
                <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: item.isRead ? 'transparent' : '#6366f1',
                    flexShrink: 0, marginTop: 6,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ fontSize: 13, color: '#1e1b4b', display: 'block' }}>
                      {item.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#6b7280', display: 'block', marginTop: 2 }}>
                      {item.body}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginTop: 4 }}>
                      {timeAgo(item.createdAt)}
                    </Text>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  )

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      arrow={false}
      styles={{ body: { padding: 0 } }}
      overlayStyle={{ width: 360 }}
    >
      <Badge count={unreadCount} size="small" offset={[-4, 4]}>
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: '#faf5ff', border: '1px solid #ede9fe',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <BellOutlined style={{ color: '#6366f1', fontSize: 15 }} />
        </div>
      </Badge>
    </Popover>
  )
}

export default NotificationDropdown
