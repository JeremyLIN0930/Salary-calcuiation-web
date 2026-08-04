import React from 'react'
import { Box, Typography, Stack } from '@mui/material'

interface Props {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        mb: 3.5,
        gap: 2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{
            color: '#1E293B',
            fontSize: { xs: '24px', sm: '28px', md: '32px' },
            letterSpacing: '-0.5px',
            lineHeight: 1.25,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            sx={{
              color: '#6B7280',
              fontSize: { xs: '13px', sm: '14px', md: '15px' },
              mt: 0.8,
              fontWeight: 500,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {action && (
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'stretch', sm: 'flex-end' },
            '& > button': {
              minHeight: 48,
              borderRadius: '16px',
            },
          }}
        >
          {action}
        </Stack>
      )}
    </Box>
  )
}
