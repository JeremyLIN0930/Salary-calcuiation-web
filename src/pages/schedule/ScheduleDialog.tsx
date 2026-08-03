import React, { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel,
  TextField, Stack, Box, Typography,
} from '@mui/material'
import { Shift, ShiftType, SHIFT_TYPE_CONFIG } from '../../types/schedule'

interface Props {
  open: boolean
  employeeName: string
  date: string
  dayLabel: string
  shift?: Shift
  onClose: () => void
  onSave: (shift: Shift) => void
  onClear: () => void
}

export default function ScheduleDialog({
  open, employeeName, date, dayLabel, shift, onClose, onSave, onClear,
}: Props) {
  const [type, setType]           = useState<ShiftType>('work')
  const [startTime, setStartTime] = useState('07:00')
  const [endTime, setEndTime]     = useState('15:00')
  const [remark, setRemark]       = useState('')

  useEffect(() => {
    if (open) {
      if (shift) {
        setType(shift.type || 'work')
        setStartTime(shift.startTime || '07:00')
        setEndTime(shift.endTime || '15:00')
        setRemark(shift.remark || '')
      } else {
        setType('work')
        setStartTime('07:00')
        setEndTime('15:00')
        setRemark('')
      }
    }
  }, [open, shift])

  const handleSave = () => {
    const updated: Shift = {
      date,
      type,
      startTime: type === 'work' ? startTime : undefined,
      endTime: type === 'work' ? endTime : undefined,
      remark: remark.trim() ? remark.trim() : undefined,
    }
    onSave(updated)
    onClose()
  }

  const handleClear = () => {
    onClear()
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        {employeeName} · {dayLabel}
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
          {date}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {/* Shift Type Radio Selection */}
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>
              班別選取
            </FormLabel>
            <RadioGroup
              row
              value={type}
              onChange={e => setType(e.target.value as ShiftType)}
              sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}
            >
              {(Object.keys(SHIFT_TYPE_CONFIG) as ShiftType[]).map(t => {
                const conf = SHIFT_TYPE_CONFIG[t]
                const checked = type === t
                return (
                  <Box
                    key={t}
                    onClick={() => setType(t)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      px: 1,
                      py: 0.5,
                      borderRadius: 2,
                      border: '1.5px solid',
                      borderColor: checked ? 'primary.main' : '#E5E7EB',
                      bgcolor: conf.bg,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Radio size="small" checked={checked} value={t} sx={{ p: 0.5 }} />
                    <Typography variant="body2" fontWeight={700} sx={{ color: conf.color, ml: 0.5 }}>
                      {conf.label}
                    </Typography>
                  </Box>
                )
              })}
            </RadioGroup>
          </FormControl>

          {/* Time Picker (Only when type === 'work') */}
          {type === 'work' && (
            <Stack direction="row" spacing={2}>
              <TextField
                label="開始時間 *"
                type="time"
                value={startTime}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }} // 5 min steps
                onChange={e => setStartTime(e.target.value)}
              />
              <TextField
                label="結束時間 *"
                type="time"
                value={endTime}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
                onChange={e => setEndTime(e.target.value)}
              />
            </Stack>
          )}

          {/* Remark */}
          <TextField
            label="備註（選填）"
            value={remark}
            size="small"
            fullWidth
            placeholder="例如：支援、換班說明"
            onChange={e => setRemark(e.target.value)}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1, justifyContent: 'space-between' }}>
        <Button variant="text" color="error" size="small" onClick={handleClear}>
          清空此排班
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 2 }}>
            取消
          </Button>
          <Button variant="contained" onClick={handleSave} sx={{ borderRadius: 2 }}>
            確定
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
}
