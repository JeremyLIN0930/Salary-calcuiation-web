import React, { useState, useMemo } from 'react'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { AppearanceProvider, useAppearance } from './context/AppearanceContext'
import { EmployeeProvider } from './context/EmployeeContext'
import { ScheduleProvider } from './context/ScheduleContext'
import { SettingsProvider } from './context/SettingsContext'
import { MasterEmployeeProvider } from './context/MasterEmployeeContext'
import { SnackbarProvider } from './context/SnackbarContext'
import { StoreProvider } from './context/StoreContext'
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

// ─── Dynamic Theme Wrapper ───────────────────────────────────────────────────
function DynamicThemeProvider({ children }: { children: React.ReactNode }) {
  const { effectiveTheme, uiDensity } = useAppearance()

  const densityScale = useMemo(() => {
    if (uiDensity === 'compact') return 0.92
    if (uiDensity === 'comfort') return 1.12
    return 1.0
  }, [uiDensity])

  const theme = useMemo(() => {
    const isDark = effectiveTheme === 'dark'

    const bgDefault     = isDark ? '#111827' : '#F8FAFC'
    const bgPaper       = isDark ? '#1F2937' : '#FFFFFF'
    const textPrimary   = isDark ? '#F9FAFB' : '#1E293B'
    const textSecondary = isDark ? '#D1D5DB' : '#64748B'
    const dividerColor  = isDark ? '#374151' : '#F1F5F9'
    const inputBg       = isDark ? '#374151' : '#F8FAFC'
    const borderColor   = isDark ? '#4B5563' : '#E2E8F0'

    return createTheme({
      palette: {
        mode: isDark ? 'dark' : 'light',
        primary:    { main: '#2F80ED' },
        error:      { main: '#EF4444' },
        success:    { main: '#34A853' },
        warning:    { main: '#F57C00' },
        background: { default: bgDefault, paper: bgPaper },
        text:       { primary: textPrimary, secondary: textSecondary },
        divider:    dividerColor,
      },
      typography: {
        fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
        h4:     { fontSize: `${Math.round(28 * densityScale)}px`, fontWeight: 900 },
        h6:     { fontSize: `${Math.round(20 * densityScale)}px`, fontWeight: 800 },
        body1:  { fontSize: `${Math.round(16 * densityScale)}px` },
        body2:  { fontSize: `${Math.round(15 * densityScale)}px` },
        button: { fontSize: `${Math.round(15 * densityScale)}px`, fontWeight: 700 },
        caption:{ fontSize: `${Math.round(13 * densityScale)}px` },
      },
      shape: { borderRadius: 16 },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 16,
              height: Math.round(48 * densityScale),
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 24,
              boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.04)',
              backgroundColor: bgPaper,
              borderColor: borderColor,
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: 14,
              height: Math.round(48 * densityScale),
              backgroundColor: inputBg,
            },
            notchedOutline: {
              borderColor: borderColor,
            },
          },
        },
      },
    })
  }, [effectiveTheme, densityScale])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}

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
      <AppearanceProvider>
        <DynamicThemeProvider>
          <SnackbarProvider>
            <SettingsProvider>
              <StoreProvider>
                <MasterEmployeeProvider>
                  <EmployeeProvider>
                    <ScheduleProvider>
                      <AppContent />
                    </ScheduleProvider>
                  </EmployeeProvider>
                </MasterEmployeeProvider>
              </StoreProvider>
            </SettingsProvider>
          </SnackbarProvider>
        </DynamicThemeProvider>
      </AppearanceProvider>
    </ErrorBoundary>
  )
}
