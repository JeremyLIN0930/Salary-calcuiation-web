import React, { useState } from 'react'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { EmployeeProvider } from './context/EmployeeContext'
import { ScheduleProvider } from './context/ScheduleContext'
import { SettingsProvider } from './context/SettingsContext'
import { MasterEmployeeProvider } from './context/MasterEmployeeContext'
import { SnackbarProvider } from './context/SnackbarContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import MainLayout, { AppModule } from './components/layout/MainLayout'
import { Employee } from './types/employee'
import { Schedule } from './types/schedule'

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
const DashboardPage          = React.lazy(() => import('./pages/DashboardPage'))
const HomePage               = React.lazy(() => import('./pages/HomePage'))
const EmployeeFormPage       = React.lazy(() => import('./pages/EmployeeFormPage'))
const ScheduleListPage       = React.lazy(() => import('./pages/schedule/ScheduleListPage'))
const ScheduleEditPage       = React.lazy(() => import('./pages/schedule/ScheduleEditPage'))
const EmployeeManagementPage = React.lazy(() => import('./pages/employee/EmployeeManagementPage'))
const SettingsPage           = React.lazy(() => import('./pages/settings/SettingsPage'))

// ─── Theme ────────────────────────────────────────────────────────────────────
const theme = createTheme({
  palette: {
    primary:    { main: '#1976D2' },
    background: { default: '#F5F7FA', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Noto Sans TC", "Microsoft JhengHei", "PingFang TC", sans-serif',
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 10, height: 40 },
      },
    },
    MuiCard: {
      styleOverrides: { root: { boxShadow: 'none' } },
    },
  },
})

// ─── Suspense Fallback ────────────────────────────────────────────────────────
function Loading() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', fontFamily: 'sans-serif', fontSize: 16, color: '#555',
    }}>
      載入中…
    </div>
  )
}

// ─── App Content ─────────────────────────────────────────────────────────────
function AppContent() {
  const [module, setModule] = useState<AppModule>('dashboard')

  // Salary sub-state
  const [salaryPage, setSalaryPage]     = useState<'list' | 'form'>('list')
  const [editEmployee, setEditEmployee] = useState<Employee | undefined>()

  // Schedule sub-state
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)

  const goSalaryAdd  = () => { setEditEmployee(undefined); setSalaryPage('form') }
  const goSalaryEdit = (emp: Employee) => { setEditEmployee(emp); setSalaryPage('form') }
  const goSalaryList = () => { setEditEmployee(undefined); setSalaryPage('list') }

  const hideNav = (module === 'salary' && salaryPage === 'form')

  return (
    <MainLayout
      current={module}
      onNavigate={m => {
        setModule(m)
        setSalaryPage('list')
        setEditingSchedule(null)
      }}
      hideNav={hideNav}
    >
      <React.Suspense fallback={<Loading />}>
        {/* ── Dashboard ── */}
        {module === 'dashboard' && (
          <DashboardPage onNavigate={m => { setModule(m); setEditingSchedule(null) }} />
        )}

        {/* ── Salary Module ── */}
        {module === 'salary' && salaryPage === 'list' && (
          <HomePage onAddEmployee={goSalaryAdd} onEditEmployee={goSalaryEdit} />
        )}
        {module === 'salary' && salaryPage === 'form' && (
          <EmployeeFormPage editEmployee={editEmployee} onBack={goSalaryList} />
        )}

        {/* ── Schedule Module ── */}
        {module === 'schedule' && !editingSchedule && (
          <ScheduleListPage onSelectSchedule={s => setEditingSchedule(s)} />
        )}
        {module === 'schedule' && editingSchedule && (
          <ScheduleEditPage
            schedule={editingSchedule}
            onBack={() => setEditingSchedule(null)}
          />
        )}

        {/* ── Master Employee Module ── */}
        {module === 'employee' && (
          <EmployeeManagementPage />
        )}

        {/* ── Settings Module ── */}
        {module === 'settings' && (
          <SettingsPage />
        )}
      </React.Suspense>
    </MainLayout>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>
          <SettingsProvider>
            <MasterEmployeeProvider>
              <EmployeeProvider>
                <ScheduleProvider>
                  <AppContent />
                </ScheduleProvider>
              </EmployeeProvider>
            </MasterEmployeeProvider>
          </SettingsProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
