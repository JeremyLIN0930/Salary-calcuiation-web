import React from 'react'
import {
  Box, Typography, Drawer, Button, Stack, FormControl,
  InputLabel, Select, MenuItem,
} from '@mui/material'
import { useAppearance } from '../../context/AppearanceContext'

interface Props {
  open: boolean
  onClose: () => void
  searchYear: string
  setSearchYear: (y: string) => void
  searchMonth: string
  setSearchMonth: (m: string) => void
  availableYears: (number | string)[]
  isFilterActive: boolean
  onClearFilter: () => void
}

export default function MobileFilterBottomSheet({
  open,
  onClose,
  searchYear,
  setSearchYear,
  searchMonth,
  setSearchMonth,
  availableYears,
  isFilterActive,
  onClearFilter,
}: Props) {
  const { tokens, effectiveTheme } = useAppearance()
  const isDark = effectiveTheme === 'dark'

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          bgcolor: isDark ? '#1C2128' : '#FFFFFF',
          color: tokens.cardTextPrimary,
          px: 2.5,
          pt: 1.5,
          pb: 3.5,
          maxHeight: '75vh',
        },
      }}
    >
      {/* Top Grabber Pill */}
      <Box
        sx={{
          width: 36,
          height: 4,
          borderRadius: 2,
          bgcolor: isDark ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
          mx: 'auto',
          mb: 2,
        }}
      />

      <Typography variant="h6" fontWeight={800} sx={{ mb: 2, fontSize: '18px', display: 'flex', alignItems: 'center', gap: 1 }}>
        ⚙️ 篩選條件
      </Typography>

      <Stack spacing={2}>
        {/* Year Select */}
        <FormControl fullWidth size="small">
          <InputLabel>年份</InputLabel>
          <Select
            value={searchYear}
            label="年份"
            onChange={e => setSearchYear(e.target.value)}
            sx={{
              borderRadius: '16px',
              height: 48,
              fontWeight: 700,
            }}
          >
            <MenuItem value="all">全部分年</MenuItem>
            {availableYears.map(y => (
              <MenuItem key={y} value={String(y)}>{y} 年</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Month Select */}
        <FormControl fullWidth size="small">
          <InputLabel>月份</InputLabel>
          <Select
            value={searchMonth}
            label="月份"
            onChange={e => setSearchMonth(e.target.value)}
            sx={{
              borderRadius: '16px',
              height: 48,
              fontWeight: 700,
            }}
          >
            <MenuItem value="all">全部月份</MenuItem>
            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
              <MenuItem key={m} value={m}>{m} 月</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            disabled={!isFilterActive}
            onClick={() => {
              onClearFilter()
              onClose()
            }}
            sx={{
              height: 48,
              borderRadius: '16px',
              borderColor: '#CBD5E1',
              color: '#475569',
              fontWeight: 700,
            }}
          >
            ✕ 清除篩選
          </Button>

          <Button
            fullWidth
            variant="contained"
            onClick={onClose}
            sx={{
              height: 48,
              borderRadius: '16px',
              bgcolor: '#2F80ED',
              fontWeight: 700,
              '&:hover': { bgcolor: '#1D6FD8' },
            }}
          >
            套用篩選
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  )
}
