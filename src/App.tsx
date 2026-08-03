import React, { useState } from 'react'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { EmployeeProvider } from './context/EmployeeContext'
import { ScheduleProvider } from './context/ScheduleContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import MainLayout, { AppModule } from './components/layout/MainLayout'
import { Employee } from './types/employee'

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
const DashboardPage      = React.lazy(() => import('./pages/DashboardPage'))
const HomePage           = React.lazy(() => import('./pages/HomePage'))
const EmployeeFormPage   = React.lazy(() => import('./pages/EmployeeFormPage'))
const SchedulePage       = React.lazy(() => import('./pages/schedule/SchedulePage'))
const ShiftSettingsPage  = React.lazy(() => import('./pages/schedule/ShiftSettingsPage'))
const ScheduleStaffPage  = React.lazy(() => import('./pages/schedule/ScheduleStaffPage'))

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

// ─── Schedule sub-view type ───────────────────────────────────────────────────
type ScheduleView = 'main' | 'shifts' | 'staff'

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
  const [module, setModule]         = useState<AppModule>('dashboard')
  const [scheduleView, setScheduleView] = useState<ScheduleView>('main')

  // Salary sub-state
  const [salaryPage, setSalaryPage] = useState<'list' | 'form'>('list')
  const [editEmployee, setEditEmployee] = useState<Employee | undefined>()

  const goSalaryAdd  = () => { setEditEmployee(undefined); setSalaryPage('form') }
  const goSalaryEdit = (emp: Employee) => { setEditEmployee(emp); setSalaryPage('form') }
  const goSalaryList = () => { setEditEmployee(undefined); setSalaryPage('list') }

  // Hide nav when editing salary form
  const hideNav = module === 'salary' && salaryPage === 'form'

  return (
    <MainLayout current={module} onNavigate={m => { setModule(m); setSalaryPage('list'); setScheduleView('main') }} hideNav={hideNav}>
      <React.Suspense fallback={<Loading />}>
        {/* ── Dashboard ── */}
        {module === 'dashboard' && (
          <DashboardPage onNavigate={m => { setModule(m); setScheduleView('main') }} />
        )}

        {/* ── Salary ── */}
        {module === 'salary' && salaryPage === 'list' && (
          <HomePage onAddEmployee={goSalaryAdd} onEditEmployee={goSalaryEdit} />
        )}
        {module === 'salary' && salaryPage === 'form' && (
          <EmployeeFormPage editEmployee={editEmployee} onBack={goSalaryList} />
        )}

        {/* ── Schedule ── */}
        {module === 'schedule' && scheduleView === 'main' && (
          <SchedulePageWrapper onGoShifts={() => setScheduleView('shifts')} onGoStaff={() => setScheduleView('staff')} />
        )}
        {module === 'schedule' && scheduleView === 'shifts' && (
          <BackableWrapper label="← 返回排班" onBack={() => setScheduleView('main')}>
            <ShiftSettingsPage />
          </BackableWrapper>
        )}
        {module === 'schedule' && scheduleView === 'staff' && (
          <BackableWrapper label="← 返回排班" onBack={() => setScheduleView('main')}>
            <ScheduleStaffPage />
          </BackableWrapper>
        )}
      </React.Suspense>
    </MainLayout>
  )
}

// ─── Schedule page with settings buttons ─────────────────────────────────────
function SchedulePageWrapper({ onGoShifts, onGoStaff }: { onGoShifts: () => void; onGoStaff: () => void }) {
  return (
    <div>
      {/* Settings toolbar */}
      <div style={{ padding: '8px 16px 0', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={onGoStaff}
          style={{ border: '1px solid #ddd', background: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          👤 員工設定
        </button>
        <button
          onClick={onGoShifts}
          style={{ border: '1px solid #ddd', background: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          ⚙️ 班別設定
        </button>
      </div>
      <SchedulePage />
    </div>
  )
}

// ─── Backable Wrapper (for sub-pages) ────────────────────────────────────────
function BackableWrapper({ label, onBack, children }: { label: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>
        <button
          onClick={onBack}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#1976D2', padding: 0 }}>
          {label}
        </button>
      </div>
      {children}
    </div>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <EmployeeProvider>
          <ScheduleProvider>
            <AppContent />
          </ScheduleProvider>
        </EmployeeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
