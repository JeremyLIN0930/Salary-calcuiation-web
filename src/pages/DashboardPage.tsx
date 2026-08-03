import React, { useMemo } from 'react'
import {
  Box, Typography, Card, CardContent, CardActionArea,
  Grid, Stack, Chip, Divider, Button, CircularProgress,
} from '@mui/material'
import { useEmployees } from '../context/EmployeeContext'
import { useSchedule } from '../context/ScheduleContext'
import { AppModule } from '../components/layout/MainLayout'
import PageContainer from '../components/common/PageContainer'
import SectionCard from '../components/common/SectionCard'
import EmptyState from '../components/common/EmptyState'
import { SyncService } from '../services/supabase/sync.service'
import { formatStoreTitle } from '../types/schedule'

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

interface Props {
  onNavigate: (m: AppModule) => void
}

// ── Icons ──
const SalaryBigIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
  </svg>
)
const ScheduleBigIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
  </svg>
)
const EmployeeBigIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
)
const SettingsBigIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
  </svg>
)

export default function DashboardPage({ onNavigate }: Props) {
  const { state: salaryState }   = useEmployees()
  const { state: scheduleState } = useSchedule()

  const today = new Date()

  // Dynamic Greeting based on current hour
  const greeting = useMemo(() => {
    const hour = today.getHours()
    if (hour >= 5 && hour < 12)  return '早安 ☀️'
    if (hour >= 12 && hour < 18) return '下午好 🌤️'
    return '晚上好 🌙'
  }, [today])

  // Formatted date string: YYYY 年 MM 月 DD 日 星期X
  const dateDisplay = `${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日 ${WEEKDAYS[today.getDay()]}`

  // Compute current week start/end (Monday to Sunday)
  const currentWeekRange = useMemo(() => {
    const d = new Date(today)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const mon = new Date(d.setDate(diff))
    const sun = new Date(d.setDate(diff + 6))
    const format = (dt: Date) => dt.toISOString().slice(0, 10).replace(/-/g, '/')
    return `${format(mon)} ～ ${format(sun)}`
  }, [today])

  // Recent 5 Salaries
  const recentSalaries = useMemo(() => {
    return [...salaryState.employees]
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
      .slice(0, 5)
  }, [salaryState.employees])

  // Recent 5 Schedules
  const recentSchedules = useMemo(() => {
    return [...scheduleState.schedules]
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
      .slice(0, 5)
  }, [scheduleState.schedules])

  const [syncState, setSyncState] = React.useState(SyncService.getSyncState())

  React.useEffect(() => {
    const unsubscribe = SyncService.subscribe(setSyncState)
    return () => unsubscribe()
  }, [])

  const handleSyncClick = () => {
    SyncService.triggerSync()
  }

  const getStatusChip = () => {
    switch (syncState.status) {
      case 'synced':
        return <Chip label="🟢 已同步" color="success" variant="outlined" sx={{ fontWeight: 700 }} />
      case 'pending':
        return <Chip label="🟡 等待同步" color="warning" variant="outlined" sx={{ fontWeight: 700 }} />
      case 'error':
        return <Chip label="🔴 同步失敗" color="error" variant="outlined" sx={{ fontWeight: 700 }} />
      case 'offline':
      default:
        return <Chip label="⚪ 離線模式" variant="outlined" sx={{ fontWeight: 700 }} />
    }
  }

  return (
    <PageContainer maxWidth={1100}>
      {/* ── Dynamic Header & Sync Bar ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="primary.main" sx={{ mb: 0.5 }}>
            {greeting}
          </Typography>
          <Typography variant="body1" fontWeight={700} color="text.primary" sx={{ mb: 0.5, fontSize: 18 }}>
            {dateDisplay}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            目前排班週次：{currentWeekRange}
          </Typography>
        </Box>

        {/* Sync Status Badge & Button */}
        <Card variant="outlined" sx={{ borderRadius: 3, px: 2.5, py: 1.5, bgcolor: '#FAFAFA' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {getStatusChip()}
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                {syncState.lastSyncTime ? `最後同步：${syncState.lastSyncTime}` : syncState.message}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              disabled={syncState.status === 'pending'}
              onClick={handleSyncClick}
              sx={{ borderRadius: 2, px: 1.5, fontWeight: 700, height: 36 }}
            >
              {syncState.status === 'pending' ? <CircularProgress size={16} /> : '立即同步'}
            </Button>
          </Stack>
        </Card>
      </Box>

      {/* ── 4 Large Main Feature Cards (2x2 Tablet Grid) ── */}
      <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ mb: 2, fontSize: 18 }}>
        快捷導航
      </Typography>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        {/* Card 1: Salary Management */}
        <Grid item xs={12} sm={6}>
          <Card
            variant="outlined"
            sx={{
              height: 160,
              borderRadius: 4,
              transition: 'all 0.2s',
              border: '1.5px solid #E5E7EB',
              '&:hover': { borderColor: 'primary.main', boxShadow: '0 8px 24px rgba(25,118,210,0.12)', transform: 'translateY(-2px)' },
            }}
          >
            <CardActionArea onClick={() => onNavigate('salary')} sx={{ height: '100%', p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    bgcolor: 'primary.main',
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  <SalaryBigIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={800} sx={{ fontSize: 20 }}>
                    薪資管理
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    薪資計算、薪資單 PDF 匯出
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="primary.main" sx={{ mt: 1 }}>
                    {salaryState.employees.length} 筆薪資紀錄
                  </Typography>
                </Box>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Card 2: Schedule Management */}
        <Grid item xs={12} sm={6}>
          <Card
            variant="outlined"
            sx={{
              height: 160,
              borderRadius: 4,
              transition: 'all 0.2s',
              border: '1.5px solid #E5E7EB',
              '&:hover': { borderColor: '#7B1FA2', boxShadow: '0 8px 24px rgba(123,31,162,0.12)', transform: 'translateY(-2px)' },
            }}
          >
            <CardActionArea onClick={() => onNavigate('schedule')} sx={{ height: '100%', p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    bgcolor: '#7B1FA2',
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  <ScheduleBigIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={800} sx={{ fontSize: 20 }}>
                    排班管理
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    週排班表、排班表 PDF 匯出
                  </Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: '#7B1FA2', mt: 1 }}>
                    {scheduleState.schedules.length} 張週排班表
                  </Typography>
                </Box>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Card 3: Employee Management */}
        <Grid item xs={12} sm={6}>
          <Card
            variant="outlined"
            sx={{
              height: 160,
              borderRadius: 4,
              transition: 'all 0.2s',
              border: '1.5px solid #E5E7EB',
              '&:hover': { borderColor: '#388E3C', boxShadow: '0 8px 24px rgba(56,142,60,0.12)', transform: 'translateY(-2px)' },
            }}
          >
            <CardActionArea onClick={() => onNavigate('employee')} sx={{ height: '100%', p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    bgcolor: '#388E3C',
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  <EmployeeBigIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={800} sx={{ fontSize: 20 }}>
                    員工管理
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    共用員工主資料庫維護
                  </Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: '#388E3C', mt: 1 }}>
                    維護門市員工資料
                  </Typography>
                </Box>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Card 4: System Settings */}
        <Grid item xs={12} sm={6}>
          <Card
            variant="outlined"
            sx={{
              height: 160,
              borderRadius: 4,
              transition: 'all 0.2s',
              border: '1.5px solid #E5E7EB',
              '&:hover': { borderColor: '#F57C00', boxShadow: '0 8px 24px rgba(245,124,0,0.12)', transform: 'translateY(-2px)' },
            }}
          >
            <CardActionArea onClick={() => onNavigate('settings')} sx={{ height: '100%', p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    bgcolor: '#F57C00',
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  <SettingsBigIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={800} sx={{ fontSize: 20 }}>
                    系統設定
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    公司名稱、統編與抬頭設定
                  </Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: '#F57C00', mt: 1 }}>
                    報表抬頭與資訊設定
                  </Typography>
                </Box>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>

      {/* ── Recent 5 Items (Salary & Schedule) ── */}
      <Grid container spacing={3}>
        {/* Recent Salary */}
        <Grid item xs={12} md={6}>
          <SectionCard title="最近薪資紀錄" icon="💰">
            {recentSalaries.length === 0 ? (
              <EmptyState title="尚無薪資紀錄" subtitle="點擊上方「薪資管理」即可建立。" />
            ) : (
              <Stack spacing={1.5} divider={<Divider />}>
                {recentSalaries.map(emp => (
                  <Box
                    key={emp.id}
                    onClick={() => onNavigate('salary')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      py: 0.5,
                      borderRadius: 2,
                      '&:hover': { opacity: 0.8 },
                    }}
                  >
                    <Box>
                      <Typography variant="body1" fontWeight={800}>
                        {emp.name || '未命名'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {emp.month} {emp.store ? `· ${emp.store}` : ''}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle2" fontWeight={900} color="primary.main">
                      $ {(emp.netSalary ?? 0).toLocaleString('zh-TW')}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </SectionCard>
        </Grid>

        {/* Recent Schedule */}
        <Grid item xs={12} md={6}>
          <SectionCard title="最近排班週表" icon="📅">
            {recentSchedules.length === 0 ? (
              <EmptyState title="尚無週排班表" subtitle="點擊上方「排班管理」即可建立。" />
            ) : (
              <Stack spacing={1.5} divider={<Divider />}>
                {recentSchedules.map(sch => (
                  <Box
                    key={sch.id}
                    onClick={() => onNavigate('schedule')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      py: 0.5,
                      borderRadius: 2,
                      '&:hover': { opacity: 0.8 },
                    }}
                  >
                    <Box>
                      <Typography variant="body1" fontWeight={800}>
                        {formatStoreTitle(sch)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {sch.weekStart} ～ {sch.weekEnd}
                      </Typography>
                    </Box>
                    <Chip label={`${sch.employees.length} 人`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                  </Box>
                ))}
              </Stack>
            )}
          </SectionCard>
        </Grid>
      </Grid>
    </PageContainer>
  )
}
