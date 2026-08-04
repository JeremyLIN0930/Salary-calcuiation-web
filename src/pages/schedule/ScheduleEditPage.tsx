import React, { useState, useMemo } from 'react'
import {
  Box, Typography, Button, TextField, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Card, Chip, Grid,
} from '@mui/material'
import { useSchedule } from '../../context/ScheduleContext'
import { useSnackbar } from '../../context/SnackbarContext'
import { PDFService } from '../../services/pdfService'
import PDFPreviewModal from '../../components/common/PDFPreviewModal'
import { Schedule, ScheduleEmployee, formatStoreTitle } from '../../types/schedule'
import ScheduleTable from './ScheduleTable'
import PageContainer from '../../components/common/PageContainer'

const ArrowBackSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4 }}>
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
  </svg>
)
const SaveSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6 }}>
    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
  </svg>
)
const PdfSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6 }}>
    <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
  </svg>
)
const CopySvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6 }}>
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
  </svg>
)
const ClearSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6 }}>
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
)

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

interface Props {
  schedule: Schedule
  onBack: () => void
}

export default function ScheduleEditPage({ schedule: initialSchedule, onBack }: Props) {
  const { state, saveSchedule } = useSchedule()
  const { showSnackbar } = useSnackbar()

  // Context schedule source of truth
  const contextSchedule = useMemo(() => {
    return state.schedules.find(s => s.id === initialSchedule.id) || initialSchedule
  }, [state.schedules, initialSchedule])

  // Sanitize remark to prevent JSON object string from leaking into TextArea
  const sanitizeSchedule = (sch: Schedule): Schedule => {
    let cleanRemark = sch.remark || ''
    const trimmed = cleanRemark.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed)
        cleanRemark = typeof parsed.remark === 'string' ? parsed.remark : ''
      } catch {
        cleanRemark = ''
      }
    }
    return {
      ...sch,
      remark: cleanRemark,
    }
  }

  const [schedule, setSchedule]   = useState<Schedule>(() => sanitizeSchedule(initialSchedule))
  const [isDirty, setIsDirty]     = useState(false)
  const [isSaving, setIsSaving]   = useState(false)
  const [exporting, setExporting] = useState(false)

  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)

  // Keep local state in sync when contextSchedule is updated/reloaded (e.g. after refresh())
  React.useEffect(() => {
    if (!isDirty && contextSchedule) {
      setSchedule(sanitizeSchedule(contextSchedule))
    }
  }, [contextSchedule, isDirty])

  // Compute 7 dates (Mon-Sun)
  const weekDates = useMemo(() => {
    const dates: { date: string; label: string; isWeekend: boolean }[] = []
    const start = new Date(schedule.weekStart)
    for (let i = 0; i < 7; i++) {
      const current = new Date(start)
      current.setDate(start.getDate() + i)
      const dateStr = current.toISOString().slice(0, 10)
      const m = current.getMonth() + 1
      const d = current.getDate()
      const isWeekend = i === 5 || i === 6 // Sat or Sun
      dates.push({
        date: dateStr,
        label: `${m}/${d}（${WEEKDAYS[i]}）`,
        isWeekend,
      })
    }
    return dates
  }, [schedule.weekStart])

  // Update local memory state & mark dirty
  const handleLocalChange = (updatedEmployees?: ScheduleEmployee[], updatedRemark?: string) => {
    const updated: Schedule = {
      ...schedule,
      employees: updatedEmployees ?? schedule.employees,
      remark: updatedRemark ?? schedule.remark,
      updatedAt: new Date().toISOString(),
    }
    setSchedule(updated)
    setIsDirty(true)
  }

  // Explicit Save Schedule to Supabase
  const handleSaveSchedule = async (exitAfterSave = false) => {
    setIsSaving(true)
    try {
      const res = await saveSchedule(schedule)
      if (res.success) {
        setIsDirty(false)
        showSnackbar('✅ 排班已儲存', 'success')
        if (exitAfterSave) {
          onBack()
        }
        return true
      } else {
        showSnackbar('❌ 排班儲存失敗，請確認網路', 'error')
        return false
      }
    } catch (err) {
      console.error('[ScheduleEditPage] handleSaveSchedule error:', err)
      showSnackbar('❌ 排班儲存失敗，請確認網路', 'error')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // Back button handler with dirty check
  const handleBackClick = () => {
    if (isDirty) {
      setLeaveConfirmOpen(true)
    } else {
      onBack()
    }
  }

  // Clear current week (Keep employee names, reset shifts)
  const handleClearWeek = () => {
    const clearedEmps = schedule.employees.map(emp => ({ ...emp, shifts: [] }))
    handleLocalChange(clearedEmps, undefined)
    setConfirmClearOpen(false)
    showSnackbar('已清空本週班別（請記得按下「💾 儲存排班」）', 'info')
  }

  // Copy previous week's schedule employees and shift pattern
  const handleCopyPrevWeek = () => {
    const otherSchedules = state.schedules.filter(s => s.id !== schedule.id && s.weekStart < schedule.weekStart)
    if (otherSchedules.length === 0) {
      showSnackbar('找不到更早的上一週班表可供複製', 'warning')
      return
    }

    const prev = [...otherSchedules].sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0]
    const prevStartDate = new Date(prev.weekStart)
    const currentStartDate = new Date(schedule.weekStart)

    const copiedEmployees: ScheduleEmployee[] = prev.employees.map(pEmp => {
      const newShifts = pEmp.shifts.map(pShift => {
        const pShiftDate = new Date(pShift.date)
        const dayDiff = Math.round((pShiftDate.getTime() - prevStartDate.getTime()) / (1000 * 3600 * 24))
        const targetDate = new Date(currentStartDate)
        targetDate.setDate(currentStartDate.getDate() + dayDiff)
        return {
          ...pShift,
          date: targetDate.toISOString().slice(0, 10),
        }
      })
      return {
        ...pEmp,
        shifts: newShifts,
      }
    })

    handleLocalChange(copiedEmployees, undefined)
    showSnackbar(`已複製「${prev.storeName || '門市'}（${prev.weekStart}）」班別`, 'success')
  }

  // PDF Export
  const handleExportPDF = async () => {
    setExporting(true)
    try {
      await PDFService.exportSchedule(schedule)
      showSnackbar('✅ PDF 匯出成功！', 'success')
    } catch (err) {
      console.error('PDF generation error:', err)
      showSnackbar('❌ PDF 匯出失敗，請稍後再試', 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <PageContainer maxWidth={1120}>
      {/* ── 1. Top Hero Card: Store Info & Status Badge (Muji Style) ── */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '24px',
          bgcolor: '#FFFFFF',
          p: { xs: 2.5, sm: 3 },
          mb: 3,
          boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
          border: '1px solid #F1F5F9',
        }}
      >
        {/* Top Header Bar: Back Button & Save Status Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Button
            onClick={handleBackClick}
            size="small"
            sx={{
              color: '#64748B',
              fontWeight: 700,
              fontSize: '14px',
              px: 1.5,
              py: 0.8,
              borderRadius: '12px',
              bgcolor: '#F8FAFC',
              '&:hover': { bgcolor: '#F1F5F9', color: '#1E293B' },
            }}
          >
            <ArrowBackSvg />
            返回列表
          </Button>

          {/* Status Badge */}
          {isSaving ? (
            <Chip
              label="⏳ 儲存中..."
              size="small"
              sx={{ bgcolor: '#FEF3C7', color: '#D97706', fontWeight: 700, borderRadius: '10px' }}
            />
          ) : isDirty ? (
            <Chip
              label="🟠 未儲存變更"
              size="small"
              sx={{ bgcolor: '#FFEDD5', color: '#C2410C', fontWeight: 700, borderRadius: '10px' }}
            />
          ) : (
            <Chip
              label="🟢 已儲存"
              size="small"
              sx={{ bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 700, borderRadius: '10px' }}
            />
          )}
        </Box>

        {/* Store Title & Week Subtitle */}
        <Box sx={{ mb: 1 }}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              color: '#1E293B',
              fontSize: { xs: '22px', sm: '26px' },
              letterSpacing: '-0.3px',
              mb: 0.5,
            }}
          >
            {formatStoreTitle(schedule)}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ fontSize: '14px' }}>
            本週排班：{schedule.weekStart}（一） ～ {schedule.weekEnd}（日）
          </Typography>
        </Box>
      </Card>

      {/* ── 2. Action Buttons (2 Rows Layout for Mobile RWD) ── */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '24px',
          bgcolor: '#FFFFFF',
          p: 2.5,
          mb: 3,
          boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
          border: '1px solid #F1F5F9',
        }}
      >
        <Stack spacing={1.5}>
          {/* Row 1: Copy Prev Week & Clear Week */}
          <Grid container spacing={1.5}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleCopyPrevWeek}
                sx={{
                  borderRadius: '16px',
                  minHeight: 48,
                  borderColor: '#CBD5E1',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '14px',
                  bgcolor: '#F8FAFC',
                  '&:hover': { bgcolor: '#F1F5F9', borderColor: '#94A3B8' },
                }}
              >
                <CopySvg />
                複製上一週
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                onClick={() => setConfirmClearOpen(true)}
                sx={{
                  borderRadius: '16px',
                  minHeight: 48,
                  borderColor: '#FECDD3',
                  color: '#E11D48',
                  fontWeight: 700,
                  fontSize: '14px',
                  bgcolor: '#FFF1F2',
                  '&:hover': { bgcolor: '#FFE4E6', borderColor: '#FDA4AF' },
                }}
              >
                <ClearSvg />
                清空本週
              </Button>
            </Grid>
          </Grid>

          {/* Row 2: Save Schedule (Primary) & PDF Export (Secondary) */}
          <Grid container spacing={1.5}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="contained"
                disabled={isSaving}
                onClick={() => handleSaveSchedule(false)}
                sx={{
                  borderRadius: '16px',
                  minHeight: 48,
                  bgcolor: '#2F80ED',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '15px',
                  boxShadow: '0 4px 12px rgba(47,128,237,0.2)',
                  '&:hover': { bgcolor: '#1D6FD8', boxShadow: '0 6px 16px rgba(47,128,237,0.3)' },
                }}
              >
                {isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveSvg />}
                儲存排班
              </Button>
            </Grid>

            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                disabled={exporting}
                onClick={handleExportPDF}
                sx={{
                  borderRadius: '16px',
                  minHeight: 48,
                  borderColor: '#2F80ED',
                  color: '#2F80ED',
                  fontWeight: 700,
                  fontSize: '15px',
                  bgcolor: '#FFFFFF',
                  '&:hover': { bgcolor: '#EBF3FE' },
                }}
              >
                {exporting ? <CircularProgress size={20} color="inherit" /> : <PdfSvg />}
                PDF 匯出
              </Button>
            </Grid>
          </Grid>
        </Stack>
      </Card>

      {/* ── 3. Schedule Employee Info Card (👥 已排班) ── */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '24px',
          bgcolor: '#FFFFFF',
          p: 2.5,
          mb: 3,
          boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
          border: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '14px',
              bgcolor: '#EBF3FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            👥
          </Box>
          <Box>
            <Typography variant="body1" fontWeight={700} sx={{ color: '#1E293B', fontSize: '16px' }}>
              已排班 {schedule.employees.length} 位員工
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '13px' }}>
              💡 點擊右側表格班次即可新增或編輯
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* ── 4. Main Interactive Schedule Table ── */}
      <ScheduleTable
        weekDates={weekDates}
        employees={schedule.employees}
        onChangeEmployees={newEmps => handleLocalChange(newEmps, undefined)}
      />

      {/* ── 5. Schedule Remarks / Notes Card ── */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '24px',
          bgcolor: '#FFFFFF',
          p: 3,
          mb: 3,
          boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
          border: '1px solid #F1F5F9',
        }}
      >
        <Typography variant="body1" fontWeight={700} sx={{ color: '#1E293B', mb: 1 }}>
          週排班備註說明
        </Typography>
        <TextField
          multiline
          rows={3}
          value={schedule.remark || ''}
          placeholder="填寫本週注意事項，例如：國定假日代班、特殊人力調派說明…"
          fullWidth
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              bgcolor: '#F8FAFC',
            },
          }}
          onChange={e => handleLocalChange(undefined, e.target.value)}
        />
      </Card>

      {/* ── Confirm Clear Week Dialog ── */}
      <Dialog
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle fontWeight={700}>確定清空本週排班？</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            這將會清除本週所有員工的班別紀錄，員工名單仍會保留。清空後需按下「💾 儲存排班」才會寫入系統。
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setConfirmClearOpen(false)} sx={{ borderRadius: '12px' }}>
            取消
          </Button>
          <Button variant="contained" color="error" onClick={handleClearWeek} sx={{ borderRadius: '12px', px: 2.5 }}>
            確定清空
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Confirm Unsaved Leave Dialog ── */}
      <Dialog
        open={leaveConfirmOpen}
        onClose={() => setLeaveConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle fontWeight={700}>尚有未儲存的排班變更</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            您有未儲存的班別變更，若現在返回列表，尚未儲存的資訊將會遺失。
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              setLeaveConfirmOpen(false)
              onBack()
            }}
            sx={{ borderRadius: '12px' }}
          >
            不儲存並返回
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              setLeaveConfirmOpen(false)
              await handleSaveSchedule(true)
            }}
            sx={{ borderRadius: '12px', px: 2.5 }}
          >
            儲存後返回
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  )
}
