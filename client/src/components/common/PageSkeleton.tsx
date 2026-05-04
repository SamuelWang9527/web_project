import { Skeleton, Card, Row, Col } from 'antd'

interface Props {
  variant?: 'list' | 'detail'
}

export function PageSkeleton({ variant = 'list' }: Props) {
  if (variant === 'detail') {
    return (
      <Row gutter={24} style={{ padding: 24 }}>
        <Col flex={1}>
          <Skeleton active paragraph={{ rows: 4 }} />
          <Card style={{ marginTop: 16 }}>
            <Skeleton active paragraph={{ rows: 3 }} />
          </Card>
          <Card style={{ marginTop: 16 }}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        </Col>
        <Col style={{ width: 280 }}>
          <Card>
            <Skeleton active paragraph={{ rows: 8 }} title={false} />
          </Card>
        </Col>
      </Row>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <Skeleton.Input active style={{ width: 300, marginBottom: 16 }} />
      <Skeleton active paragraph={{ rows: 5 }} />
    </div>
  )
}
