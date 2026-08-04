import React from 'react'
import { Box, Typography, Stack, useMediaQuery, useTheme } from '@mui/material'
import { useAppearance } from '../../context/AppearanceContext'
import MobileHeader from './MobileHeader'

interface Props {
  title: string
  subtitle?: string
  action?: React.ReactNode
  onBack?: () => void
}

export default function PageHeader({ title, subtitle, action, onBack }: Props) {
  const theme = useTheme()
  const isMobile = useMediaQuery('(max-width:767px)')
  const { tokens } = useAppearance()

  if (isMobile) {
    return <MobileHeader title={title} subtitle={subtitle} action={action} onBack={onBack} />
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 3.5,
        gap: 2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{
            color: tokens.textPrimary,
            fontSize: { sm: '28px', md: '32px' },
            letterSpacing: '-0.5px',
            lineHeight: 1.25,
            transition: 'color 250ms ease',
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            sx={{
              color: tokens.textSecondary,
              fontSize: { sm: '14px', md: '15px' },
              mt: 0.8,
              fontWeight: 500,
              transition: 'color 250ms ease',
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
            flexShrink: 0,
            '& > button': {
              minHeight: 48,
              borderRadius: '16px',
              px: 3,
            },
          }}
        >
          {action}
        </Stack>
      )}
    </Box>
  )
}
