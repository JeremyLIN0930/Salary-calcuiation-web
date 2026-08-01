import React, { useState } from 'react'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { EmployeeProvider } from './context/EmployeeContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Employee } from './types/employee'

// Lazy-load pages to isolate render errors
const HomePage = React.lazy(() => import('./pages/HomePage'))
const EmployeeFormPage = React.lazy(() => import('./pages/EmployeeFormPage'))

const theme = createTheme({
  palette: {
    primary: { main: '#1565C0' },
    background: { default: '#f5f6fa', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Noto Sans TC", "Microsoft JhengHei", "PingFang TC", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
    },
  },
})

type Page = 'home' | 'form'

function AppContent() {
  const [page, setPage] = useState<Page>('home')
  const [editEmployee, setEditEmployee] = useState<Employee | undefined>(undefined)

  const goAdd = () => { setEditEmployee(undefined); setPage('form') }
  const goEdit = (emp: Employee) => { setEditEmployee(emp); setPage('form') }
  const goHome = () => { setEditEmployee(undefined); setPage('home') }

  return (
    <React.Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', fontSize: 16, color: '#555' }}>
        載入中...
      </div>
    }>
      {page === 'home' && <HomePage onAddEmployee={goAdd} onEditEmployee={goEdit} />}
      {page === 'form' && <EmployeeFormPage editEmployee={editEmployee} onBack={goHome} />}
    </React.Suspense>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <EmployeeProvider>
          <AppContent />
        </EmployeeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
