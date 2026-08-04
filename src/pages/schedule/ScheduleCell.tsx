import React from 'react'
import { TableCell, Typography, Box } from '@mui/material'
import { Shift, SHIFT_TYPE_CONFIG } from '../../types/schedule'

interface Props {
  shift?: Shift
  onClick: () => void
}

/** Helper to format time for work shifts (e.g. 07:00 ~ 15:00 -> 7~15, 8 小時) */
function formatWorkTime(startTime?: string, endTime?: string) {
  if (!startTime || !endTime) return { timeStr: '上班', durationStr: '' }
  const s = startTime.trim().slice(0, 5)
  const e = endTime.trim().slice(0, 5)

  const [sH, sM] = s.split(':').map(n => parseInt(n, 10))
  const [eH, eM] = e.split(':').map(n => parseInt(n, 10))

  let durationHours = 0
  if (!isNaN(sH) && !isNaN(eH)) {
    const startMin = sH * 60 + (sM || 0)
    const endMin = (eH < sH ? eH + 24 : eH) * 60 + (eM || 0)
    durationHours = Math.max(0, Math.round((endMin - startMin) / 60 * 10) / 10)
  }

  const durationStr = durationHours > 0 ? `${durationHours} 小時` : ''

  // If both minutes are 00, abbreviate 07:00 -> 7, 15:00 -> 15
  if (sM === 0 && eM === 0) {
    return {
      timeStr: `${sH}~${eH}`,
      durationStr
    }
  }

  return {
    timeStr: `${s}~${e}`,
    durationStr
  }
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
          py: 1,
          px: 0.5,
          userSelect: 'none',
          bgcolor: '#FAFBFD',
          borderRight: '1px solid #F1F5F9',
          borderBottom: '1px solid #F1F5F9',
          transition: 'all 150ms ease',
          '&:hover': { bgcolor: '#EBF3FE' },
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            bgcolor: '#F1F5F9',
            color: '#94A3B8',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 500,
          }}
        >
          ＋
        </Box>
      </TableCell>
    )
  }

  const conf = SHIFT_TYPE_CONFIG[shift.type]

  if (shift.type === 'work') {
    const { timeStr, durationStr } = formatWorkTime(shift.startTime, shift.endTime)
    return (
      <TableCell
        align="center"
        onClick={onClick}
        sx={{
          cursor: 'pointer',
          py: 0.8,
          px: 0.5,
          userSelect: 'none',
          borderRight: '1px solid #F1F5F9',
          borderBottom: '1px solid #F1F5F9',
          transition: 'all 150ms ease',
          '&:hover': { opacity: 0.85 },
        }}
      >
        <Box
          sx={{
            bgcolor: '#EBF3FE',
            color: '#2F80ED',
            borderRadius: '12px',
            py: 0.8,
            px: 0.5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 48,
          }}
        >
          <Typography variant="body2" fontWeight={700} sx={{ fontSize: '13px', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
            {timeStr}
          </Typography>
          {durationStr && (
            <Typography variant="caption" sx={{ fontSize: '10px', color: '#64748B', mt: 0.2 }}>
              {durationStr}
            </Typography>
          )}
          {shift.remark && (
            <Typography variant="caption" sx={{ fontSize: '10px', color: '#475569', mt: 0.2, fontWeight: 600 }}>
              {shift.remark}
            </Typography>
          )}
        </Box>
      </TableCell>
    )
  }

  // Off / Leave / Other Types
  const isOff = shift.type === 'off'
  const bgColor = isOff ? '#F1F5F9' : (conf ? conf.bg : '#F1F5F9')
  const textColor = isOff ? '#64748B' : (conf ? conf.color : '#334155')

  return (
    <TableCell
      align="center"
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        py: 0.8,
        px: 0.5,
        userSelect: 'none',
        borderRight: '1px solid #F1F5F9',
        borderBottom: '1px solid #F1F5F9',
        transition: 'all 150ms ease',
        '&:hover': { opacity: 0.85 },
      }}
    >
      <Box
        sx={{
          bgcolor: bgColor,
          color: textColor,
          borderRadius: '12px',
          py: 0.8,
          px: 0.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
        }}
      >
        <Typography variant="body2" fontWeight={700} sx={{ fontSize: '14px', lineHeight: 1.2 }}>
          {conf ? conf.label : '休'}
        </Typography>
        {shift.remark && (
          <Typography variant="caption" sx={{ fontSize: '10px', opacity: 0.8, mt: 0.2 }}>
            {shift.remark}
          </Typography>
        )}
      </Box>
    </TableCell>
  )
}
