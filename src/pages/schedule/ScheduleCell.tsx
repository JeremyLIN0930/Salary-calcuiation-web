import React from 'react'
import { TableCell, Typography, Box } from '@mui/material'
import { Shift, SHIFT_TYPE_CONFIG } from '../../types/schedule'

interface Props {
  shift?: Shift
  onClick: () => void
}

export default function ScheduleCell({ shift, onClick }: Props) {
  if (!shift) {
    return (
      <TableCell
        align="center"
        onClick={onClick}
        sx={{
          cursor: 'pointer',
          py: 1.2,
          px: 0.5,
          userSelect: 'none',
          borderRight: '1px solid #E5E7EB',
          '&:hover': { bgcolor: '#F3F4F6' },
        }}
      >
        <Typography variant="body2" color="text.disabled">—</Typography>
      </TableCell>
    )
  }

  const conf = SHIFT_TYPE_CONFIG[shift.type] || SHIFT_TYPE_CONFIG.work

  let displayText = '—'
  if (shift.type === 'work') {
    if (shift.startTime && shift.endTime) {
      displayText = `${shift.startTime}－${shift.endTime}`
    } else {
      displayText = '上班'
    }
  } else {
    displayText = conf.label
  }

  return (
    <TableCell
      align="center"
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        py: 1,
        px: 0.5,
        userSelect: 'none',
        bgcolor: conf.bg,
        borderRight: '1px solid #E5E7EB',
        transition: 'background-color 0.15s',
        '&:hover': { opacity: 0.85 },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography
          variant="body2"
          fontWeight={shift.type === 'work' ? 600 : 700}
          sx={{
            color: conf.color,
            fontSize: shift.type === 'work' ? 13 : 15,
            whiteSpace: 'nowrap',
            letterSpacing: shift.type === 'work' ? 0 : 2,
          }}
        >
          {displayText}
        </Typography>
        {shift.remark && (
          <Typography variant="caption" sx={{ fontSize: 10, color: '#6B7280', mt: 0.2 }}>
            {shift.remark}
          </Typography>
        )}
      </Box>
    </TableCell>
  )
}
