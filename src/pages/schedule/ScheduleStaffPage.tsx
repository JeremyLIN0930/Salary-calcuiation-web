import React, { useState } from 'react'
import {
  Box, Typography, Button, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel, Snackbar, Alert, Tooltip, Stack,
} from '@mui/material'
import { useSchedule } from '../../context/ScheduleContext'
import { ScheduleStaff } from '../../types/schedule'

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

const STORES = ['慶東門市', '南醫門市', '']

function newId() { return Math.random().toString(36).slice(2) }

function StaffDialog({
  open, initial, onClose, onSave,
}: {
  open: boolean
  initial?: ScheduleStaff
  onClose: () => void
  onSave: (s: ScheduleStaff) => void
}) {
  const [name, setName]   = useState(initial?.name ?? '')
  const [store, setStore] = useState(initial?.store ?? '')
  const [note, setNote]   = useState(initial?.note ?? '')
  const [err, setErr]     = useState('')

  React.useEffect(() => {
    if (open) {
      setName(initial?.name ?? '')
      setStore(initial?.store ?? '')
      setNote(initial?.note ?? '')
      setErr('')
    }
  }, [open, initial])

  const handleSave = () => {
    if (!name.trim()) { setErr('姓名為必填'); return }
    onSave({ id: initial?.id ?? newId(), name: name.trim(), store, note })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle fontWeight={700}>{initial ? '編輯員工' : '新增員工'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField label="姓名 *" value={name} size="small" fullWidth
            error={!!err} helperText={err}
            onChange={e => { setName(e.target.value); setErr('') }} />
          <FormControl size="small" fullWidth>
            <InputLabel>門市</InputLabel>
            <Select value={store} label="門市" onChange={e => setStore(e.target.value)}>
              <MenuItem value=""><em>未指定</em></MenuItem>
              <MenuItem value="慶東門市">慶東門市</MenuItem>
              <MenuItem value="南醫門市">南醫門市</MenuItem>
            </Select>
          </FormControl>
          <TextField label="備註" value={note} size="small" fullWidth multiline rows={2}
            onChange={e => setNote(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 2 }}>取消</Button>
        <Button variant="contained" onClick={handleSave} sx={{ borderRadius: 2 }}>儲存</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function ScheduleStaffPage() {
  const { state, dispatch } = useSchedule()
  const [dialogOpen, setDialogOpen]     = useState(false)
  const [editing, setEditing]           = useState<ScheduleStaff | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<ScheduleStaff | null>(null)
  const [toast, setToast]               = useState('')

  const handleSave = (s: ScheduleStaff) => {
    if (editing) dispatch({ type: 'UPDATE_STAFF', payload: s })
    else         dispatch({ type: 'ADD_STAFF',    payload: s })
    setToast(editing ? '員工已更新' : '員工已新增')
    setEditing(undefined)
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', px: 2, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ flexGrow: 1 }}>排班員工管理</Typography>
        <Button variant="contained" onClick={() => { setEditing(undefined); setDialogOpen(true) }} sx={{ borderRadius: 2 }}>
          <AddSvg />新增員工
        </Button>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 700 }}>姓名</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>門市</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>備註</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {state.staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.disabled' }}>
                    尚未新增任何員工
                  </TableCell>
                </TableRow>
              ) : state.staff.map(s => (
                <TableRow key={s.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                  <TableCell>{s.store || '—'}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.note || '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="編輯">
                      <IconButton size="small" onClick={() => { setEditing(s); setDialogOpen(true) }} sx={{ color: 'primary.main' }}>
                        <EditSvg />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="刪除">
                      <IconButton size="small" onClick={() => setDeleteTarget(s)} sx={{ color: 'error.main' }}>
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

      <StaffDialog
        open={dialogOpen}
        initial={editing}
        onClose={() => { setDialogOpen(false); setEditing(undefined) }}
        onSave={handleSave}
      />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>確定刪除？</DialogTitle>
        <DialogContent>刪除「{deleteTarget?.name}」後無法復原，相關排班記錄仍會保留。</DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDeleteTarget(null)} sx={{ borderRadius: 2 }}>取消</Button>
          <Button variant="contained" color="error" sx={{ borderRadius: 2 }}
            onClick={() => {
              if (deleteTarget) dispatch({ type: 'DELETE_STAFF', payload: deleteTarget.id })
              setDeleteTarget(null)
              setToast('員工已刪除')
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
