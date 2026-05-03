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
            colorPrimary: '#4F6EF7',
            borderRadius: 8,
            fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
            colorBgContainer: '#ffffff',
            colorBgLayout: '#f1f5f9',
          },
          components: {
            Layout: {
              siderBg: '#0f172a',
              headerBg: '#ffffff',
            },
            Menu: {
              darkItemBg: '#0f172a',
              darkSubMenuItemBg: '#1e293b',
              darkItemSelectedBg: '#1e3a8a',
            },
            Card: { borderRadius: 12 },
            Table: { borderRadius: 8 },
            Button: { borderRadius: 6 },
          },
        }}
      >
        <App />
      </ConfigProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>
)
