import React from 'react'
import { Box, Typography, Stack } from '@mui/material'

interface Props {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
      <Box>
        <Typography variant="h4" fontWeight={900} color="primary.main">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && (
        <Stack direction="row" spacing={1.5} alignItems="center">
          {action}
        </Stack>
      )}
    </Box>
  )
}
