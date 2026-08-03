import React, { useState, useMemo } from 'react'
import {
  Box, Typography, Button, TextField, Stack, Paper,
  Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Card,
} from '@mui/material'
import { useSchedule } from '../../context/ScheduleContext'
import { useSnackbar } from '../../context/SnackbarContext'
import { PDFService } from '../../services/pdfService'
import PDFPreviewModal from '../../components/common/PDFPreviewModal'
import { Schedule, ScheduleEmployee } from '../../types/schedule'
import ScheduleTable from './ScheduleTable'

const ArrowBackSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
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
  const { state, dispatch } = useSchedule()
  const [schedule, setSchedule] = useState<Schedule>(initialSchedule)
  const [toast, setToast]       = useState('')
  const [exporting, setExporting] = useState(false)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)

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

  // Save changes to state & storage
  const handleSaveAll = (updatedEmployees?: ScheduleEmployee[], updatedRemark?: string) => {
    const updated: Schedule = {
      ...schedule,
      employees: updatedEmployees ?? schedule.employees,
      remark: updatedRemark ?? schedule.remark,
      updatedAt: new Date().toISOString(),
    }
    setSchedule(updated)
    dispatch({ type: 'UPDATE_SCHEDULE', payload: updated })
  }

  // Clear current week (Keep employee names, reset shifts)
  const handleClearWeek = () => {
    const clearedEmps = schedule.employees.map(emp => ({ ...emp, shifts: [] }))
    handleSaveAll(clearedEmps)
    setConfirmClearOpen(false)
    setToast('已清空本週班別（保留員工列表）')
  }

  // Copy previous week's schedule employees and shift pattern
  const handleCopyPrevWeek = () => {
    // Find previous schedule by sorting weekStart
    const otherSchedules = state.schedules.filter(s => s.id !== schedule.id && s.weekStart < schedule.weekStart)
    if (otherSchedules.length === 0) {
      setToast('找不到更早的上一週班表可供複製')
      return
    }

    // Sort descending by weekStart to get closest previous week
    const prev = [...otherSchedules].sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0]

    // Map shifts from prev week onto current week dates
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
        id: Math.random().toString(36).slice(2),
        name: pEmp.name,
        shifts: newShifts,
      }
    })

    handleSaveAll(copiedEmployees)
    setToast(`已複製上一週（${prev.weekStart}）的員工與班表`)
  }

  const { showSnackbar } = useSnackbar()
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false)

  // Export PDF via Service
  const handleConfirmDownloadPDF = async () => {
    setExporting(true)
    try {
      await PDFService.exportSchedule(schedule)
      showSnackbar('排班表 PDF 已成功匯出下載！', 'success')
      setPdfPreviewOpen(false)
    } catch (err) {
      console.error(err)
      showSnackbar('PDF 匯出失敗，請再試一次', 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2, pt: 2, pb: 10 }}>
      {/* Top Header Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 3, border: '1px solid #E5E7EB' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={onBack}
              sx={{ borderRadius: 2, minWidth: 40, px: 1, color: 'text.primary', borderColor: '#D1D5DB' }}
            >
              <ArrowBackSvg />
            </Button>
            <Box>
              <Typography variant="h6" fontWeight={800} color="primary.main">
                【{schedule.storeId}】{schedule.storeName} — 週排班表
              </Typography>
              <Typography variant="body2" color="text.secondary">
                排班週次：{schedule.weekStart}（一） ～ {schedule.weekEnd}（日）
              </Typography>
            </Box>
          </Box>

          {/* Action buttons */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              variant="outlined"
              size="small"
              onClick={handleCopyPrevWeek}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              <CopySvg />
              複製上一週
            </Button>

            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => setConfirmClearOpen(true)}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              <ClearSvg />
              清空本週
            </Button>

            <Button
              variant="contained"
              size="small"
              disabled={exporting}
              onClick={() => setPdfPreviewOpen(true)}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              {exporting ? <CircularProgress size={16} sx={{ mr: 1, color: '#fff' }} /> : <PdfSvg />}
              預覽 / 匯出 PDF
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Main Weekly Table */}
      <ScheduleTable
        weekDates={weekDates}
        employees={schedule.employees}
        onChangeEmployees={emps => handleSaveAll(emps, undefined)}
      />

      {/* Bottom Remark Section */}
      <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          備註說明
        </Typography>
        <TextField
          placeholder="例如：新人教育訓練、中秋連假人力支援說明..."
          value={schedule.remark}
          multiline
          minRows={3}
          maxRows={6}
          fullWidth
          size="small"
          onChange={e => handleSaveAll(undefined, e.target.value)}
        />
      </Card>

      {/* Clear Confirmation Dialog */}
      <Dialog open={confirmClearOpen} onClose={() => setConfirmClearOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>確定清空本週班別？</DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            這將會清除「{schedule.weekStart}」此週所有員工的所有排班時間與假別，但會保留員工姓名列表。確定繼續？
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setConfirmClearOpen(false)} sx={{ borderRadius: 2 }}>
            取消
          </Button>
          <Button variant="contained" color="error" onClick={handleClearWeek} sx={{ borderRadius: 2 }}>
            確定清空
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF Preview & Export Modal */}
      <PDFPreviewModal
        open={pdfPreviewOpen}
        title={`【${schedule.storeId}】${schedule.storeName} 週排班表`}
        loading={exporting}
        onClose={() => setPdfPreviewOpen(false)}
        onConfirmDownload={handleConfirmDownloadPDF}
      />

      {/* Toast Snackbar */}
      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={toast.includes('失敗') ? 'error' : 'success'} sx={{ borderRadius: 2 }}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  )
}
