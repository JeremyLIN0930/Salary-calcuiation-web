import React from 'react'
import { Card, Typography, Button } from '@mui/material'

interface Props {
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ title, subtitle, actionLabel, onAction }: Props) {
  return (
    <Card variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 4, bgcolor: '#FAFAFA' }}>
      <Typography variant="h6" fontWeight={800} color="text.secondary" sx={{ mb: 1 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
          {subtitle}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}>
          {actionLabel}
        </Button>
      )}
    </Card>
  )
}
