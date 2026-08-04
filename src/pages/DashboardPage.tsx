import React, { useMemo } from 'react'
import {
  Box, Typography, Card, CardActionArea,
  Grid, Stack, Chip, Divider,
} from '@mui/material'
import { useEmployees } from '../context/EmployeeContext'
import { useSchedule } from '../context/ScheduleContext'
import { useMasterEmployees } from '../context/MasterEmployeeContext'
import { useStoreContext } from '../context/StoreContext'
import { AppModule } from '../components/layout/MainLayout'
import PageContainer from '../components/common/PageContainer'
import { formatStoreTitle } from '../types/schedule'

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

interface Props {
  onNavigate: (m: AppModule) => void
}

// ── Japanese Minimalist Hero Flat Illustration ──
const JapaneseDeskIllustration = () => (
  <svg width="100%" height="160" viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: 300, display: 'block', margin: '0 auto' }}>
    {/* Soft background shape */}
    <rect x="10" y="10" width="300" height="160" rx="24" fill="#F1F5F9" opacity="0.8" />
    <circle cx="250" cy="50" r="40" fill="#E2E8F0" opacity="0.6" />
    <circle cx="70" cy="130" r="30" fill="#EBF3FE" opacity="0.7" />
    
    {/* Window / Soft View */}
    <rect x="185" y="28" width="80" height="65" rx="12" fill="#EBF3FE" stroke="#CBD5E1" strokeWidth="1.5" />
    <line x1="225" y1="28" x2="225" y2="93" stroke="#CBD5E1" strokeWidth="1.2" />
    <line x1="185" y1="60" x2="265" y2="60" stroke="#CBD5E1" strokeWidth="1.2" />
    <circle cx="240" cy="44" r="7" fill="#FDE047" opacity="0.9" />
    <path d="M195 52 Q 200 48 205 52" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" fill="none" />

    {/* Minimal Desk Surface */}
    <rect x="35" y="138" width="250" height="7" rx="3.5" fill="#94A3B8" />

    {/* Laptop */}
    <rect x="110" y="108" width="56" height="30" rx="4" fill="#64748B" />
    <rect x="114" y="111" width="48" height="23" rx="2" fill="#FFFFFF" />
    <path d="M102 138 H 174 L 170 141 H 106 Z" fill="#475569" />
    {/* Laptop Screen Accent lines */}
    <line x1="120" y1="120" x2="145" y2="120" stroke="#4F8FEF" strokeWidth="2" strokeLinecap="round" />
    <line x1="120" y1="126" x2="135" y2="126" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />

    {/* Desk Calendar */}
    <rect x="52" y="113" width="28" height="25" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
    <rect x="52" y="113" width="28" height="7" rx="2" fill="#4F8FEF" />
    <circle cx="59" cy="125" r="1.2" fill="#94A3B8" />
    <circle cx="66" cy="125" r="1.2" fill="#94A3B8" />
    <circle cx="73" cy="125" r="1.2" fill="#94A3B8" />
    <circle cx="59" cy="131" r="1.2" fill="#94A3B8" />
    <circle cx="66" cy="131" r="1.2" fill="#4F8FEF" />

    {/* Coffee Mug */}
    <rect x="185" y="120" width="15" height="18" rx="4" fill="#FFE0B2" stroke="#F57C00" strokeWidth="1.2" />
    <path d="M200 124 C 204 124 204 134 200 134" stroke="#F57C00" strokeWidth="1.2" fill="none" />
    <path d="M190 115 Q 192 110 190 107" stroke="#FDBA74" strokeWidth="1.2" strokeLinecap="round" fill="none" />

    {/* Monstera / Plant in Pot */}
    <path d="M228 138 L 230 126 H 244 L 246 138 Z" fill="#CBD5E1" />
    <path d="M237 126 C 222 108 212 113 217 103 C 227 98 236 113 237 126 Z" fill="#86EFAC" />
    <path d="M237 126 C 251 108 261 113 256 103 C 246 98 238 113 237 126 Z" fill="#4ADE80" />
    <path d="M237 126 C 237 104 241 96 237 92 C 233 96 237 104 237 126 Z" fill="#22C55E" />
  </svg>
)

// ── Icons for Navigation Cards ──
const SalaryCardIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="3" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <circle cx="7" cy="15" r="1" fill="currentColor" />
    <circle cx="12" cy="15" r="1" fill="currentColor" />
  </svg>
)

const ScheduleCardIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="3" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <circle cx="8" cy="14" r="1" fill="currentColor" />
    <circle cx="12" cy="14" r="1" fill="currentColor" />
    <circle cx="16" cy="14" r="1" fill="currentColor" />
  </svg>
)

const EmployeeCardIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const SettingsCardIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

// ── Icons for Stat Badges ──
const StatEmpIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4F8FEF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const StatStoreIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34A853" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const StatScheduleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9C27B0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="3" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const StatSalaryIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F57C00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="12" y2="14" />
  </svg>
)

export default function DashboardPage({ onNavigate }: Props) {
  const { state: salaryState }     = useEmployees()
  const { state: scheduleState }   = useSchedule()
  const { state: masterEmpState }  = useMasterEmployees()
  const { stores: storeList }      = useStoreContext()

  const today = new Date()

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
    return {
      start: format(mon),
      end: format(sun),
      display: `${format(mon)} ～ ${format(sun)}`
    }
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

  return (
    <PageContainer maxWidth={1120}>
      {/* ── 1. Hero Section (Japanese Minimalism Style) ── */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '24px',
          bgcolor: '#FFFFFF',
          p: { xs: 2.5, sm: 3.5, md: 4 },
          mb: 3.5,
          boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
          border: '1px solid #F1F5F9',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          {/* Left Side: Natural Warm Greeting & Date */}
          <Grid item xs={12} md={7}>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={dateDisplay}
                  size="small"
                  sx={{
                    bgcolor: '#EBF3FE',
                    color: '#4F8FEF',
                    fontWeight: 700,
                    fontSize: '13px',
                    borderRadius: '12px',
                    px: 0.5,
                  }}
                />
              </Box>

              <Typography
                variant="h4"
                fontWeight={700}
                sx={{
                  color: '#1E293B',
                  fontSize: { xs: '24px', sm: '28px', md: '30px' },
                  letterSpacing: '-0.5px',
                  lineHeight: 1.3,
                }}
              >
                歡迎回來 ☁️
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: '#64748B',
                  fontSize: { xs: '15px', sm: '16px' },
                  fontWeight: 400,
                  lineHeight: 1.6,
                }}
              >
                今天也一起順利完成工作吧。
              </Typography>

              {/* Info Card: Currently Scheduled Week */}
              <Box
                sx={{
                  mt: 1.5,
                  p: { xs: 1.8, sm: 2 },
                  borderRadius: '20px',
                  bgcolor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  width: 'fit-content',
                  maxWidth: '100%',
                }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '14px',
                    bgcolor: '#EBF3FE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0,
                  }}
                >
                  📅
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                    目前排班週次
                  </Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: '#1E293B', fontSize: { xs: '14px', sm: '15px' } }}>
                    {currentWeekRange.display}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Grid>

          {/* Right Side: Low-Saturation Minimal Flat Illustration */}
          <Grid item xs={12} md={5}>
            <JapaneseDeskIllustration />
          </Grid>
        </Grid>
      </Card>

      {/* ── 2. Stat Cards Section (4 Cards below Hero) ── */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* Stat 1: 員工總數 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '24px',
              p: 2.5,
              boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
              transition: 'all 200ms ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
              },
            }}
          >
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  員工總數
                </Typography>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    bgcolor: '#EBF3FE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <StatEmpIcon />
                </Box>
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ fontSize: '28px' }}>
                {masterEmpState.employees.length}
              </Typography>
            </Stack>
          </Card>
        </Grid>

        {/* Stat 2: 門市總數 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '24px',
              p: 2.5,
              boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
              transition: 'all 200ms ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
              },
            }}
          >
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  門市總數
                </Typography>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    bgcolor: '#EBF7EE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <StatStoreIcon />
                </Box>
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ fontSize: '28px' }}>
                {storeList.length}
              </Typography>
            </Stack>
          </Card>
        </Grid>

        {/* Stat 3: 本週班表 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '24px',
              p: 2.5,
              boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
              transition: 'all 200ms ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
              },
            }}
          >
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  本週班表
                </Typography>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    bgcolor: '#F3EDF7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <StatScheduleIcon />
                </Box>
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ fontSize: '28px' }}>
                {scheduleState.schedules.length}
              </Typography>
            </Stack>
          </Card>
        </Grid>

        {/* Stat 4: 本月薪資單 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '24px',
              bgcolor: '#FFFFFF',
              p: 2.5,
              boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
              border: '1px solid #F1F5F9',
              transition: 'all 200ms ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
              },
            }}
          >
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  本月薪資單
                </Typography>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    bgcolor: '#FFF4E5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <StatSalaryIcon />
                </Box>
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ color: '#1E293B', fontSize: '28px' }}>
                {salaryState.employees.length}
              </Typography>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Lower Feature Navigation Cards (下方功能卡) ── */}
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: '#1E293B', fontSize: '18px' }}>
        快捷功能
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* Card 1: 薪資管理 */}
        <Grid item xs={12} sm={6}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '24px',
              bgcolor: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
              border: '1px solid #F1F5F9',
              transition: 'all 200ms ease',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
              },
            }}
          >
            <CardActionArea onClick={() => onNavigate('salary')} sx={{ p: { xs: 2.5, sm: 3 }, minHeight: 120 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '20px',
                    bgcolor: '#EBF3FE',
                    color: '#4F8FEF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <SalaryCardIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#1E293B', fontSize: '18px' }}>
                    薪資管理
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    薪資計算與 PDF 報表匯出
                  </Typography>
                </Box>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Card 2: 排班管理 */}
        <Grid item xs={12} sm={6}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '24px',
              bgcolor: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
              border: '1px solid #F1F5F9',
              transition: 'all 200ms ease',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
              },
            }}
          >
            <CardActionArea onClick={() => onNavigate('schedule')} sx={{ p: { xs: 2.5, sm: 3 }, minHeight: 120 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '20px',
                    bgcolor: '#F3EDF7',
                    color: '#9C27B0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ScheduleCardIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#1E293B', fontSize: '18px' }}>
                    排班管理
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    門市週班表規劃與 PDF 匯出
                  </Typography>
                </Box>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Card 3: 員工管理 */}
        <Grid item xs={12} sm={6}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '24px',
              bgcolor: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
              border: '1px solid #F1F5F9',
              transition: 'all 200ms ease',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
              },
            }}
          >
            <CardActionArea onClick={() => onNavigate('employee')} sx={{ p: { xs: 2.5, sm: 3 }, minHeight: 120 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '20px',
                    bgcolor: '#EBF7EE',
                    color: '#34A853',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <EmployeeCardIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#1E293B', fontSize: '18px' }}>
                    員工管理
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    門市與共用員工主資料維護
                  </Typography>
                </Box>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Card 4: 系統設定 */}
        <Grid item xs={12} sm={6}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '24px',
              bgcolor: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
              border: '1px solid #F1F5F9',
              transition: 'all 200ms ease',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
              },
            }}
          >
            <CardActionArea onClick={() => onNavigate('settings')} sx={{ p: { xs: 2.5, sm: 3 }, minHeight: 120 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '20px',
                    bgcolor: '#FFF4E5',
                    color: '#F57C00',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <SettingsCardIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#1E293B', fontSize: '18px' }}>
                    系統設定
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    公司名稱、統編與抬頭偏好
                  </Typography>
                </Box>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>

      {/* ── 4. Recent Activity (最近紀錄) ── */}
      <Grid container spacing={3}>
        {/* Recent Salary */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '24px',
              bgcolor: '#FFFFFF',
              p: 3,
              boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
              border: '1px solid #F1F5F9',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Typography variant="body1" sx={{ fontSize: '20px' }}>💰</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#1E293B', fontSize: '17px' }}>
                最近薪資紀錄
              </Typography>
            </Box>
            {recentSalaries.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                尚無薪資紀錄
              </Typography>
            ) : (
              <Stack spacing={1.5} divider={<Divider sx={{ borderColor: '#F1F5F9' }} />}>
                {recentSalaries.map(emp => (
                  <Box
                    key={emp.id}
                    onClick={() => onNavigate('salary')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      py: 0.8,
                      px: 1,
                      borderRadius: '14px',
                      transition: 'all 150ms ease',
                      '&:hover': { bgcolor: '#F8FAFC' },
                    }}
                  >
                    <Box>
                      <Typography variant="body1" fontWeight={700} sx={{ color: '#1E293B' }}>
                        {emp.name || '未命名'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {emp.month} {emp.store ? `· ${emp.store}` : ''}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#4F8FEF' }}>
                      $ {(emp.netSalary ?? 0).toLocaleString('zh-TW')}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Card>
        </Grid>

        {/* Recent Schedule */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '24px',
              bgcolor: '#FFFFFF',
              p: 3,
              boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
              border: '1px solid #F1F5F9',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Typography variant="body1" sx={{ fontSize: '20px' }}>📅</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#1E293B', fontSize: '17px' }}>
                最近排班週表
              </Typography>
            </Box>
            {recentSchedules.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                尚無週排班表
              </Typography>
            ) : (
              <Stack spacing={1.5} divider={<Divider sx={{ borderColor: '#F1F5F9' }} />}>
                {recentSchedules.map(sch => (
                  <Box
                    key={sch.id}
                    onClick={() => onNavigate('schedule')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      py: 0.8,
                      px: 1,
                      borderRadius: '14px',
                      transition: 'all 150ms ease',
                      '&:hover': { bgcolor: '#F8FAFC' },
                    }}
                  >
                    <Box>
                      <Typography variant="body1" fontWeight={700} sx={{ color: '#1E293B' }}>
                        {formatStoreTitle(sch)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {sch.weekStart} ～ {sch.weekEnd}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${sch.employees.length} 人`}
                      size="small"
                      sx={{
                        bgcolor: '#F3EDF7',
                        color: '#9C27B0',
                        fontWeight: 700,
                        borderRadius: '10px',
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  )
}
