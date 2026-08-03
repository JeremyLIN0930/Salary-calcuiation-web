import React from 'react'
import {
  Box, AppBar, Toolbar, Typography, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, BottomNavigation, BottomNavigationAction,
  useMediaQuery, useTheme, Divider,
} from '@mui/material'

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

const DashboardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 13h8V3H3zm0 8h8v-6H3zm10 0h8V11h-8zm0-18v6h8V3z"/>
  </svg>
)
const SalaryIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
  </svg>
)
const ScheduleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
  </svg>
)

// ─── Types ───────────────────────────────────────────────────────────────────

export type AppModule = 'dashboard' | 'salary' | 'schedule'

interface NavItem {
  key: AppModule
  label: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: '首頁',    icon: <DashboardIcon /> },
  { key: 'salary',    label: '薪資管理', icon: <SalaryIcon /> },
  { key: 'schedule',  label: '排班管理', icon: <ScheduleIcon /> },
]

const DRAWER_WIDTH = 200

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  current: AppModule
  onNavigate: (m: AppModule) => void
  children: React.ReactNode
  /** Hide the shared header/nav (e.g. while editing a salary form) */
  hideNav?: boolean
}

export default function MainLayout({ current, onNavigate, children, hideNav }: Props) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))    // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg')) // 600~1200px

  const useDrawer = !isMobile   // tablet + desktop get side drawer
  const useBottom = isMobile    // phones get bottom navigation

  if (hideNav) {
    return <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>{children}</Box>
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* ── Side Drawer (tablet / desktop) ─── */}
      {useDrawer && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              bgcolor: '#fff',
              borderRight: '1px solid #E5E7EB',
            },
          }}
        >
          {/* Logo / App Name */}
          <Box sx={{ px: 2, py: 2.5, borderBottom: '1px solid #E5E7EB' }}>
            <Typography variant="subtitle2" fontWeight={900} color="primary" sx={{ fontSize: 13, letterSpacing: 1 }}>
              薪資暨排班
            </Typography>
            <Typography variant="caption" color="text.secondary">管理系統</Typography>
          </Box>

          <List sx={{ pt: 1 }}>
            {NAV_ITEMS.map(item => (
              <ListItemButton
                key={item.key}
                selected={current === item.key}
                onClick={() => onNavigate(item.key)}
                sx={{
                  mx: 1, mb: 0.5, borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '& .MuiListItemIcon-root': { color: 'white' },
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: current === item.key ? 'white' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: current === item.key ? 700 : 400 }}
                />
              </ListItemButton>
            ))}
          </List>
        </Drawer>
      )}

      {/* ── Main Content ─── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top AppBar (mobile only — tablet/desktop relies on drawer) */}
        {isMobile && (
          <AppBar position="sticky" elevation={0}
            sx={{ bgcolor: 'white', borderBottom: '1px solid #E5E7EB', color: 'text.primary' }}>
            <Toolbar sx={{ minHeight: 52 }}>
              <Typography variant="h6" fontWeight={800} color="primary" sx={{ fontSize: 16, letterSpacing: 1 }}>
                薪資暨排班管理
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        {/* Tablet / desktop header bar */}
        {!isMobile && (
          <Box sx={{
            px: 3, py: 1.5, bgcolor: 'white', borderBottom: '1px solid #E5E7EB',
            display: 'flex', alignItems: 'center',
          }}>
            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
              {NAV_ITEMS.find(n => n.key === current)?.label ?? ''}
            </Typography>
          </Box>
        )}

        {/* Page Content */}
        <Box sx={{ flex: 1, overflow: 'auto', pb: useBottom ? 7 : 0 }}>
          {children}
        </Box>
      </Box>

      {/* ── Bottom Navigation (mobile) ─── */}
      {useBottom && (
        <BottomNavigation
          value={current}
          onChange={(_, v) => onNavigate(v as AppModule)}
          sx={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100,
            borderTop: '1px solid #E5E7EB', height: 56,
          }}
        >
          {NAV_ITEMS.map(item => (
            <BottomNavigationAction
              key={item.key}
              value={item.key}
              label={item.label}
              icon={item.icon}
              sx={{ fontSize: 11, '& .MuiBottomNavigationAction-label': { fontSize: 11 } }}
            />
          ))}
        </BottomNavigation>
      )}
    </Box>
  )
}
