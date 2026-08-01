import React from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: 24,
          fontFamily: 'sans-serif', backgroundColor: '#f5f6fa'
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 32,
            maxWidth: 480, width: '100%', boxShadow: '0 2px 16px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ color: '#d32f2f', marginTop: 0 }}>⚠ 系統發生錯誤</h2>
            <p style={{ color: '#555' }}>請重新整理頁面，如問題持續請聯絡管理員。</p>
            <pre style={{
              background: '#f5f5f5', padding: 12, borderRadius: 8,
              fontSize: 12, color: '#333', overflow: 'auto', whiteSpace: 'pre-wrap'
            }}>
              {this.state.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 16, padding: '10px 24px', background: '#1565C0',
                color: 'white', border: 'none', borderRadius: 8,
                fontSize: 15, cursor: 'pointer'
              }}
            >
              重新整理頁面
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
