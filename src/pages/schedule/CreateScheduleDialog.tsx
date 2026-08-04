import React, { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Select, FormControl, InputLabel,
  FormHelperText, Stack, Typography, Box,
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

  const [storeCodeInput, setStoreCodeInput]   = useState('')
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [startDate, setStartDate]             = useState(formatDate(todayMonday))
  
  const [storeCodeError, setStoreCodeError]   = useState<string | null>(null)
  const [storeNameError, setStoreNameError]   = useState<string | null>(null)
  const [startDateError, setStartDateError]   = useState<string | null>(null)

  // Initialize or reset store selection when dialog opens or storeList loads
  useEffect(() => {
    if (open && storeList && storeList.length > 0) {
      if (!selectedStoreId || !storeList.some(s => s.id === selectedStoreId)) {
        const defaultSt = storeList[0]
        setSelectedStoreId(defaultSt.id)
        setStoreCodeInput(defaultSt.code || '')
        setStoreCodeError(null)
        setStoreNameError(null)
      }
    }
  }, [open, storeList])

  // Handle 門市店號 Input Change (Two-way sync: Code -> Name & UUID)
  const handleCodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setStoreCodeInput(val)
    const trimmed = val.trim()

    if (!trimmed) {
      setSelectedStoreId('')
      setStoreCodeError('請輸入門市店號')
      setStoreNameError(null)
      return
    }

    const matched = storeList.find(s => (s.code || '').trim() === trimmed)
    if (matched) {
      setSelectedStoreId(matched.id)
      setStoreCodeError(null)
      setStoreNameError(null)
    } else {
      setSelectedStoreId('')
      setStoreCodeError('查無此店號')
      setStoreNameError(null)
    }
  }

  // Handle 門市名稱 Select Change (Two-way sync: Name & UUID -> Code)
  const handleSelectStoreName = (selectedId: string) => {
    setSelectedStoreId(selectedId)
    const matched = storeList.find(s => s.id === selectedId)
    if (matched) {
      setStoreCodeInput(matched.code || '')
      setStoreCodeError(null)
      setStoreNameError(null)
    } else {
      setStoreCodeInput('')
      setStoreNameError('請選擇門市')
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
    let hasErr = false
    setStoreCodeError(null)
    setStoreNameError(null)
    setStartDateError(null)

    const trimmedCode = storeCodeInput.trim()
    if (!trimmedCode) {
      setStoreCodeError('請輸入門市店號')
      hasErr = true
    }

    const matched = storeList.find(s => s.id === selectedStoreId || (s.code || '').trim() === trimmedCode)
    if (!matched) {
      setStoreCodeError('查無此店號')
      hasErr = true
    } else if (!selectedStoreId || selectedStoreId !== matched.id) {
      setSelectedStoreId(matched.id)
    }

    if (!matched && !selectedStoreId) {
      setStoreNameError('請選擇門市')
      hasErr = true
    }

    if (!startDate) {
      setStartDateError('開始日期為必填')
      hasErr = true
    }

    if (hasErr || !matched) {
      return
    }

    const now = new Date().toISOString()
    const newSchedule: Schedule = {
      id: Math.random().toString(36).slice(2),
      storeId: matched.id, // Store ID (UUID) stored internally
      storeName: matched.name,
      storeCode: matched.code || trimmedCode,
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
          {/* 門市店號 * */}
          <TextField
            label="門市店號 *"
            value={storeCodeInput}
            size="small"
            fullWidth
            placeholder="例如：251732"
            error={!!storeCodeError}
            helperText={storeCodeError}
            onChange={handleCodeInputChange}
          />

          {/* 門市名稱 * */}
          <FormControl fullWidth size="small" error={!!storeNameError}>
            <InputLabel>門市名稱 *</InputLabel>
            <Select
              value={selectedStoreId}
              label="門市名稱 *"
              onChange={e => handleSelectStoreName(e.target.value as string)}
            >
              {storeList.map(s => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
            {storeNameError && (
              <FormHelperText error>{storeNameError}</FormHelperText>
            )}
          </FormControl>

          {/* 排班起始日 (週一) * */}
          <TextField
            label="排班起始日 (週一) *"
            type="date"
            value={startDate}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            error={!!startDateError}
            helperText={startDateError}
            onChange={e => {
              setStartDate(e.target.value)
              if (e.target.value) setStartDateError(null)
            }}
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
