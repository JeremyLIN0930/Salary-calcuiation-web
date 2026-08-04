import React, { useState, useMemo } from 'react'
import {
  Box, Typography, Button, Card, CardContent, Grid, Stack,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Tooltip, CircularProgress, Checkbox, TextField, InputAdornment,
  FormControl, InputLabel, Select, MenuItem, Alert, Skeleton,
} from '@mui/material'
import { useSchedule } from '../../context/ScheduleContext'
import { useSnackbar } from '../../context/SnackbarContext'
import { Schedule, ScheduleEmployee, formatStoreTitle } from '../../types/schedule'
import { supabaseScheduleRepository } from '../../repositories/SupabaseScheduleRepository'
import CreateScheduleDialog from './CreateScheduleDialog'
import PageHeader from '../../components/common/PageHeader'
import PageContainer from '../../components/common/PageContainer'
import EmptyState from '../../components/common/EmptyState'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import DeleteConfirmBottomSheet from '../../components/common/DeleteConfirmBottomSheet'
import { groupSchedulesByMonth, ScheduleMonthGroup, getMonthKeyFromSchedule } from '../../utils/scheduleMigration'
import { useMasterEmployees } from '../../context/MasterEmployeeContext'
import { useStoreContext } from '../../context/StoreContext'
import { PDFService } from '../../services/pdfService'

const AddSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6 }}>
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
)
const EditSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
)
const DelSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
)
const SearchSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
)
const PdfSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6 }}>
    <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5z"/>
  </svg>
)

interface Props {
  onSelectSchedule: (schedule: Schedule) => void
}

export default function ScheduleListPage({ onSelectSchedule }: Props) {
  const { state, dispatch } = useSchedule()
  const { state: masterState } = useMasterEmployees()
  const { stores: storeList } = useStoreContext()
  const { showSnackbar } = useSnackbar()

  // Navigation View State: 'MONTH_LIST' | 'WEEK_LIST'
  const [activeMonthKey, setActiveMonthKey] = useState<string | null>(null)

  // Local Search & Selection State
  const [weekSearch, setWeekSearch]           = useState('')
  const [selectedWeekIds, setSelectedWeekIds] = useState<string[]>([])
  const [exporting, setExporting]             = useState(false)

  // Dialog States
  const [createWeekDialogOpen, setCreateWeekDialogOpen] = useState(false)
  const [deleteTargetSchedule, setDeleteTargetSchedule] = useState<Schedule | null>(null)
  const [deleteMonthKey, setDeleteMonthKey]             = useState<string | null>(null)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [duplicateInfo, setDuplicateInfo]             = useState<{ storeTitle: string; weekTitle: string } | null>(null)

  // Create Month Modal State
  const [createMonthModalOpen, setCreateMonthModalOpen] = useState(false)
  const currentYear = new Date().getFullYear()
  const currentMonthNum = new Date().getMonth() + 1
  const [inputYear, setInputYear]                       = useState<number>(currentYear)
  const [inputMonth, setInputMonth]                     = useState<number>(currentMonthNum)
  const [copyPrevConfirmOpen, setCopyPrevConfirmOpen]   = useState(false)
  const [targetMonthToCreate, setTargetMonthToCreate]   = useState<string | null>(null)
  const [prevMonthToCopyFrom, setPrevMonthToCopyFrom]   = useState<string | null>(null)

  // Group schedules by month (Migration included)
  const monthGroups = useMemo(() => {
    return groupSchedulesByMonth(state.schedules)
  }, [state.schedules])

  // Extract available years dynamically from dataset
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>()
    monthGroups.forEach(g => {
      const y = parseInt(g.monthKey.split('-')[0], 10)
      if (!isNaN(y)) yearsSet.add(y)
    })
    if (yearsSet.size === 0) {
      yearsSet.add(currentYear)
    }
    return Array.from(yearsSet).sort((a, b) => b - a)
  }, [monthGroups, currentYear])

  // Local Dual Select State: Year & Month
  const [selectedYear, setSelectedYear]   = useState<number>(() => availableYears[0] || currentYear)
  const [selectedMonth, setSelectedMonth] = useState<string>('all') // 'all' | '01' ~ '12'

  // Filtered month groups for Month List View
  const filteredMonthGroups = useMemo(() => {
    const yearStr = String(selectedYear)
    return monthGroups.filter(g => {
      const [gYear, gMonth] = g.monthKey.split('-')
      const matchYear = gYear === yearStr
      const matchMonth = selectedMonth === 'all' || gMonth === selectedMonth
      return matchYear && matchMonth
    })
  }, [monthGroups, selectedYear, selectedMonth])

  // Active month group when in Week List View
  const activeMonthGroup = useMemo(() => {
    if (!activeMonthKey) return null
    return monthGroups.find(g => g.monthKey === activeMonthKey) || null
  }, [monthGroups, activeMonthKey])

  // Filtered weekly schedules inside active month
  const filteredSchedulesInMonth = useMemo(() => {
    if (!activeMonthGroup) return []
    if (!weekSearch.trim()) return activeMonthGroup.schedules
    const q = weekSearch.trim().toLowerCase()
    return activeMonthGroup.schedules.filter(s =>
      s.weekStart.includes(q) ||
      s.weekEnd.includes(q) ||
      s.storeName.toLowerCase().includes(q)
    )
  }, [activeMonthGroup, weekSearch])

  // ── Handlers: Create Month & Copy Previous Month ─────────────────────────

  const handleOpenCreateMonthModal = () => {
    setInputYear(new Date().getFullYear())
    setInputMonth(new Date().getMonth() + 1)
    setCreateMonthModalOpen(true)
  }

  const handleProcessCreateMonth = () => {
    const formattedMonth = `${inputYear}-${String(inputMonth).padStart(2, '0')}`

    const exists = monthGroups.some(g => g.monthKey === formattedMonth)
    if (exists) {
      showSnackbar(`「${inputYear} 年 ${String(inputMonth).padStart(2, '0')} 月已存在。」`, 'warning')
      return
    }

    const previousMonths = monthGroups.filter(g => g.monthKey < formattedMonth)
    const closestPrevMonth = previousMonths.length > 0 ? previousMonths[0] : null

    setCreateMonthModalOpen(false)

    if (closestPrevMonth && closestPrevMonth.schedules.length > 0) {
      setTargetMonthToCreate(formattedMonth)
      setPrevMonthToCopyFrom(closestPrevMonth.monthKey)
      setCopyPrevConfirmOpen(true)
    } else {
      setActiveMonthKey(formattedMonth)
      showSnackbar(`已成功建立「${inputYear} 年 ${String(inputMonth).padStart(2, '0')} 月」！`, 'success')
    }
  }

  const handleConfirmCopyPrevMonth = (shouldCopy: boolean) => {
    if (!targetMonthToCreate) return

    if (shouldCopy && prevMonthToCopyFrom) {
      const prevGroup = monthGroups.find(g => g.monthKey === prevMonthToCopyFrom)
      if (prevGroup && prevGroup.schedules.length > 0) {
        const employeeNameSet = new Set<string>()
        prevGroup.schedules.forEach(sched => {
          sched.employees.forEach(emp => {
            if (emp.name.trim()) employeeNameSet.add(emp.name.trim())
          })
        })

        const copiedEmpList: ScheduleEmployee[] = Array.from(employeeNameSet).map(name => ({
          id: Math.random().toString(36).slice(2),
          name,
          shifts: [],
        }))

        const weekStart = `${targetMonthToCreate}-01`
        const weekEnd = `${targetMonthToCreate}-07`
        const newSched: Schedule = {
          id: Math.random().toString(36).slice(2),
          storeId: '001',
          storeName: '預設門市',
          weekStart,
          weekEnd,
          employees: copiedEmpList,
          remark: `從 ${prevMonthToCopyFrom} 複製員工名單`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        dispatch({ type: 'ADD_SCHEDULE', payload: newSched })
        showSnackbar(`已建立 ${targetMonthToCreate} 第 1 週排班，並帶入 ${copiedEmpList.length} 位員工！`, 'success')
      }
    } else {
      showSnackbar(`已建立 ${targetMonthToCreate} 空白月份！`, 'success')
    }

    setActiveMonthKey(targetMonthToCreate)
    setCopyPrevConfirmOpen(false)
    setTargetMonthToCreate(null)
    setPrevMonthToCopyFrom(null)
  }

  // ── Handlers: PDF Export ──────────────────────────────────────────────────

  const handleExportSingleWeekPDF = async (schedule: Schedule, weekIndex: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setExporting(true)
    try {
      await PDFService.exportSchedule(schedule, 'single', weekIndex)
      showSnackbar('該週排班表 PDF 已成功匯出下載！', 'success')
    } catch (err) {
      console.error(err)
      showSnackbar('PDF 匯出失敗，請再試一次', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleExportSelectedWeeksPDF = async () => {
    if (selectedWeekIds.length === 0) return
    const selectedScheds = state.schedules.filter(s => selectedWeekIds.includes(s.id))
    setExporting(true)
    try {
      for (const sched of selectedScheds) {
        await PDFService.exportSchedule(sched, 'multi')
      }
      showSnackbar(`已成功匯出勾選的 ${selectedScheds.length} 週排班表 PDF！`, 'success')
    } catch (err) {
      console.error(err)
      showSnackbar('PDF 匯出失敗，請再試一次', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleExportMonthPDF = async (monthGroup: ScheduleMonthGroup, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (monthGroup.schedules.length === 0) {
      showSnackbar('該月份尚無週排班資料，無法匯出 PDF。', 'warning')
      return
    }
    setExporting(true)
    try {
      for (const sched of monthGroup.schedules) {
        await PDFService.exportSchedule(sched, 'month')
      }
      showSnackbar(`已成功匯出「${monthGroup.displayTitle}」整月排班 PDF！`, 'success')
    } catch (err) {
      console.error(err)
      showSnackbar('PDF 匯出失敗，請再試一次', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleExportAllMonthsPDF = async () => {
    setExporting(true)
    try {
      const sorted = [...state.schedules].sort((a, b) => b.weekStart.localeCompare(a.weekStart))
      for (const sched of sorted) {
        await PDFService.exportSchedule(sched, 'all')
      }
      showSnackbar(`已成功匯出全部 ${sorted.length} 週排班表 PDF！`, 'success')
    } catch (err) {
      console.error(err)
      showSnackbar('PDF 匯出失敗，請再試一次', 'error')
    } finally {
      setExporting(false)
    }
  }

  // ── Handlers: Delete Month & Single Week Schedule ─────────────────────────

  const handleConfirmDeleteMonth = async () => {
    if (!deleteMonthKey) return
    const group = monthGroups.find(g => g.monthKey === deleteMonthKey)
    if (group) {
      for (const sched of group.schedules) {
        await supabaseScheduleRepository.deleteSchedule(sched.id)
        dispatch({ type: 'DELETE_SCHEDULE', payload: sched.id })
      }
      showSnackbar(`已刪除「${group.displayTitle}」及其所有每週班表。`, 'info')
    }
    setDeleteMonthKey(null)
    if (activeMonthKey === deleteMonthKey) {
      setActiveMonthKey(null)
    }
  }

  const handleConfirmDeleteSingleSchedule = async () => {
    if (!deleteTargetSchedule) return
    const ok = await supabaseScheduleRepository.deleteSchedule(deleteTargetSchedule.id)
    if (ok) {
      dispatch({ type: 'DELETE_SCHEDULE', payload: deleteTargetSchedule.id })
      showSnackbar(`已刪除「${deleteTargetSchedule.storeName} (${deleteTargetSchedule.weekStart})」排班資料`, 'info')
    } else {
      showSnackbar('刪除失敗，請確認網路或 Supabase 連線', 'error')
    }
    setDeleteTargetSchedule(null)
  }

  // Multi-select Checkbox helpers
  const handleToggleSelectWeek = (id: string) => {
    setSelectedWeekIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleToggleSelectAllInMonth = () => {
    if (!activeMonthGroup) return
    const currentAllIds = activeMonthGroup.schedules.map(s => s.id)
    const isAllSelected = currentAllIds.every(id => selectedWeekIds.includes(id))

    if (isAllSelected) {
      setSelectedWeekIds(prev => prev.filter(id => !currentAllIds.includes(id)))
    } else {
      setSelectedWeekIds(prev => Array.from(new Set([...prev, ...currentAllIds])))
    }
  }

  // ── RENDER: Month List View (排班首頁：月份列表) ───────────────────────────

  if (!activeMonthKey) {
    return (
      <PageContainer maxWidth={1120}>
        <PageHeader
          title="📅 排班管理"
          subtitle="依月份分類管理每週班表、輕鬆建立、編輯與 PDF 匯出"
          action={
            <Stack direction={{ xs: 'column', sm: 'row-reverse' }} spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <Button
                variant="contained"
                onClick={handleOpenCreateMonthModal}
                sx={{ borderRadius: '16px', fontWeight: 700, minHeight: 52, px: 3, bgcolor: '#2F80ED', '&:hover': { bgcolor: '#1D6FD8' } }}
              >
                <AddSvg />
                建立月份
              </Button>

              <Button
                variant="outlined"
                onClick={handleExportAllMonthsPDF}
                disabled={exporting || state.schedules.length === 0}
                sx={{ borderRadius: '16px', fontWeight: 700, minHeight: 48, borderColor: '#2F80ED', color: '#2F80ED', px: 2.5 }}
              >
                {exporting ? <CircularProgress size={18} sx={{ mr: 1 }} /> : <PdfSvg />}
                匯出全部月份 PDF
              </Button>
            </Stack>
          }
        />

        {/* Year + Month Dual Dropdown Filter Bar */}
        <Card
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 2.5,
            borderRadius: '24px',
            bgcolor: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            border: '1px solid #F1F5F9',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              {/* Year Select Dropdown */}
              <FormControl size="small" sx={{ width: { xs: '100%', sm: 160 } }}>
                <InputLabel>年份</InputLabel>
                <Select
                  value={selectedYear}
                  label="年份"
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  sx={{
                    borderRadius: '16px',
                    height: 48,
                    bgcolor: '#F8FAFC',
                    fontWeight: 700,
                  }}
                >
                  {availableYears.map(y => (
                    <MenuItem key={y} value={y}>{y} 年</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Month Select Dropdown */}
              <FormControl size="small" sx={{ width: { xs: '100%', sm: 160 } }}>
                <InputLabel>月份</InputLabel>
                <Select
                  value={selectedMonth}
                  label="月份"
                  onChange={e => setSelectedMonth(e.target.value as string)}
                  sx={{
                    borderRadius: '16px',
                    height: 48,
                    bgcolor: '#F8FAFC',
                    fontWeight: 700,
                  }}
                >
                  <MenuItem value="all">全部月份</MenuItem>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                    <MenuItem key={m} value={m}>{m} 月</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </Card>

        {state.loading ? (
          <Grid container spacing={2.5}>
            {[1, 2, 3, 4].map(i => (
              <Grid item xs={12} sm={6} key={i}>
                <Skeleton variant="rounded" height={160} sx={{ borderRadius: '24px' }} />
              </Grid>
            ))}
          </Grid>
        ) : filteredMonthGroups.length === 0 ? (
          <EmptyState
            title="目前沒有排班月份"
            subtitle="建立第一個月份開始管理班表。"
            actionLabel="＋ 建立月份"
            onAction={handleOpenCreateMonthModal}
          />
        ) : (
          <Grid container spacing={2.5}>
            {filteredMonthGroups.map(group => (
              <Grid item xs={12} sm={6} lg={12} key={group.monthKey}>
                <Card
                  elevation={0}
                  className="animate-card-fade-up"
                  sx={{
                    borderRadius: '24px',
                    p: { xs: 2.25, sm: 2.5 },
                    transition: 'transform 200ms ease, box-shadow 200ms ease',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.10)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      '@media (min-width:768px) and (max-width:1024px)': {
                        gap: 2,
                      },
                      '@media (min-width:1025px)': {
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 2.5,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        width: '100%',
                        '@media (min-width:1025px)': {
                          flex: '1 1 0',
                          minWidth: 0,
                          width: 'auto',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 72,
                          height: 72,
                          borderRadius: '20px',
                          bgcolor: '#EBF3FE',
                          color: '#2F80ED',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 30,
                          flexShrink: 0,
                          '@media (min-width:1025px)': {
                            width: 80,
                            height: 80,
                          },
                        }}
                      >
                        📁
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          sx={{
                            color: '#1E293B',
                            fontSize: '20px',
                            lineHeight: 1.2,
                            whiteSpace: 'normal',
                            '@media (min-width:768px) and (max-width:1024px)': {
                              whiteSpace: 'nowrap',
                            },
                            '@media (min-width:1025px)': {
                              fontSize: '22px',
                              whiteSpace: 'nowrap',
                            },
                          }}
                        >
                          {group.displayTitle}
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.75, sm: 1.25 }} flexWrap="wrap" sx={{ mt: 1 }}>
                          <Chip
                            label={`${group.weekCount} 張班表`}
                            size="small"
                            sx={{ bgcolor: '#EBF3FE', color: '#2F80ED', fontWeight: 700, borderRadius: '999px' }}
                          />
                          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '13px' }}>
                            最後修改：{group.lastUpdatedDate}
                          </Typography>
                        </Stack>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        width: '100%',
                        '@media (min-width:1025px)': {
                          width: 'auto',
                          flex: '0 0 auto',
                        },
                      }}
                    >
                      <Stack
                        direction="column"
                        spacing={1}
                        sx={{
                          width: '100%',
                          '@media (min-width:1025px)': {
                            flexDirection: 'row',
                            width: 'auto',
                            alignItems: 'center',
                            gap: 1,
                          },
                        }}
                      >
                        <Button
                          variant="outlined"
                          onClick={(e) => handleExportMonthPDF(group, e)}
                          disabled={exporting}
                          sx={{
                            borderRadius: '16px',
                            height: 52,
                            fontWeight: 700,
                            borderColor: '#2F80ED',
                            color: '#2F80ED',
                            width: '100%',
                            whiteSpace: 'nowrap',
                            '@media (min-width:1025px)': {
                              width: 'auto',
                              minWidth: '156px',
                              px: 2.25,
                            },
                          }}
                        >
                          <PdfSvg />
                          匯出整月 PDF
                        </Button>

                        <Button
                          variant="contained"
                          onClick={() => {
                            setActiveMonthKey(group.monthKey)
                            setWeekSearch('')
                            setSelectedWeekIds([])
                          }}
                          sx={{
                            borderRadius: '16px',
                            height: 52,
                            fontWeight: 700,
                            px: 2.5,
                            bgcolor: '#2F80ED',
                            '&:hover': { bgcolor: '#1D6FD8' },
                            width: '100%',
                            whiteSpace: 'nowrap',
                            '@media (min-width:1025px)': {
                              width: 'auto',
                              minWidth: '132px',
                              px: 2.25,
                            },
                          }}
                        >
                          進入月份 →
                        </Button>
                      </Stack>
                      <Button
                        onClick={() => setDeleteMonthKey(group.monthKey)}
                        sx={{
                          mt: 1,
                          height: 48,
                          borderRadius: '16px',
                          bgcolor: '#FFF1F2',
                          color: '#E11D48',
                          fontWeight: 700,
                          width: '100%',
                          whiteSpace: 'nowrap',
                          '&:hover': { bgcolor: '#FFE4E6' },
                          '@media (min-width:1025px)': {
                            mt: 0,
                            width: '44px',
                            minWidth: '44px',
                            px: 0,
                            ml: 1,
                            borderRadius: '999px',
                          },
                        }}
                      >
                        {window.innerWidth >= 1025 ? '🗑' : '刪除此月份'}
                      </Button>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* ── Modal: 建立月份 ── */}
        <Dialog open={createMonthModalOpen} onClose={() => setCreateMonthModalOpen(false)} PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
          <DialogTitle fontWeight={700}>＋ 建立排班月份</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              請選擇欲建立的年份與月份：
            </Typography>
            <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>年份</InputLabel>
                <Select value={inputYear} label="年份" onChange={e => setInputYear(Number(e.target.value))}>
                  {Array.from({ length: 101 }, (_, i) => currentYear - 50 + i).map(y => (
                    <MenuItem key={y} value={y}>{y} 年</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>月份</InputLabel>
                <Select value={inputMonth} label="月份" onChange={e => setInputMonth(Number(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <MenuItem key={m} value={m}>{String(m).padStart(2, '0')} 月</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button variant="outlined" onClick={() => setCreateMonthModalOpen(false)} sx={{ borderRadius: '12px' }}>
              取消
            </Button>
            <Button variant="contained" onClick={handleProcessCreateMonth} sx={{ borderRadius: '12px', fontWeight: 700, bgcolor: '#2F80ED' }}>
              確定建立
            </Button>
          </DialogActions>
        </Dialog>
        {/* Delete Month Confirmation Bottom Sheet / Dialog */}
        <DeleteConfirmBottomSheet
          open={!!deleteMonthKey}
          title="確定刪除此排班月份？"
          monthLabel={deleteMonthKey ? deleteMonthKey.replace('-', ' 年 ') + ' 月' : ''}
          employeeCount={monthGroups.find(g => g.monthKey === deleteMonthKey)?.weekCount || 0}
          warningText="該月份包含之所有每週排班表與班表紀錄將永久刪除且無法復原。"
          onClose={() => setDeleteMonthKey(null)}
          onConfirm={handleConfirmDeleteMonth}
        />
      </PageContainer>
    )
  }

  // ── RENDER: Week List View (特定月份內每週排班列表) ────────────────────────

  const isAllInMonthSelected = filteredSchedulesInMonth.length > 0 &&
    filteredSchedulesInMonth.every(s => selectedWeekIds.includes(s.id))

  return (
    <PageContainer maxWidth={1120}>
      <Box sx={{ mb: 2 }}>
        <Button
          onClick={() => setActiveMonthKey(null)}
          size="small"
          sx={{
            color: '#64748B',
            fontWeight: 700,
            fontSize: '14px',
            px: 1.5,
            py: 0.8,
            borderRadius: '12px',
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            '&:hover': { bgcolor: '#F8FAFC', color: '#1E293B' },
          }}
        >
          ← 返回月份列表
        </Button>
      </Box>

      <PageHeader
        title={`📂 ${activeMonthGroup ? activeMonthGroup.displayTitle : activeMonthKey} — 每週排班表`}
        subtitle={`此月份共有 ${filteredSchedulesInMonth.length} 張週班表`}
        action={
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            {selectedWeekIds.length > 0 && (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleExportSelectedWeeksPDF}
                disabled={exporting}
                sx={{ borderRadius: '16px', fontWeight: 700, minHeight: 48 }}
              >
                <PdfSvg />
                匯出已選 ({selectedWeekIds.length}) PDF
              </Button>
            )}

            <Button
              variant="outlined"
              onClick={() => activeMonthGroup && handleExportMonthPDF(activeMonthGroup)}
              disabled={exporting || filteredSchedulesInMonth.length === 0}
              sx={{ borderRadius: '16px', fontWeight: 700, minHeight: 48, borderColor: '#2F80ED', color: '#2F80ED' }}
            >
              <PdfSvg />
              匯出整月 PDF
            </Button>

            <Button
              variant="contained"
              onClick={() => setCreateWeekDialogOpen(true)}
              sx={{ borderRadius: '16px', fontWeight: 700, minHeight: 48, px: 3, bgcolor: '#2F80ED', '&:hover': { bgcolor: '#1D6FD8' } }}
            >
              <AddSvg />
              建立每週排班
            </Button>
          </Stack>
        }
      />

      {/* Week Search Bar & Selection Toolbar */}
      <Card
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: '24px',
          bgcolor: '#FFFFFF',
          boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
          border: '1px solid #F1F5F9',
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <TextField
            placeholder="🔍 搜尋門市名稱或週次日期..."
            value={weekSearch}
            size="small"
            onChange={e => setWeekSearch(e.target.value)}
            sx={{
              width: { xs: '100%', sm: 360 },
              '& .MuiOutlinedInput-root': {
                borderRadius: '16px',
                height: 48,
                bgcolor: '#F8FAFC',
                px: 1.5,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchSvg />
                </InputAdornment>
              ),
            }}
          />

          <Stack direction="row" spacing={1} alignItems="center">
            <Checkbox
              checked={isAllInMonthSelected}
              indeterminate={selectedWeekIds.length > 0 && !isAllInMonthSelected}
              onChange={handleToggleSelectAllInMonth}
            />
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              全選本頁班表 ({selectedWeekIds.length}/{filteredSchedulesInMonth.length})
            </Typography>
          </Stack>
        </Stack>
      </Card>

      {/* Weekly Schedule Cards Grid */}
      {filteredSchedulesInMonth.length === 0 ? (
        <EmptyState
          title="尚無此月份之每週排班"
          subtitle={weekSearch ? `找不到符合「${weekSearch}」的班表` : '請點擊上方「＋ 建立每週排班」開始排班。'}
          actionLabel="＋ 建立每週排班"
          onAction={() => setCreateWeekDialogOpen(true)}
        />
      ) : (
        <Grid container spacing={3}>
          {filteredSchedulesInMonth.map((sched, index) => {
            const isSelected = selectedWeekIds.includes(sched.id)
            const weekNo = sched.weekNo || (index + 1)

            return (
              <Grid item xs={12} sm={6} key={sched.id}>
                <Card
                  elevation={0}
                  onClick={() => onSelectSchedule(sched)}
                  sx={{
                    borderRadius: '24px',
                    borderColor: isSelected ? '#2F80ED' : '#ECECEC',
                    borderWidth: '1.5px',
                    borderStyle: 'solid',
                    bgcolor: isSelected ? '#F0F7FF' : '#FFFFFF',
                    transition: 'all 200ms ease',
                    boxShadow: isSelected ? '0 8px 24px rgba(47, 128, 237, 0.12)' : '0 8px 24px rgba(0,0,0,0.04)',
                    p: { xs: 2.5, sm: 3 },
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Checkbox
                        checked={isSelected}
                        onClick={e => e.stopPropagation()}
                        onChange={() => handleToggleSelectWeek(sched.id)}
                        sx={{ p: 0.5 }}
                      />
                      <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ color: '#1E293B', fontSize: '20px' }}>
                          {formatStoreTitle(sched)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748B', fontSize: '14px', mt: 0.2 }}>
                          第 {weekNo} 週（{sched.weekStart.replace(/-/g, '/')} ～ {sched.weekEnd.replace(/-/g, '/')}）
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center" onClick={e => e.stopPropagation()}>
                      <Tooltip title="匯出此週 PDF">
                        <IconButton
                          onClick={(e) => handleExportSingleWeekPDF(sched, weekNo, e)}
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: '#EBF3FE',
                            color: '#2F80ED',
                            '&:hover': { bgcolor: '#DBEAFE' },
                          }}
                        >
                          <PdfSvg />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="刪除班表">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteTargetSchedule(sched)
                          }}
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: '#FFF1F2',
                            color: '#E11D48',
                            '&:hover': { bgcolor: '#FFE4E6' },
                          }}
                        >
                          <DelSvg />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1, borderTop: '1px solid #F1F5F9' }}>
                    <Chip
                      label={`👥 ${sched.employees.length} 位員工`}
                      size="small"
                      sx={{ bgcolor: '#F8FAFC', color: '#475569', fontWeight: 600, borderRadius: '8px' }}
                    />
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#2F80ED', fontSize: '14px' }}>
                      編輯班表 →
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      {/* Create Week Schedule Dialog Modal */}
      <CreateScheduleDialog
        open={createWeekDialogOpen}
        onClose={() => setCreateWeekDialogOpen(false)}
        onCreate={sched => {
          dispatch({ type: 'ADD_SCHEDULE', payload: sched })
          showSnackbar('週班表建立成功！', 'success')
          setCreateWeekDialogOpen(false)
          onSelectSchedule(sched)
        }}
      />

      {/* Confirm Delete Single Schedule Dialog */}
      <ConfirmDialog
        open={!!deleteTargetSchedule}
        title="確定刪除此週班表？"
        content={`您即將刪除「${deleteTargetSchedule ? formatStoreTitle(deleteTargetSchedule) : ''} (${deleteTargetSchedule?.weekStart})」的排班資料。確定繼續？`}
        confirmText="確定刪除"
        confirmColor="error"
        onClose={() => setDeleteTargetSchedule(null)}
        onConfirm={handleConfirmDeleteSingleSchedule}
      />
    </PageContainer>
  )
}
