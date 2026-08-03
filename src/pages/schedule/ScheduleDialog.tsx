import React, { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel,
  TextField, Stack, Box, Typography, Chip, Alert,
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

const QUICK_SHIFTS = [
  { label: '🌞 早班', type: 'work' as ShiftType, start: '07:00', end: '15:00' },
  { label: '🌆 晚班', type: 'work' as ShiftType, start: '15:00', end: '23:00' },
  { label: '🌙 大夜班', type: 'work' as ShiftType, start: '23:00', end: '07:00' },
  { label: '🛌 休',   type: 'off' as ShiftType },
  { label: '🌿 特',   type: 'annual' as ShiftType },
  { label: '🤒 病',   type: 'sick' as ShiftType },
  { label: '📝 事',   type: 'personal' as ShiftType },
]

export default function ScheduleDialog({
  open, employeeName, date, dayLabel, shift, onClose, onSave, onClear,
}: Props) {
  const [type, setType]           = useState<ShiftType>('work')
  const [startTime, setStartTime] = useState('07:00')
  const [endTime, setEndTime]     = useState('15:00')
  const [remark, setRemark]       = useState('')
  const [errorMsg, setErrorMsg]   = useState('')

  useEffect(() => {
    if (open) {
      setErrorMsg('')
      if (shift) {
        setType(shift.type || 'work')
        setStartTime(shift.startTime ? shift.startTime.trim().slice(0, 5) : '07:00')
        setEndTime(shift.endTime ? shift.endTime.trim().slice(0, 5) : '15:00')
        setRemark(shift.remark || '')
      } else {
        setType('work')
        setStartTime('07:00')
        setEndTime('15:00')
        setRemark('')
      }
    }
  }, [open, shift])

  // Quick Preset Click
  const handleQuickSelect = (preset: typeof QUICK_SHIFTS[number]) => {
    setType(preset.type)
    if (preset.start && preset.end) {
      setStartTime(preset.start)
      setEndTime(preset.end)
    }
    setErrorMsg('')
  }

  const handleSave = () => {
    // Basic Time Validation
    if (type === 'work' && !startTime) {
      setErrorMsg('請輸入上班開始時間')
      return
    }
    if (type === 'work' && !endTime) {
      setErrorMsg('請輸入上班結束時間')
      return
    }

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
      maxWidth="sm" // Max 600px
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 1,
          maxWidth: 600,
          width: { xs: '95%', sm: '80%', md: '600px' },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
        {employeeName} · {dayLabel}
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
          {date}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>

          {/* Quick Shift Selection Presets */}
          <Box>
            <FormLabel component="legend" sx={{ fontSize: 14, fontWeight: 700, mb: 1, color: 'text.primary' }}>
              快速選取班別（點一下即可帶入）
            </FormLabel>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {QUICK_SHIFTS.map(p => (
                <Chip
                  key={p.label}
                  label={p.label}
                  clickable
                  variant="outlined"
                  color="primary"
                  onClick={() => handleQuickSelect(p)}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 700,
                    fontSize: 14,
                    py: 2,
                    px: 0.5,
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Shift Type Radio Selection */}
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontSize: 14, fontWeight: 700, mb: 1, color: 'text.primary' }}>
              班別種類
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
                      px: 1.5,
                      py: 1,
                      borderRadius: 2.5,
                      border: '2px solid',
                      borderColor: checked ? 'primary.main' : '#E5E7EB',
                      bgcolor: conf.bg,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Radio size="small" checked={checked} value={t} sx={{ p: 0.5 }} />
                    <Typography variant="body1" fontWeight={700} sx={{ color: conf.color, ml: 0.5 }}>
                      {conf.label}
                    </Typography>
                  </Box>
                )
              })}
            </RadioGroup>
          </FormControl>

          {/* Time Picker (Only when type === 'work') */}
          {type === 'work' && (
            <Box>
              <FormLabel component="legend" sx={{ fontSize: 14, fontWeight: 700, mb: 1, color: 'text.primary' }}>
                工作時間 (24小時制)
              </FormLabel>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="開始時間 *"
                  type="time"
                  value={startTime}
                  size="medium"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 300 }}
                  onChange={e => {
                    setStartTime(e.target.value)
                    setErrorMsg('')
                  }}
                />
                <TextField
                  label="結束時間 *"
                  type="time"
                  value={endTime}
                  size="medium"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 300 }}
                  onChange={e => {
                    setEndTime(e.target.value)
                    setErrorMsg('')
                  }}
                />
              </Stack>
            </Box>
          )}

          {/* Error Notice */}
          {errorMsg && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>{errorMsg}</Alert>
          )}

          {/* Remark */}
          <TextField
            label="備註說明（選填）"
            value={remark}
            size="small"
            fullWidth
            placeholder="例如：支援、換班說明"
            onChange={e => setRemark(e.target.value)}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, justifyContent: 'space-between' }}>
        <Button variant="text" color="error" size="medium" onClick={handleClear}>
          清空此排班
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 2.5, px: 2.5 }}>
            取消
          </Button>
          <Button variant="contained" onClick={handleSave} sx={{ borderRadius: 2.5, px: 3 }}>
            確定儲存
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
}
