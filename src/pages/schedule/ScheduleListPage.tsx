import React, { useState, useMemo } from 'react'
import {
  Box, Typography, Button, Card, CardContent, Grid, Stack,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Tooltip, CircularProgress, Checkbox, TextField, InputAdornment,
  FormControl, InputLabel, Select, MenuItem, Alert,
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
const ArrowBackSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
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
  const [monthSearch, setMonthSearch]         = useState('')
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

  // Filtered month groups for Month List View
  const filteredMonthGroups = useMemo(() => {
    if (!monthSearch.trim()) return monthGroups
    const q = monthSearch.trim().toLowerCase()
    return monthGroups.filter(g =>
      g.displayTitle.toLowerCase().includes(q) ||
      g.monthKey.toLowerCase().includes(q)
    )
  }, [monthGroups, monthSearch])

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

    // Check if month already exists
    const exists = monthGroups.some(g => g.monthKey === formattedMonth)
    if (exists) {
      showSnackbar(`「${inputYear} 年 ${String(inputMonth).padStart(2, '0')} 月已存在。」`, 'warning')
      return
    }

    // Find closest previous month
    const previousMonths = monthGroups.filter(g => g.monthKey < formattedMonth)
    const closestPrevMonth = previousMonths.length > 0 ? previousMonths[0] : null

    setCreateMonthModalOpen(false)

    if (closestPrevMonth && closestPrevMonth.schedules.length > 0) {
      setTargetMonthToCreate(formattedMonth)
      setPrevMonthToCopyFrom(closestPrevMonth.monthKey)
      setCopyPrevConfirmOpen(true)
    } else {
      // Create empty month directly & navigate
      setActiveMonthKey(formattedMonth)
      showSnackbar(`已成功建立「${inputYear} 年 ${String(inputMonth).padStart(2, '0')} 月」！`, 'success')
    }
  }

  // Answer for Copy Prev Month Employees Dialog
  const handleConfirmCopyPrevMonth = (shouldCopy: boolean) => {
    if (!targetMonthToCreate) return

    if (shouldCopy && prevMonthToCopyFrom) {
      const prevGroup = monthGroups.find(g => g.monthKey === prevMonthToCopyFrom)
      if (prevGroup && prevGroup.schedules.length > 0) {
        // Collect all distinct employee names from previous month schedules or master database
        const employeeNameSet = new Set<string>()
        prevGroup.schedules.forEach(sched => {
          sched.employees.forEach(emp => {
            if (emp.name.trim()) employeeNameSet.add(emp.name.trim())
          })
        })

        const copiedEmpList: ScheduleEmployee[] = Array.from(employeeNameSet).map(name => ({
          id: Math.random().toString(36).slice(2),
          name,
          shifts: [], // Keep shift empty
        }))

        // Create Week 1 for target month with copied employees
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
        showSnackbar(`已建立 ${targetMonthToCreate} 第 1 週排班，並帶入 ${copiedEmpList.length} 位員工（班別保持空白）！`, 'success')
      }
    } else {
      showSnackbar(`已建立 ${targetMonthToCreate} 空白月份！`, 'success')
    }

    setActiveMonthKey(targetMonthToCreate)
    setCopyPrevConfirmOpen(false)
    setTargetMonthToCreate(null)
    setPrevMonthToCopyFrom(null)
  }

  // ── Handlers: PDF Export 4 Modes ──────────────────────────────────────────

  // ① Single week PDF: 排班表_YYYY年MM月_第X週_門市.pdf
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

  // ② Multi-selected weeks PDF: 排班表_YYYY年MM月_多週.pdf
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

  // ③ Entire Month PDF: 排班表_YYYY年MM月_門市.pdf
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
      showSnackbar(`已成功匯出「${monthGroup.displayTitle}」全體 ${monthGroup.schedules.length} 週排班表 PDF！`, 'success')
    } catch (err) {
      console.error(err)
      showSnackbar('PDF 匯出失敗，請再試一次', 'error')
    } finally {
      setExporting(false)
    }
  }

  // ④ All Months PDF: 排班表_全部月份.pdf
  const handleExportAllMonthsPDF = async () => {
    if (state.schedules.length === 0) {
      showSnackbar('系統尚無排班資料可供匯出。', 'warning')
      return
    }
    setExporting(true)
    try {
      const sorted = [...state.schedules].sort((a, b) => b.weekStart.localeCompare(a.weekStart))
      for (const sched of sorted) {
        await PDFService.exportSchedule(sched, 'all')
      }
      showSnackbar(`已成功匯出所有月份（共 ${sorted.length} 週）排班表 PDF！`, 'success')
    } catch (err) {
      console.error(err)
      showSnackbar('PDF 匯出失敗，請再試一次', 'error')
    } finally {
      setExporting(false)
    }
  }

  // ── Handlers: Delete Month & Week ─────────────────────────────────────────

  const handleConfirmDeleteMonth = () => {
    if (!deleteMonthKey) return
    const group = monthGroups.find(g => g.monthKey === deleteMonthKey)
    if (group) {
      group.schedules.forEach(sched => {
        dispatch({ type: 'DELETE_SCHEDULE', payload: sched.id })
      })
      showSnackbar(`已刪除「${group.displayTitle}」及其所有週排班。`, 'info')
    }
    setDeleteMonthKey(null)
    if (activeMonthKey === deleteMonthKey) {
      setActiveMonthKey(null)
    }
  }

  const handleConfirmDeleteSingleSchedule = () => {
    if (!deleteTargetSchedule) return
    dispatch({ type: 'DELETE_SCHEDULE', payload: deleteTargetSchedule.id })
    showSnackbar('該週排班表已成功刪除', 'info')
    setDeleteTargetSchedule(null)
  }

  // Handle new weekly schedule created via Dialog
  const handleCreateNewWeekSchedule = async (newSchedule: Schedule) => {
    const startDateStr = newSchedule.weekStart || ''
    const newYear = parseInt(startDateStr.slice(0, 4), 10) || new Date().getFullYear()
    const newMonth = parseInt(startDateStr.slice(5, 7), 10) || (new Date().getMonth() + 1)
    const dayOfMonth = parseInt(startDateStr.slice(8, 10), 10) || 1
    const targetWeekNo = newSchedule.weekNo || Math.min(Math.ceil(dayOfMonth / 7), 5) || 1

    // Helper: Resolve store to canonical Store ID
    const resolveStoreId = (s: Partial<Schedule>): string => {
      const match = storeList.find(st => 
        st.id === s.storeId || 
        (st.storeNo && (st.storeNo === s.storeNo || st.storeNo === s.storeId)) ||
        (st.code && (st.code === s.storeCode || st.code === s.storeId)) || 
        st.name === s.storeName
      )
      if (match) return match.id
      return s.storeId || s.storeName || ''
    }

    const targetStoreId = resolveStoreId(newSchedule)

    // 1. In-memory check against state.schedules (company_id AND store_id AND year AND month AND week_no)
    const matchedInMemory = state.schedules.find(s => {
      const sStart = s.weekStart || ''
      const sYear = parseInt(sStart.slice(0, 4), 10) || 0
      const sMonth = parseInt(sStart.slice(5, 7), 10) || 0
      const sDay = parseInt(sStart.slice(8, 10), 10) || 1
      const sWeekNo = s.weekNo || Math.min(Math.ceil(sDay / 7), 5) || 1
      const sStoreId = resolveStoreId(s)

      const storeMatch = sStoreId === targetStoreId
      const yearMatch  = sYear === newYear
      const monthMatch = sMonth === newMonth
      const weekMatch  = sWeekNo === targetWeekNo

      return storeMatch && yearMatch && monthMatch && weekMatch
    })

    if (matchedInMemory) {
      const matchedStoreTitle = formatStoreTitle(matchedInMemory)
      const matchedWeekStart = (matchedInMemory.weekStart || '').replace(/-/g, '/')
      const matchedWeekEnd = (matchedInMemory.weekEnd || '').replace(/-/g, '/')
      const matchedWeekNo = matchedInMemory.weekNo || targetWeekNo
      const matchedWeekTitle = `第${matchedWeekNo}週（${matchedWeekStart}～${matchedWeekEnd}）`

      setDuplicateInfo({ storeTitle: matchedStoreTitle, weekTitle: matchedWeekTitle })
      setDuplicateDialogOpen(true)
      setCreateWeekDialogOpen(false)
      return
    }

    // 2. Database check against Supabase
    const dbCheck = await supabaseScheduleRepository.checkScheduleWeekExists(
      targetStoreId || newSchedule.storeId || newSchedule.storeName,
      newSchedule.weekStart
    )

    if (dbCheck.exists) {
      const existing = dbCheck.existingSchedule
      const matchedStoreTitle = existing ? formatStoreTitle(existing) : formatStoreTitle(newSchedule)
      const matchedWeekStart = (existing?.weekStart || newSchedule.weekStart).replace(/-/g, '/')
      const matchedWeekEnd = (existing?.weekEnd || newSchedule.weekEnd).replace(/-/g, '/')
      const matchedWeekNo = existing?.weekNo || targetWeekNo
      const matchedWeekTitle = `第${matchedWeekNo}週（${matchedWeekStart}～${matchedWeekEnd}）`

      setDuplicateInfo({ storeTitle: matchedStoreTitle, weekTitle: matchedWeekTitle })
      setDuplicateDialogOpen(true)
      setCreateWeekDialogOpen(false)
      return
    }

    // 3. Creation succeeds: Save to Supabase and navigate
    dispatch({ type: 'ADD_SCHEDULE', payload: newSchedule })
    showSnackbar('班表建立成功', 'success')
    setCreateWeekDialogOpen(false)
    onSelectSchedule(newSchedule)
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
      <PageContainer maxWidth={1200}>
        <PageHeader
          title="📅 排班管理"
          subtitle="依月份分類管理週班表、預覽編輯與 PDF 匯出"
          action={
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                onClick={handleExportAllMonthsPDF}
                disabled={exporting || state.schedules.length === 0}
                sx={{ borderRadius: 2.5, fontWeight: 700, height: 52 }}
              >
                {exporting ? <CircularProgress size={18} sx={{ mr: 1 }} /> : <PdfSvg />}
                匯出全部月份 PDF
              </Button>

              <Button
                variant="contained"
                onClick={handleOpenCreateMonthModal}
                sx={{ borderRadius: 2.5, fontWeight: 700, height: 52, px: 3 }}
              >
                <AddSvg />
                ＋ 建立月份
              </Button>
            </Stack>
          }
        />

        {/* Month Search Bar */}
        <Card variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: '#FAFBFD' }}>
          <TextField
            placeholder="🔍 搜尋排班月份 (如 2026-08)..."
            value={monthSearch}
            size="small"
            onChange={e => setMonthSearch(e.target.value)}
            sx={{ width: { xs: '100%', sm: 360 }, bgcolor: '#fff', borderRadius: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchSvg />
                </InputAdornment>
              ),
            }}
          />
        </Card>

        {filteredMonthGroups.length === 0 ? (
          <EmptyState
            title="尚無排班月份資料"
            subtitle={monthSearch ? `找不到符合「${monthSearch}」的月份` : '點擊右上角「＋ 建立月份」開始管理月度排班。'}
            actionLabel="＋ 建立第一個月份"
            onAction={handleOpenCreateMonthModal}
          />
        ) : (
          <Grid container spacing={2.5}>
            {filteredMonthGroups.map(group => (
              <Grid item xs={12} key={group.monthKey}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 4,
                    transition: 'all 0.2s ease',
                    '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.06)', borderColor: 'primary.main' },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
                      {/* Left Month Info */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 64, height: 64, borderRadius: 3,
                            bgcolor: 'primary.light', color: 'primary.main',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 32, flexShrink: 0,
                          }}
                        >
                          📂
                        </Box>
                        <Box>
                          <Typography variant="h6" fontWeight={800} color="text.primary">
                            {group.displayTitle}
                          </Typography>
                          <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                            <Chip label={`共 ${group.weekCount} 週班表`} size="small" color="primary" sx={{ fontWeight: 700 }} />
                            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                              最後修改：{group.lastUpdatedDate}
                            </Typography>
                          </Stack>
                        </Box>
                      </Box>

                      {/* Right Action Buttons */}
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" flexWrap="wrap">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(e) => handleExportMonthPDF(group, e)}
                          disabled={exporting}
                          sx={{ borderRadius: 2, height: 44, fontWeight: 700 }}
                        >
                          <PdfSvg />
                          匯出整月 PDF
                        </Button>

                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => {
                            setActiveMonthKey(group.monthKey)
                            setWeekSearch('')
                            setSelectedWeekIds([])
                          }}
                          sx={{ borderRadius: 2, height: 44, fontWeight: 700, px: 2.5 }}
                        >
                          進入月份 →
                        </Button>

                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteMonthKey(group.monthKey)}
                          sx={{ ml: 0.5 }}
                        >
                          <DelSvg />
                        </IconButton>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* ── Modal: 建立月份 ── */}
        <Dialog open={createMonthModalOpen} onClose={() => setCreateMonthModalOpen(false)} PaperProps={{ sx: { borderRadius: 4, minWidth: 320 } }}>
          <DialogTitle fontWeight={800}>＋ 建立排班月份</DialogTitle>
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
            <Button variant="outlined" onClick={() => setCreateMonthModalOpen(false)} sx={{ borderRadius: 2 }}>
              取消
            </Button>
            <Button variant="contained" onClick={handleProcessCreateMonth} sx={{ borderRadius: 2, fontWeight: 700 }}>
              確定建立
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Dialog: 複製上個月員工確認 ── */}
        <Dialog open={copyPrevConfirmOpen} onClose={() => handleConfirmCopyPrevMonth(false)} PaperProps={{ sx: { borderRadius: 4, minWidth: 340 } }}>
          <DialogTitle fontWeight={800}>是否複製上個月員工名單？</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ borderRadius: 3, mb: 2 }}>
              偵測到前一月份（{prevMonthToCopyFrom}）有排班員工記錄。
            </Alert>
            <Typography variant="body2" color="text.secondary">
              是否自動將「{prevMonthToCopyFrom}」的所有排班員工姓名帶入「{targetMonthToCreate}」第 1 週？
              <br /><br />
              <strong>說明：</strong>每日班別將保持空白，以便您快速進行新月度排班。
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button variant="outlined" onClick={() => handleConfirmCopyPrevMonth(false)} sx={{ borderRadius: 2 }}>
              否 (建立空白月份)
            </Button>
            <Button variant="contained" color="primary" onClick={() => handleConfirmCopyPrevMonth(true)} sx={{ borderRadius: 2, fontWeight: 700 }}>
              是 (複製員工名單)
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Dialog: 刪除整個月份確認 ── */}
        <ConfirmDialog
          open={!!deleteMonthKey}
          title="確定刪除此排班月份？"
          content={`刪除後將連同此月份所有週排班記錄一併刪除，此操作無法復原。確定要繼續嗎？`}
          confirmText="確定刪除月份"
          confirmColor="error"
          onClose={() => setDeleteMonthKey(null)}
          onConfirm={handleConfirmDeleteMonth}
        />
      </PageContainer>
    )
  }

  // ── RENDER: Week List View (月份內：週班表列表) ────────────────────────────

  const isAllInMonthSelected = filteredSchedulesInMonth.length > 0 &&
    filteredSchedulesInMonth.every(s => selectedWeekIds.includes(s.id))

  return (
    <PageContainer maxWidth={1200}>
      {/* Top Breadcrumb */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setActiveMonthKey(null)}
          sx={{ borderRadius: 2, mb: 1.5, fontWeight: 700 }}
        >
          <ArrowBackSvg />
          回月份列表
        </Button>
      </Box>

      <PageHeader
        title={`📂 ${activeMonthGroup ? activeMonthGroup.displayTitle : activeMonthKey} — 週班表列表`}
        subtitle={`共 ${filteredSchedulesInMonth.length} 週排班表`}
        action={
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            {selectedWeekIds.length > 0 && (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleExportSelectedWeeksPDF}
                disabled={exporting}
                sx={{ borderRadius: 2.5, fontWeight: 700, height: 48 }}
              >
                <PdfSvg />
                匯出已選 ({selectedWeekIds.length}) 週 PDF
              </Button>
            )}

            <Button
              variant="outlined"
              onClick={() => activeMonthGroup && handleExportMonthPDF(activeMonthGroup)}
              disabled={exporting || filteredSchedulesInMonth.length === 0}
              sx={{ borderRadius: 2.5, fontWeight: 700, height: 48 }}
            >
              <PdfSvg />
              匯出整月 PDF
            </Button>

            <Button
              variant="contained"
              onClick={() => setCreateWeekDialogOpen(true)}
              sx={{ borderRadius: 2.5, fontWeight: 700, height: 48, px: 2.5 }}
            >
              <AddSvg />
              ＋ 建立本週排班
            </Button>
          </Stack>
        }
      />

      {/* Week Search & Selection Toolbar */}
      <Card variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: '#FAFBFD' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <TextField
            placeholder="🔍 搜尋週次、日期 (如 8/3)..."
            value={weekSearch}
            size="small"
            onChange={e => setWeekSearch(e.target.value)}
            sx={{ width: { xs: '100%', sm: 320 }, bgcolor: '#fff', borderRadius: 2 }}
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
              全選本頁週次 ({selectedWeekIds.length}/{filteredSchedulesInMonth.length})
            </Typography>
          </Stack>
        </Stack>
      </Card>

      {/* Weekly Schedule Cards Grid */}
      {filteredSchedulesInMonth.length === 0 ? (
        <EmptyState
          title="尚無此月份之週排班表"
          subtitle={weekSearch ? `找不到符合「${weekSearch}」的週排班` : '請點擊上方「＋ 建立本週排班」建立本月排班表'}
          actionLabel="＋ 建立本週排班"
          onAction={() => setCreateWeekDialogOpen(true)}
        />
      ) : (
        <Grid container spacing={2.5}>
          {filteredSchedulesInMonth.map((sched) => {
            const isSelected = selectedWeekIds.includes(sched.id)
            const weekNo = sched.weekNo || Math.min(Math.ceil(parseInt((sched.weekStart || '').slice(8, 10), 10) / 7), 5) || 1
            return (
              <Grid item xs={12} key={sched.id}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 4,
                    borderColor: isSelected ? 'primary.main' : '#E5E7EB',
                    bgcolor: isSelected ? '#F0F7FF' : '#ffffff',
                    transition: 'all 0.15s ease',
                    '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
                      {/* Left Info */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleToggleSelectWeek(sched.id)}
                        />
                        <Box>
                          <Typography variant="h6" fontWeight={800} color="text.primary">
                            第 {weekNo} 週 ({sched.weekStart} ～ {sched.weekEnd})
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                            <Chip label={formatStoreTitle(sched)} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                            <Chip label={`${sched.employees.length} 位員工`} size="small" color="primary" variant="filled" sx={{ fontWeight: 700 }} />
                          </Stack>
                        </Box>
                      </Box>

                      {/* Right Actions */}
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(e) => handleExportSingleWeekPDF(sched, weekNo, e)}
                          disabled={exporting}
                          sx={{ borderRadius: 2, height: 44, fontWeight: 700 }}
                        >
                          <PdfSvg />
                          預覽 / PDF
                        </Button>

                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => onSelectSchedule(sched)}
                          sx={{ borderRadius: 2, height: 44, fontWeight: 700, px: 2.5 }}
                        >
                          <EditSvg />
                          編輯班表
                        </Button>

                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTargetSchedule(sched)}
                        >
                          <DelSvg />
                        </IconButton>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      {/* Dialog: Create Weekly Schedule */}
      <CreateScheduleDialog
        open={createWeekDialogOpen}
        onClose={() => setCreateWeekDialogOpen(false)}
        onCreate={handleCreateNewWeekSchedule}
      />

      {/* Dialog: Confirm Delete Single Weekly Schedule */}
      <ConfirmDialog
        open={!!deleteTargetSchedule}
        title="確定刪除此週排班表？"
        content={`您即將刪除「${deleteTargetSchedule?.weekStart} ～ ${deleteTargetSchedule?.weekEnd}」的排班表。此操作無法復原，確定繼續？`}
        confirmText="確定刪除"
        confirmColor="error"
        onClose={() => setDeleteTargetSchedule(null)}
        onConfirm={handleConfirmDeleteSingleSchedule}
      />

      {/* Dialog: Schedule Already Exists Notice */}
      <Dialog open={duplicateDialogOpen} onClose={() => setDuplicateDialogOpen(false)} PaperProps={{ sx: { borderRadius: 4, p: 1, minWidth: 320, maxWidth: 420 } }}>
        <DialogTitle fontWeight={800} color="error.main">
          ⚠️ 班表已存在
        </DialogTitle>
        <DialogContent>
          <Box sx={{ bgcolor: '#FFF5F5', p: 2, borderRadius: 3, border: '1px solid #FECDD3', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={800} color="text.primary">
              {duplicateInfo?.storeTitle}
            </Typography>
            <Typography variant="body2" fontWeight={700} color="text.secondary" sx={{ mt: 0.5 }}>
              {duplicateInfo?.weekTitle}
            </Typography>
          </Box>
          <Typography variant="body1" fontWeight={600} color="text.primary" sx={{ lineHeight: 1.6 }}>
            班表已建立，
            <br />
            請至排班列表點擊「編輯班表」。
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setDuplicateDialogOpen(false)}
            sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
          >
            我知道了
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  )
}
