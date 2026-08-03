import React, { useState, useMemo } from 'react'
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel, Stack, Snackbar, Alert,
} from '@mui/material'
import { useSchedule } from '../../context/ScheduleContext'
import { ScheduleRecord } from '../../types/schedule'

function newId() { return Math.random().toString(36).slice(2) }

interface Props {
  open: boolean
  initial?: ScheduleRecord
  defaultDate?: string  // 'YYYY-MM-DD'
  onClose: () => void
  onSave: (r: ScheduleRecord) => void
}

export default function ScheduleDialog({ open, initial, defaultDate, onClose, onSave }: Props) {
  const { state } = useSchedule()

  const [staffId, setStaffId]   = useState(initial?.staffId ?? '')
  const [date, setDate]         = useState(initial?.date ?? defaultDate ?? '')
  const [shiftId, setShiftId]   = useState(initial?.shiftId ?? '')
  const [note, setNote]         = useState(initial?.note ?? '')
  const [errors, setErrors]     = useState<Record<string, string>>({})

  React.useEffect(() => {
    if (open) {
      setStaffId(initial?.staffId ?? '')
      setDate(initial?.date ?? defaultDate ?? '')
      setShiftId(initial?.shiftId ?? '')
      setNote(initial?.note ?? '')
      setErrors({})
    }
  }, [open, initial, defaultDate])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!staffId)    e.staffId = '請選擇員工'
    if (!date)       e.date    = '請選擇日期'
    if (!shiftId)    e.shiftId = '請選擇班別'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const staff = state.staff.find(s => s.id === staffId)
    const shift = state.shifts.find(s => s.id === shiftId)
    if (!staff || !shift) return

    onSave({
      id:         initial?.id ?? newId(),
      staffId:    staff.id,
      staffName:  staff.name,
      date,
      shiftId:    shift.id,
      shiftName:  shift.name,
      shiftColor: shift.color,
      note,
    })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle fontWeight={700}>{initial ? '編輯排班' : '新增排班'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {/* Staff */}
          <FormControl size="small" fullWidth error={!!errors.staffId}>
            <InputLabel>員工 *</InputLabel>
            <Select value={staffId} label="員工 *" onChange={e => setStaffId(e.target.value)}>
              {state.staff.length === 0 ? (
                <MenuItem disabled value="">請先在「排班員工管理」新增員工</MenuItem>
              ) : state.staff.map(s => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}{s.store ? ` · ${s.store}` : ''}
                </MenuItem>
              ))}
            </Select>
            {errors.staffId && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{errors.staffId}</Typography>}
          </FormControl>

          {/* Date */}
          <TextField
            label="日期 *" type="date" value={date} size="small" fullWidth
            InputLabelProps={{ shrink: true }}
            error={!!errors.date} helperText={errors.date}
            onChange={e => setDate(e.target.value)}
          />

          {/* Shift */}
          <FormControl size="small" fullWidth error={!!errors.shiftId}>
            <InputLabel>班別 *</InputLabel>
            <Select value={shiftId} label="班別 *" onChange={e => setShiftId(e.target.value)}>
              {state.shifts.length === 0 ? (
                <MenuItem disabled value="">請先在「班別設定」新增班別</MenuItem>
              ) : state.shifts.map(s => (
                <MenuItem key={s.id} value={s.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: s.color }} />
                    {s.name}{s.startTime ? ` (${s.startTime}–${s.endTime})` : ''}
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {errors.shiftId && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{errors.shiftId}</Typography>}
          </FormControl>

          {/* Note */}
          <TextField
            label="備註（選填）" value={note} size="small" fullWidth multiline rows={2}
            onChange={e => setNote(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 2 }}>取消</Button>
        <Button variant="contained" onClick={handleSave} sx={{ borderRadius: 2 }}>儲存</Button>
      </DialogActions>
    </Dialog>
  )
}
