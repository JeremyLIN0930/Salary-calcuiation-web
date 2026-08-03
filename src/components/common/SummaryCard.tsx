import React from 'react'
import { Card, Typography, Box } from '@mui/material'

interface Props {
  title: string
  value: string | number
  unit?: string
  color?: 'primary' | 'error' | 'success' | 'warning' | 'indigo'
}

export default function SummaryCard({ title, value, unit, color = 'primary' }: Props) {
  if (color === 'indigo') {
    return (
      <Card variant="outlined" sx={{ borderRadius: 3, p: 2, bgcolor: '#1A237E', color: 'white' }}>
        <Typography variant="caption" fontWeight={700} sx={{ color: 'rgba(255,255,255,0.85)' }}>
          {title}
        </Typography>
        <Typography variant="h5" fontWeight={900} sx={{ mt: 0.5 }}>
          {value} {unit}
        </Typography>
      </Card>
    )
  }

  const bgMap = {
    primary: '#EFF6FF',
    error:   '#FFF1F2',
    success: '#F0FDF4',
    warning: '#FEFCE8',
  }

  const borderMap = {
    primary: '#BFDBFE',
    error:   '#FECDD3',
    success: '#BBF7D0',
    warning: '#FEF08A',
  }

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        p: 2,
        bgcolor: bgMap[color],
        borderColor: borderMap[color],
      }}
    >
      <Typography variant="caption" fontWeight={700} color={`${color}.main`}>
        {title}
      </Typography>
      <Typography variant="h5" fontWeight={900} color={`${color}.main`} sx={{ mt: 0.5 }}>
        {value} {unit}
      </Typography>
    </Card>
  )
}
