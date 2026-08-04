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
  const { effectiveTheme, uiDensity, tokens } = useAppearance()

  const densityScale = useMemo(() => {
    if (uiDensity === 'compact') return 0.92
    if (uiDensity === 'comfort') return 1.12
    return 1.0
  }, [uiDensity])

  const theme = useMemo(() => {
    const isDark = effectiveTheme === 'dark'

    return createTheme({
      palette: {
        mode: isDark ? 'dark' : 'light',
        primary:    { main: tokens.primary, dark: tokens.primaryHover },
        error:      { main: tokens.danger },
        success:    { main: tokens.success },
        warning:    { main: tokens.warning },
        background: { default: tokens.background, paper: tokens.card },
        text:       { primary: tokens.textPrimary, secondary: tokens.textSecondary },
        divider:    tokens.divider,
        action: {
          hover: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
        },
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
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: tokens.background,
              color: tokens.textPrimary,
              transition: 'background-color 250ms ease, color 250ms ease',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 16,
              height: Math.round(48 * densityScale),
              transition: 'background-color 250ms ease, color 250ms ease, border-color 250ms ease',
            },
            outlined: {
              borderColor: tokens.border,
              color: tokens.textPrimary,
              '&:hover': {
                borderColor: tokens.primary,
                backgroundColor: tokens.surfaceSecondary,
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 24,
              boxShadow: tokens.shadow,
              backgroundColor: tokens.card,
              borderColor: tokens.border,
              color: tokens.textPrimary,
              transition: 'background-color 250ms ease, border-color 250ms ease, color 250ms ease',
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundColor: tokens.card,
              color: tokens.textPrimary,
              borderColor: tokens.border,
              transition: 'background-color 250ms ease, border-color 250ms ease, color 250ms ease',
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              backgroundColor: tokens.card,
              color: tokens.textPrimary,
              borderRadius: 24,
              boxShadow: tokens.shadow,
            },
          },
        },
        MuiTable: {
          styleOverrides: {
            root: {
              backgroundColor: tokens.card,
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              borderColor: tokens.border,
              color: tokens.textPrimary,
              padding: Math.round(16 * densityScale),
            },
            head: {
              backgroundColor: tokens.tableHeader,
              color: tokens.textSecondary,
              fontWeight: 700,
            },
          },
        },
        MuiTableRow: {
          styleOverrides: {
            root: {
              backgroundColor: tokens.tableRow,
              '&:hover': {
                backgroundColor: tokens.tableHover,
              },
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: 14,
              height: Math.round(48 * densityScale),
              backgroundColor: tokens.inputBackground,
              color: tokens.textPrimary,
              transition: 'background-color 250ms ease, border-color 250ms ease, color 250ms ease',
            },
            notchedOutline: {
              borderColor: tokens.border,
            },
            input: {
              '&::placeholder': {
                color: tokens.placeholder,
                opacity: 1,
              },
            },
          },
        },
        MuiSelect: {
          styleOverrides: {
            icon: {
              color: tokens.textSecondary,
            },
          },
        },
        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              backgroundColor: isDark ? '#334155' : '#1E293B',
              color: '#FFFFFF',
              borderRadius: 8,
              fontSize: 13,
            },
          },
        },
        MuiSnackbarContent: {
          styleOverrides: {
            root: {
              backgroundColor: isDark ? '#1E293B' : '#1E293B',
              color: '#FFFFFF',
              borderRadius: 12,
            },
          },
        },
      },
    })
  }, [effectiveTheme, densityScale, tokens])

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
