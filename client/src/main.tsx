import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#6366f1',
            borderRadius: 8,
            fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
            colorBgContainer: '#ffffff',
            colorBgLayout: '#f3f0ff',
            colorText: '#1e1b4b',
            colorTextSecondary: '#6b7280',
            colorBorder: '#ede9fe',
          },
          components: {
            Layout: { headerBg: '#ffffff', bodyBg: '#f3f0ff' },
            Card: { borderRadius: 14 },
            Table: { borderRadius: 8, headerBg: '#fdf4ff' },
            Button: { borderRadius: 7 },
            Menu: { horizontalItemSelectedColor: '#6366f1' },
          },
        }}
      >
        <App />
      </ConfigProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>
)
