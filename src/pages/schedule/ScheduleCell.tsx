import React from 'react'
import { TableCell, Typography, Box } from '@mui/material'
import { Shift, SHIFT_TYPE_CONFIG } from '../../types/schedule'

interface Props {
  shift?: Shift
  onClick: () => void
}

export default function ScheduleCell({ shift, onClick }: Props) {
  const isBlank = !shift || !shift.type || shift.type.trim() === ''

  if (isBlank) {
    return (
      <TableCell
        align="center"
        onClick={onClick}
        sx={{
          cursor: 'pointer',
          height: 60,
          py: 1,
          px: 0.5,
          userSelect: 'none',
          bgcolor: '#ffffff',
          borderRight: '1px solid #E5E7EB',
          '&:hover': { bgcolor: '#F3F4F6' },
        }}
      >
        <Typography variant="body2" color="text.disabled" sx={{ fontSize: 16 }}>—</Typography>
      </TableCell>
    )
  }

  const conf = SHIFT_TYPE_CONFIG[shift.type]

  let displayText = '—'
  if (shift.type === 'work') {
    const s = shift.startTime ? shift.startTime.trim().slice(0, 5) : ''
    const e = shift.endTime ? shift.endTime.trim().slice(0, 5) : ''
    if (s && e) {
      displayText = `${s}－${e}`
    } else {
      displayText = '上班'
    }
  } else if (conf) {
    displayText = conf.label
  }

  const bgColor = conf ? conf.bg : '#ffffff'
  const textColor = conf ? conf.color : '#111827'

  return (
    <TableCell
      align="center"
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        height: 60,
        py: 1,
        px: 0.5,
        userSelect: 'none',
        bgcolor: bgColor,
        borderRight: '1px solid #E5E7EB',
        transition: 'background-color 0.15s',
        '&:hover': { opacity: 0.85 },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography
          variant="body1"
          fontWeight={shift.type === 'work' ? 700 : 900}
          sx={{
            color: textColor,
            fontSize: shift.type === 'work' ? 14 : 16,
            whiteSpace: 'nowrap',
            letterSpacing: shift.type === 'work' ? 0 : 2,
          }}
        >
          {displayText}
        </Typography>
        {shift.remark && (
          <Typography variant="caption" sx={{ fontSize: 11, color: '#6B7280', mt: 0.2 }}>
            {shift.remark}
          </Typography>
        )}
      </Box>
    </TableCell>
  )
}
