import React from 'react'
import { Box, Typography, IconButton, Stack } from '@mui/material'
import { useAppearance } from '../../context/AppearanceContext'

interface MobileHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  onBack?: () => void
}

export default function MobileHeader({ title, subtitle, action, onBack }: MobileHeaderProps) {
  const { tokens, effectiveTheme } = useAppearance()
  const isDark = effectiveTheme === 'dark'

  return (
    <Box
      sx={{
        display: { xs: 'flex', sm: 'none' },
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        maxHeight: 88,
        minHeight: 64,
        bgcolor: tokens.header,
        borderBottom: `1px solid ${tokens.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backdropFilter: 'blur(12px)',
        transition: 'background-color 250ms ease, border-color 250ms ease',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
        {onBack && (
          <IconButton
            onClick={onBack}
            size="small"
            sx={{
              color: tokens.textPrimary,
              bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              borderRadius: '12px',
              p: 1,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </IconButton>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h6"
            fontWeight={800}
            noWrap
            sx={{
              color: tokens.textPrimary,
              fontSize: '18px',
              letterSpacing: '-0.3px',
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: tokens.textSecondary,
                fontSize: '12px',
                fontWeight: 500,
                display: 'block',
                mt: 0.2,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>

      {action && (
        <Box sx={{ flexShrink: 0, ml: 1 }}>
          {action}
        </Box>
      )}
    </Box>
  )
}
