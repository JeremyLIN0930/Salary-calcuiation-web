import React, { useState, useMemo } from 'react'
import {
  Box, Typography, Button, IconButton, Chip, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, Tooltip, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress,
} from '@mui/material'
import { useSchedule } from '../../context/ScheduleContext'
import { ScheduleRecord } from '../../types/schedule'
import ScheduleDialog from './ScheduleDialog'

// ─── SVG Icons ───────────────────────────────────────────────────────────────

const AddSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6 }}>
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
)
const ChevLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
  </svg>
)
const ChevRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
  </svg>
)
const EditSvg = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
)
const DelSvg = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
)
const PdfSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6 }}>
    <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
  </svg>
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function toYmd(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function parseYm(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  return { year: y, month: m - 1 }
}

function fmtYm(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

// ─── Calendar Cell ───────────────────────────────────────────────────────────

interface DayCellProps {
  day: number
  records: ScheduleRecord[]
  onAdd: () => void
  onEdit: (r: ScheduleRecord) => void
  onDelete: (r: ScheduleRecord) => void
}

function DayCell({ day, records, onAdd, onEdit, onDelete }: DayCellProps) {
  return (
    <Box sx={{ minHeight: 64, p: 0.5, '&:hover .day-add': { opacity: 1 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.3 }}>
        <Typography variant="caption" fontWeight={600} color="text.secondary">{day}</Typography>
        <IconButton size="small" className="day-add" onClick={onAdd}
          sx={{ opacity: 0, transition: 'opacity 0.15s', width: 18, height: 18 }}>
          <AddSvg />
        </IconButton>
      </Box>
      {records.map(r => (
        <Box key={r.id}
          sx={{
            bgcolor: r.shiftColor, color: '#fff', borderRadius: 0.8,
            px: 0.5, py: 0.2, mb: 0.3, fontSize: 11, display: 'flex',
            alignItems: 'center', justifyContent: 'space-between', lineHeight: 1.4,
          }}
        >
          <Typography sx={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>
            {r.staffName} · {r.shiftName}
          </Typography>
          <Box sx={{ display: 'flex', flexShrink: 0 }}>
            <IconButton size="small" onClick={() => onEdit(r)} sx={{ color: '#fff', p: 0.1 }}><EditSvg /></IconButton>
            <IconButton size="small" onClick={() => onDelete(r)} sx={{ color: '#fff', p: 0.1 }}><DelSvg /></IconButton>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

// ─── List View ───────────────────────────────────────────────────────────────

function ListView({
  records, onEdit, onDelete,
}: { records: ScheduleRecord[]; onEdit: (r: ScheduleRecord) => void; onDelete: (r: ScheduleRecord) => void }) {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
              <TableCell sx={{ fontWeight: 700 }}>日期</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>員工</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>班別</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>備註</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.disabled' }}>
                  本月尚無排班記錄
                </TableCell>
              </TableRow>
            ) : sorted.map(r => (
              <TableRow key={r.id} hover>
                <TableCell>{r.date}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{r.staffName}</TableCell>
                <TableCell>
                  <Chip label={r.shiftName} size="small"
                    sx={{ bgcolor: r.shiftColor, color: '#fff', fontWeight: 700, fontSize: 12 }} />
                </TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{r.note || '—'}</TableCell>
                <TableCell align="right">
                  <Tooltip title="編輯">
                    <IconButton size="small" onClick={() => onEdit(r)} sx={{ color: 'primary.main' }}><EditSvg /></IconButton>
                  </Tooltip>
                  <Tooltip title="刪除">
                    <IconButton size="small" onClick={() => onDelete(r)} sx={{ color: 'error.main' }}><DelSvg /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const { state, dispatch } = useSchedule()

  const today    = new Date()
  const [ym, setYm]               = useState(fmtYm(today.getFullYear(), today.getMonth()))
  const [view, setView]           = useState<'calendar' | 'list'>('calendar')
  const [dialogOpen, setDialogOpen]     = useState(false)
  const [editingRecord, setEditingRecord] = useState<ScheduleRecord | undefined>()
  const [defaultDate, setDefaultDate]     = useState<string>('')
  const [deleteTarget, setDeleteTarget]   = useState<ScheduleRecord | null>(null)
  const [toast, setToast]               = useState('')
  const [exporting, setExporting]       = useState(false)

  const { year, month } = useMemo(() => parseYm(ym), [ym])

  const monthRecords = useMemo(() =>
    state.records.filter(r => r.date.startsWith(ym)),
    [state.records, ym]
  )

  const prevMonth = () => {
    const d = new Date(year, month - 1, 1)
    setYm(fmtYm(d.getFullYear(), d.getMonth()))
  }
  const nextMonth = () => {
    const d = new Date(year, month + 1, 1)
    setYm(fmtYm(d.getFullYear(), d.getMonth()))
  }

  const openAdd = (date = '') => {
    setEditingRecord(undefined)
    setDefaultDate(date)
    setDialogOpen(true)
  }

  const openEdit = (r: ScheduleRecord) => {
    setEditingRecord(r)
    setDefaultDate(r.date)
    setDialogOpen(true)
  }

  const handleSave = (r: ScheduleRecord) => {
    if (editingRecord) dispatch({ type: 'UPDATE_RECORD', payload: r })
    else               dispatch({ type: 'ADD_RECORD',    payload: r })
    setToast(editingRecord ? '排班已更新' : '排班已新增')
  }

  const handleDelete = (r: ScheduleRecord) => setDeleteTarget(r)

  const confirmDelete = () => {
    if (deleteTarget) dispatch({ type: 'DELETE_RECORD', payload: deleteTarget.id })
    setDeleteTarget(null)
    setToast('排班已刪除')
  }

  const handleExportPdf = async () => {
    if (monthRecords.length === 0) { setToast('本月無排班資料可匯出'); return }
    setExporting(true)
    try {
      const { generateSchedulePDF } = await import('../../utils/schedulePdfGenerator')
      await generateSchedulePDF(state.staff, state.shifts, monthRecords, year, month)
      setToast('PDF 已匯出')
    } catch (e) {
      console.error(e)
      setToast('PDF 匯出失敗，請重試')
    } finally {
      setExporting(false)
    }
  }

  // Build calendar grid
  const firstDay   = new Date(year, month, 1).getDay()
  const totalDays  = daysInMonth(year, month)
  const calendarCells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  // Pad to full weeks
  while (calendarCells.length % 7 !== 0) calendarCells.push(null)

  const recordsByDate = useMemo(() => {
    const map: Record<string, ScheduleRecord[]> = {}
    monthRecords.forEach(r => {
      if (!map[r.date]) map[r.date] = []
      map[r.date].push(r)
    })
    return map
  }, [monthRecords])

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: 2, py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" fontWeight={800} sx={{ flexGrow: 1 }}>排班管理</Typography>
        <Button variant="outlined" onClick={handleExportPdf} disabled={exporting} sx={{ borderRadius: 2 }}>
          {exporting ? <CircularProgress size={16} sx={{ mr: 1 }} /> : <PdfSvg />}
          匯出本月 PDF
        </Button>
        <Button variant="contained" onClick={() => openAdd()} sx={{ borderRadius: 2 }}>
          <AddSvg />新增排班
        </Button>
      </Box>

      {/* Month Navigator */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <IconButton onClick={prevMonth} size="small"><ChevLeft /></IconButton>
        <Typography variant="subtitle1" fontWeight={700} sx={{ minWidth: 100, textAlign: 'center' }}>
          {year} 年 {month + 1} 月
        </Typography>
        <IconButton onClick={nextMonth} size="small"><ChevRight /></IconButton>

        <Box sx={{ ml: 2 }}>
          <Tabs value={view} onChange={(_, v) => setView(v)} sx={{ minHeight: 36 }}>
            <Tab value="calendar" label="月曆" sx={{ minHeight: 36, py: 0, fontSize: 13 }} />
            <Tab value="list"     label="列表" sx={{ minHeight: 36, py: 0, fontSize: 13 }} />
          </Tabs>
        </Box>
      </Box>

      {/* Calendar View */}
      {view === 'calendar' && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'auto' }}>
          {/* Weekday header */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid', borderColor: 'divider' }}>
            {WEEKDAYS.map((w, i) => (
              <Box key={w} sx={{
                py: 1, textAlign: 'center',
                bgcolor: i === 0 ? '#fff5f5' : i === 6 ? '#f0f7ff' : '#f8f9fa',
              }}>
                <Typography variant="caption" fontWeight={700}
                  color={i === 0 ? 'error.main' : i === 6 ? 'primary.main' : 'text.secondary'}>
                  {w}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Calendar cells */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {calendarCells.map((day, idx) => {
              const dateStr = day ? `${ym}-${String(day).padStart(2, '0')}` : ''
              const dayRecs = dateStr ? (recordsByDate[dateStr] ?? []) : []
              const isToday = day ? toYmd(today) === dateStr : false
              const col = idx % 7

              return (
                <Box key={idx} sx={{
                  borderRight: (idx + 1) % 7 !== 0 ? '1px solid #f0f0f0' : 'none',
                  borderBottom: idx < calendarCells.length - 7 ? '1px solid #f0f0f0' : 'none',
                  bgcolor: !day ? '#fafafa' : isToday ? '#EFF6FF' : col === 0 ? '#fff8f8' : col === 6 ? '#f8fbff' : 'white',
                  minHeight: 80,
                }}>
                  {day && (
                    <DayCell
                      day={day}
                      records={dayRecs}
                      onAdd={() => openAdd(dateStr)}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  )}
                </Box>
              )
            })}
          </Box>
        </Card>
      )}

      {/* List View */}
      {view === 'list' && (
        <ListView records={monthRecords} onEdit={openEdit} onDelete={handleDelete} />
      )}

      {/* Add / Edit Dialog */}
      <ScheduleDialog
        open={dialogOpen}
        initial={editingRecord}
        defaultDate={defaultDate}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>確定刪除此排班？</DialogTitle>
        <DialogContent>
          {deleteTarget && `${deleteTarget.date} · ${deleteTarget.staffName} · ${deleteTarget.shiftName}`}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDeleteTarget(null)} sx={{ borderRadius: 2 }}>取消</Button>
          <Button variant="contained" color="error" onClick={confirmDelete} sx={{ borderRadius: 2 }}>刪除</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={toast.includes('失敗') ? 'error' : 'success'} sx={{ borderRadius: 2 }}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  )
}
