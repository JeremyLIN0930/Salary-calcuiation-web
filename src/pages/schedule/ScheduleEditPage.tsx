import React, { useState, useMemo } from 'react'
import {
  Box, Typography, Button, TextField, Stack, Paper,
  Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Card, Chip,
} from '@mui/material'
import { useSchedule } from '../../context/ScheduleContext'
import { useSnackbar } from '../../context/SnackbarContext'
import { PDFService } from '../../services/pdfService'
import PDFPreviewModal from '../../components/common/PDFPreviewModal'
import { Schedule, ScheduleEmployee, formatStoreTitle } from '../../types/schedule'
import ScheduleTable from './ScheduleTable'

const ArrowBackSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
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

  console.log("Edit page received", initialSchedule)

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
        showSnackbar('❌ 排班儲存失敗，請確認網路或 Console 錯誤', 'error')
        return false
      }
    } catch (err) {
      console.error('[ScheduleEditPage] handleSaveSchedule error:', err)
      showSnackbar('❌ 排班儲存失敗，請確認網路或 Console 錯誤', 'error')
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
        id: Math.random().toString(36).slice(2),
        name: pEmp.name,
        shifts: newShifts,
      }
    })

    handleLocalChange(copiedEmployees, undefined)
    showSnackbar(`已複製上一週（${prev.weekStart}）的員工與班表（請記得按下「💾 儲存排班」）`, 'info')
  }

  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false)
  const [pdfUrl, setPdfUrl]                 = useState<string | null>(null)
  const [pdfLoading, setPdfLoading]         = useState(false)
  const [pdfError, setPdfError]             = useState<string | null>(null)

  // Open Preview Modal & generate Blob
  const handleOpenPdfPreview = async () => {
    setPdfPreviewOpen(true)
    setPdfLoading(true)
    setPdfError(null)
    setPdfUrl(null)

    try {
      const res = await PDFService.createSchedulePDFBlob(schedule)
      if (!res.blob || res.blob.size === 0) {
        throw new Error('生成的 PDF 檔案大小為 0')
      }
      setPdfUrl(res.url)
    } catch (err: any) {
      console.error('[PDF Debug] Schedule PDF Generation Error:', err)
      setPdfError(err.message || 'PDF 建立失敗，請重試。')
    } finally {
      setPdfLoading(false)
    }
  }

  // Export PDF via Service
  const handleConfirmDownloadPDF = async () => {
    setExporting(true)
    try {
      await PDFService.exportSchedule(schedule)
      showSnackbar('排班表 PDF 已成功匯出下載！', 'success')
      setPdfPreviewOpen(false)
    } catch (err) {
      console.error('[PDF Debug] Download Error:', err)
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
              onClick={handleBackClick}
              sx={{ borderRadius: 2, minWidth: 40, px: 1, color: 'text.primary', borderColor: '#D1D5DB' }}
            >
              <ArrowBackSvg />
            </Button>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" fontWeight={800} color="primary.main">
                  {formatStoreTitle(schedule)} — 週排班表
                </Typography>
                {/* Save Status Badge */}
                {isSaving ? (
                  <Chip label="🔵 儲存中..." size="small" color="info" sx={{ fontWeight: 700 }} />
                ) : isDirty ? (
                  <Chip label="🟡 尚未儲存" size="small" color="warning" sx={{ fontWeight: 700 }} />
                ) : (
                  <Chip label="🟢 已儲存" size="small" color="success" sx={{ fontWeight: 700 }} />
                )}
              </Box>
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
              color="success"
              size="small"
              disabled={isSaving}
              onClick={() => handleSaveSchedule(false)}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              {isSaving ? (
                <CircularProgress size={16} sx={{ mr: 1, color: '#fff' }} />
              ) : (
                <SaveSvg />
              )}
              {isSaving ? '儲存中...' : '💾 儲存排班'}
            </Button>

            <Button
              variant="contained"
              size="small"
              disabled={exporting}
              onClick={handleOpenPdfPreview}
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
        onChangeEmployees={emps => handleLocalChange(emps, undefined)}
      />

      {/* Bottom Remark Section */}
      <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          備註說明
        </Typography>
        <TextField
          placeholder="例如：新人教育訓練、中秋連假人力支援說明..."
          value={schedule.remark || ''}
          multiline
          minRows={3}
          maxRows={6}
          fullWidth
          size="small"
          onChange={e => handleLocalChange(undefined, e.target.value)}
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

      {/* Leave Dirty Confirmation Dialog */}
      <Dialog open={leaveConfirmOpen} onClose={() => setLeaveConfirmOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>你有尚未儲存的排班</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            本週排班已有變更但尚未儲存至 Supabase 資料庫，請問是否立即儲存？
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setLeaveConfirmOpen(false)} sx={{ borderRadius: 2 }}>
            取消
          </Button>
          <Button variant="outlined" color="error" onClick={() => { setLeaveConfirmOpen(false); onBack(); }} sx={{ borderRadius: 2 }}>
            不儲存
          </Button>
          <Button variant="contained" color="success" onClick={() => { setLeaveConfirmOpen(false); handleSaveSchedule(true); }} sx={{ borderRadius: 2 }}>
            儲存
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        open={pdfPreviewOpen}
        onClose={() => setPdfPreviewOpen(false)}
        onConfirmDownload={handleConfirmDownloadPDF}
        pdfUrl={pdfUrl}
        loading={pdfLoading}
        pdfError={pdfError}
        title={`週排班表 PDF 預覽 — ${schedule.storeName} (${schedule.weekStart})`}
      />
    </Box>
  )
}
