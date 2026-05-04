import React, { useState } from 'react'
import { List, Avatar, Divider, Button, Input, Typography } from 'antd'
import { SendOutlined, UserOutlined } from '@ant-design/icons'

const { TextArea } = Input
const { Text, Paragraph } = Typography

interface Comment {
  username: string
  content: string
  createdAt: string
}

interface Props {
  comments: Comment[]
  onSubmit: (content: string) => Promise<void>
  submitting: boolean
}

export const CommentSection: React.FC<Props> = ({ comments, onSubmit, submitting }) => {
  const [value, setValue] = useState('')

  const handleSubmit = async () => {
    if (!value.trim()) return
    await onSubmit(value.trim())
    setValue('')
  }

  return (
    <>
      {comments.length > 0 ? (
        <List
          dataSource={comments}
          itemLayout="horizontal"
          renderItem={(comment: Comment) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />}>{comment.username.charAt(0).toUpperCase()}</Avatar>}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <a>{comment.username}</a>
                    <Text type="secondary">{new Date(comment.createdAt).toLocaleString()}</Text>
                  </div>
                }
                description={<Paragraph className="comment-text">{comment.content}</Paragraph>}
              />
            </List.Item>
          )}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>暂无评论</div>
      )}

      <Divider />

      <div style={{ display: 'flex', marginTop: 16 }}>
        <TextArea
          rows={4}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="添加评论..."
          style={{ marginRight: 16, flex: 1 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={submitting}
          onClick={handleSubmit}
          disabled={!value.trim()}
        >
          发送
        </Button>
      </div>
    </>
  )
}
