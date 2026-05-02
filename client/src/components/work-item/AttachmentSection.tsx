import React from 'react'
import { Button, Popconfirm, Modal } from 'antd'
import {
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FileImageOutlined,
} from '@ant-design/icons'
import { downloadFile } from '@/utils/api'

interface Attachment {
  filename: string
  originalName: string
  path: string
  mimetype: string
  size: number
}

interface Props {
  attachments: Attachment[]
  onUpload: (file: File) => void
  onDelete: (filename: string) => void
  uploading: boolean
  canEdit: boolean
}

const renderFileIcon = (mimetype: string) => {
  if (mimetype.startsWith('image/')) return <FileImageOutlined style={{ fontSize: 24, color: '#1890ff' }} />
  if (mimetype.includes('pdf'))      return <FilePdfOutlined   style={{ fontSize: 24, color: '#f5222d' }} />
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet'))
    return <FileExcelOutlined style={{ fontSize: 24, color: '#52c41a' }} />
  if (mimetype.includes('word') || mimetype.includes('document'))
    return <FileWordOutlined style={{ fontSize: 24, color: '#1890ff' }} />
  return <FileOutlined style={{ fontSize: 24, color: '#faad14' }} />
}

export const AttachmentSection: React.FC<Props> = ({
  attachments,
  onUpload,
  onDelete,
  uploading,
  canEdit,
}) => {
  const [previewVisible, setPreviewVisible] = React.useState(false)
  const [previewImage, setPreviewImage]     = React.useState('')
  const [previewTitle, setPreviewTitle]     = React.useState('')

  const handlePreview = (attachment: Attachment) => {
    setPreviewImage(`${attachment.path}`)
    setPreviewTitle(attachment.originalName)
    setPreviewVisible(true)
  }

  const handleDownload = (attachment: Attachment) => {
    downloadFile(attachment.path)
  }

  const handleUploadClick = () => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt'
    fileInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement
      if (target.files && target.files.length > 0) {
        onUpload(target.files[0])
      }
    }
    fileInput.click()
  }

  return (
    <div>
      {canEdit && (
        <div style={{ marginBottom: 16 }}>
          <Button icon={<UploadOutlined />} onClick={handleUploadClick} loading={uploading}>
            上传附件
          </Button>
        </div>
      )}

      {attachments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>暂无附件</div>
      ) : (
        <div className="file-upload-list">
          {attachments.map((attachment, index) => {
            if (!attachment || !attachment.mimetype) return null
            return (
              <div
                key={index}
                className="file-list-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  borderBottom: '1px solid #f0f0f0',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  backgroundColor: '#fafafa',
                }}
              >
                <div className="file-icon" style={{ marginRight: '12px' }}>
                  {attachment.mimetype.startsWith('image/') ? (
                    <div
                      style={{
                        width: '60px',
                        height: '60px',
                        overflow: 'hidden',
                        borderRadius: '4px',
                        border: '1px solid #d9d9d9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={() => handlePreview(attachment)}
                    >
                      <img
                        src={attachment.path}
                        alt={attachment.originalName}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    renderFileIcon(attachment.mimetype)
                  )}
                </div>

                <div className="file-info" style={{ flex: 1 }}>
                  <div className="file-name" style={{ fontWeight: 'bold' }}>{attachment.originalName}</div>
                  <div className="file-size" style={{ color: '#888', fontSize: '12px' }}>
                    {(attachment.size / 1024).toFixed(2)} KB
                  </div>
                </div>

                <div className="file-actions">
                  {attachment.mimetype.startsWith('image/') && (
                    <Button type="link" icon={<EyeOutlined />} onClick={() => handlePreview(attachment)}>
                      预览
                    </Button>
                  )}
                  <Button type="link" icon={<DownloadOutlined />} onClick={() => handleDownload(attachment)}>
                    下载
                  </Button>
                  {canEdit && (
                    <Popconfirm
                      title="确定要删除此附件吗？"
                      onConfirm={() => onDelete(attachment.filename)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
                    </Popconfirm>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        style={{ top: 20 }}
        styles={{ body: { padding: '24px', textAlign: 'center' } }}
      >
        <img
          alt={previewTitle}
          style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 200px)', objectFit: 'contain' }}
          src={previewImage}
        />
      </Modal>
    </div>
  )
}
