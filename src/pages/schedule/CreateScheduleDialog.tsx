import React, { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Select, FormControl, InputLabel,
  Stack, Typography, Box,
} from '@mui/material'
import { Schedule } from '../../types/schedule'
import { useStoreContext } from '../../context/StoreContext'

interface Props {
  open: boolean
  onClose: () => void
  onCreate: (schedule: Schedule) => void
}

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(date.setDate(diff))
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default function CreateScheduleDialog({ open, onClose, onCreate }: Props) {
  const { stores: storeList } = useStoreContext()
  const todayMonday = getMonday(new Date())

  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [storeId, setStoreId]                 = useState('001')
  const [storeName, setStoreName]             = useState('慶東門市')
  const [storeCode, setStoreCode]             = useState('001')
  const [startDate, setStartDate]             = useState(formatDate(todayMonday))
  const [errors, setErrors]                   = useState<Record<string, string>>({})

  useEffect(() => {
    if (storeList && storeList.length > 0) {
      const defaultSt = storeList[0]
      setSelectedStoreId(defaultSt.id)
      setStoreId(defaultSt.id)
      setStoreName(defaultSt.name)
      setStoreCode(defaultSt.code || '001')
    }
  }, [storeList])

  const handleSelectStore = (selectedId: string) => {
    setSelectedStoreId(selectedId)
    const st = storeList.find(s => s.id === selectedId || s.name === selectedId || s.code === selectedId)
    if (st) {
      setStoreId(st.id)
      setStoreName(st.name)
      setStoreCode(st.code || st.id)
    }
  }

  // Compute Sunday from start date
  const computeWeekEnd = (start: string) => {
    if (!start) return ''
    const d = new Date(start)
    d.setDate(d.getDate() + 6)
    return formatDate(d)
  }

  const weekEnd = computeWeekEnd(startDate)

  const handleCreate = () => {
    const errs: Record<string, string> = {}
    if (!storeId.trim()) errs.storeId = '店號為必填'
    if (!storeName)      errs.storeName = '店名為必填'
    if (!startDate)      errs.startDate = '開始日期為必填'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    const now = new Date().toISOString()
    const newSchedule: Schedule = {
      id: Math.random().toString(36).slice(2),
      storeId: storeId.trim(),
      storeName,
      storeCode,
      weekStart: startDate,
      weekEnd,
      employees: [],
      remark: '',
      createdAt: now,
      updatedAt: now,
    }

    onCreate(newSchedule)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle fontWeight={700}>建立每週排班表</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {/* Store Name Dropdown */}
          <FormControl fullWidth size="small" error={!!errors.storeName}>
            <InputLabel>門市 *</InputLabel>
            <Select
              value={selectedStoreId || (storeList[0]?.id || '')}
              label="門市 *"
              onChange={e => handleSelectStore(e.target.value)}
            >
              {storeList.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.name}（{s.code || s.id}）</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Week Start Date */}
          <TextField
            label="排班起始日 (週一) *"
            type="date"
            value={startDate}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            error={!!errors.startDate}
            helperText={errors.startDate}
            onChange={e => setStartDate(e.target.value)}
          />

          {/* Computed Week Range */}
          {startDate && (
            <Box sx={{ p: 1.5, bgcolor: '#F3F4F6', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                排班週次區間（自動計算星期一至星期日）
              </Typography>
              <Typography variant="body2" fontWeight={700} color="primary.main" sx={{ mt: 0.5 }}>
                {startDate}（一） ～ {weekEnd}（日）
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 2 }}>
          取消
        </Button>
        <Button variant="contained" onClick={handleCreate} sx={{ borderRadius: 2 }}>
          建立班表
        </Button>
      </DialogActions>
    </Dialog>
  )
}
