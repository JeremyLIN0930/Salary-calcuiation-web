import React, { useState } from 'react'
import {
  Box, Typography, Button, Card, CardContent, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Snackbar, Alert, Tooltip,
} from '@mui/material'
import { useSchedule } from '../../context/ScheduleContext'
import { ShiftTemplate } from '../../types/schedule'

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

const PRESET_COLORS = [
  '#1976D2','#7B1FA2','#388E3C','#F57C00','#D32F2F',
  '#0288D1','#C2185B','#5D4037','#0097A7','#455A64',
]

function newId() { return Math.random().toString(36).slice(2) }

function ShiftDialog({
  open, initial, onClose, onSave,
}: {
  open: boolean
  initial?: ShiftTemplate
  onClose: () => void
  onSave: (t: ShiftTemplate) => void
}) {
  const [name, setName]           = useState(initial?.name ?? '')
  const [color, setColor]         = useState(initial?.color ?? '#1976D2')
  const [startTime, setStartTime] = useState(initial?.startTime ?? '')
  const [endTime, setEndTime]     = useState(initial?.endTime ?? '')
  const [err, setErr]             = useState('')

  React.useEffect(() => {
    if (open) {
      setName(initial?.name ?? '')
      setColor(initial?.color ?? '#1976D2')
      setStartTime(initial?.startTime ?? '')
      setEndTime(initial?.endTime ?? '')
      setErr('')
    }
  }, [open, initial])

  const handleSave = () => {
    if (!name.trim()) { setErr('班別名稱為必填'); return }
    onSave({
      id: initial?.id ?? newId(),
      name: name.trim(),
      color,
      startTime,
      endTime,
    })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{initial ? '編輯班別' : '新增班別'}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          <TextField
            label="班別名稱 *" value={name} size="small" fullWidth
            error={!!err} helperText={err}
            onChange={e => { setName(e.target.value); setErr('') }}
          />
          <TextField
            label="上班時間" type="time" value={startTime} size="small" fullWidth
            InputLabelProps={{ shrink: true }}
            onChange={e => setStartTime(e.target.value)}
          />
          <TextField
            label="下班時間" type="time" value={endTime} size="small" fullWidth
            InputLabelProps={{ shrink: true }}
            onChange={e => setEndTime(e.target.value)}
          />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>顏色</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {PRESET_COLORS.map(c => (
                <Box
                  key={c}
                  onClick={() => setColor(c)}
                  sx={{
                    width: 28, height: 28, borderRadius: '50%', bgcolor: c, cursor: 'pointer',
                    border: color === c ? '3px solid #111' : '2px solid transparent',
                    transition: 'border 0.15s',
                  }}
                />
              ))}
            </Box>
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: color }} />
              <TextField
                label="自訂顏色 (hex)" value={color} size="small"
                onChange={e => setColor(e.target.value)}
                sx={{ width: 160 }}
              />
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 2 }}>取消</Button>
        <Button variant="contained" onClick={handleSave} sx={{ borderRadius: 2 }}>儲存</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function ShiftSettingsPage() {
  const { state, dispatch } = useSchedule()
  const [dialogOpen, setDialogOpen]   = useState(false)
  const [editing, setEditing]         = useState<ShiftTemplate | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<ShiftTemplate | null>(null)
  const [toast, setToast]             = useState('')

  const handleSave = (t: ShiftTemplate) => {
    if (editing) dispatch({ type: 'UPDATE_SHIFT', payload: t })
    else         dispatch({ type: 'ADD_SHIFT',    payload: t })
    setToast(editing ? '班別已更新' : '班別已新增')
    setEditing(undefined)
  }

  const openEdit = (t: ShiftTemplate) => { setEditing(t); setDialogOpen(true) }
  const openAdd  = () => { setEditing(undefined); setDialogOpen(true) }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', px: 2, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ flexGrow: 1 }}>班別設定</Typography>
        <Button variant="contained" onClick={openAdd} sx={{ borderRadius: 2 }}>
          <AddSvg />新增班別
        </Button>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 700 }}>班別名稱</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>顏色</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>上班時間</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>下班時間</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {state.shifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.disabled' }}>
                    尚未設定任何班別
                  </TableCell>
                </TableRow>
              ) : state.shifts.map(shift => (
                <TableRow key={shift.id} hover>
                  <TableCell>
                    <Chip
                      label={shift.name}
                      size="small"
                      sx={{ bgcolor: shift.color, color: 'white', fontWeight: 700, fontSize: 13 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: shift.color }} />
                      <Typography variant="caption" color="text.secondary">{shift.color}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{shift.startTime || '—'}</TableCell>
                  <TableCell>{shift.endTime   || '—'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="編輯">
                      <IconButton size="small" onClick={() => openEdit(shift)} sx={{ color: 'primary.main' }}>
                        <EditSvg />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="刪除">
                      <IconButton size="small" onClick={() => setDeleteTarget(shift)} sx={{ color: 'error.main' }}>
                        <DelSvg />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add / Edit Dialog */}
      <ShiftDialog
        open={dialogOpen}
        initial={editing}
        onClose={() => { setDialogOpen(false); setEditing(undefined) }}
        onSave={handleSave}
      />

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>確定刪除？</DialogTitle>
        <DialogContent>
          刪除「{deleteTarget?.name}」班別後，已排班記錄中的班別名稱仍會保留，但無法再選取此班別。
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDeleteTarget(null)} sx={{ borderRadius: 2 }}>取消</Button>
          <Button variant="contained" color="error" sx={{ borderRadius: 2 }}
            onClick={() => {
              if (deleteTarget) dispatch({ type: 'DELETE_SHIFT', payload: deleteTarget.id })
              setDeleteTarget(null)
              setToast('班別已刪除')
            }}>
            刪除
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" sx={{ borderRadius: 2 }}>{toast}</Alert>
      </Snackbar>
    </Box>
  )
}
