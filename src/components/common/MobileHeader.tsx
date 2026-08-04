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
        display: { xs: 'block', sm: 'none' },
        px: 2,
        pt: 2,
        pb: 1.5,
        mb: 2,
        bgcolor: tokens.card,
        borderRadius: '24px',
        border: `1px solid ${tokens.border}`,
        boxShadow: tokens.shadow,
        transition: 'background-color 250ms ease, border-color 250ms ease',
      }}
    >
      {/* ── Top Row: Left Title & Subtitle + Right Primary Button ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0, flex: 1 }}>
          {onBack && (
            <IconButton
              onClick={onBack}
              size="small"
              sx={{
                color: tokens.textPrimary,
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                borderRadius: '12px',
                p: 0.8,
                mt: 0.5,
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </IconButton>
          )}

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{
                color: tokens.textPrimary,
                fontSize: '32px',
                letterSpacing: '-0.5px',
                lineHeight: 1.2,
                wordBreak: 'break-word',
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                sx={{
                  color: tokens.textSecondary,
                  fontSize: '15px',
                  fontWeight: 500,
                  mt: 0.5,
                  lineHeight: 1.35,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
      </Box>

      {/* ── Bottom Row: Full Width Actions Container with 12px Spacing ── */}
      {action && (
        <Box
          sx={{
            mt: 1.5,
            width: '100%',
            '& > div': {
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            },
            '& .MuiButton-contained': {
              height: 52,
              px: '20px',
              borderRadius: '16px',
              fontSize: '18px',
              fontWeight: 700,
              width: '100%',
            },
            '& .MuiButton-outlined': {
              height: 48,
              borderRadius: '16px',
              fontSize: '17px',
              px: '18px',
              width: '100%',
            },
          }}
        >
          {action}
        </Box>
      )}
    </Box>
  )
}
