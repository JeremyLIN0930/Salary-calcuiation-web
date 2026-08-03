import React from 'react'
import {
  Box, Typography, Card, CardContent, CardActionArea,
  Stack,
} from '@mui/material'
import { useEmployees } from '../context/EmployeeContext'
import { useSchedule } from '../context/ScheduleContext'
import { AppModule } from '../components/layout/MainLayout'

interface Props {
  onNavigate: (m: AppModule) => void
}

const SalaryBigIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
  </svg>
)
const ScheduleBigIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
  </svg>
)

export default function DashboardPage({ onNavigate }: Props) {
  const { state: salaryState }   = useEmployees()
  const { state: scheduleState } = useSchedule()

  const today = new Date()
  const todayStr = today.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  const todayYmd = today.toISOString().slice(0, 10)

  // Find active schedule for today
  const activeTodaySchedule = scheduleState.schedules.find(s => s.weekStart <= todayYmd && s.weekEnd >= todayYmd)

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 3 }}>
      {/* Greeting */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={900} color="primary" sx={{ mb: 0.5 }}>
          薪資暨排班管理
        </Typography>
        <Typography variant="body2" color="text.secondary">{todayStr}</Typography>
      </Box>

      {/* Quick Entry Cards */}
      <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, letterSpacing: 1 }}>
        快速進入
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
        <Card elevation={0} sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardActionArea onClick={() => onNavigate('salary')} sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 56, height: 56, bgcolor: 'primary.main', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <SalaryBigIcon />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>薪資管理</Typography>
                <Typography variant="caption" color="text.secondary">薪資計算、薪資單 PDF 匯出</Typography>
                <Typography variant="body2" fontWeight={700} color="primary" sx={{ mt: 0.5 }}>
                  {salaryState.employees.length} 筆薪資資料
                </Typography>
              </Box>
            </Box>
          </CardActionArea>
        </Card>

        <Card elevation={0} sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardActionArea onClick={() => onNavigate('schedule')} sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 56, height: 56, bgcolor: '#7B1FA2', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <ScheduleBigIcon />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>排班管理</Typography>
                <Typography variant="caption" color="text.secondary">週排班表、排班表 PDF 匯出</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#7B1FA2', mt: 0.5 }}>
                  {scheduleState.schedules.length} 張週班表
                </Typography>
              </Box>
            </Box>
          </CardActionArea>
        </Card>
      </Stack>

      {/* Today's Schedule Overview */}
      <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, letterSpacing: 1 }}>
        本週排班狀態
      </Typography>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          {activeTodaySchedule ? (
            <Box>
              <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                【{activeTodaySchedule.storeId}】{activeTodaySchedule.storeName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                週次：{activeTodaySchedule.weekStart} ～ {activeTodaySchedule.weekEnd} （共 {activeTodaySchedule.employees.length} 位員工）
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.disabled" sx={{ py: 1, textAlign: 'center' }}>
              本週尚無建立排班表
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
