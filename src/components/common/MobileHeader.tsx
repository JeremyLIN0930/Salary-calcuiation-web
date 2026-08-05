import React from 'react'
import { Box, Typography, IconButton, Stack, Button, Divider } from '@mui/material'
import { useAppearance } from '../../context/AppearanceContext'

interface MobileHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  primaryActionLabel?: string
  onPrimaryAction?: () => void
  onMoreAction?: () => void
  onBack?: () => void
}

export default function MobileHeader({
  title,
  subtitle,
  action,
  primaryActionLabel,
  onPrimaryAction,
  onMoreAction,
  onBack,
}: MobileHeaderProps) {
  const { tokens, effectiveTheme } = useAppearance()
  const isDark = effectiveTheme === 'dark'

  return (
    <Box
      sx={{
        display: { xs: 'block', sm: 'none' },
        px: 2,
        pt: 2,
        pb: 2,
        mb: 2,
        bgcolor: tokens.card,
        borderRadius: '24px',
        border: `1px solid ${tokens.border}`,
        boxShadow: tokens.shadow,
        transition: 'background-color 250ms ease, border-color 250ms ease',
      }}
    >
      {/* Top Header Title & Short Subtitle */}
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
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
              fontSize: '26px',
              letterSpacing: '-0.5px',
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              noWrap
              sx={{
                color: tokens.textSecondary,
                fontSize: '14px',
                fontWeight: 500,
                mt: 0.5,
                lineHeight: 1.3,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>

      <Divider sx={{ my: 1.5, borderColor: tokens.border }} />

      {/* Button Row: Primary Action + Optional ⋯ 更多 */}
      {onPrimaryAction ? (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="contained"
            onClick={onPrimaryAction}
            sx={{
              flex: 1,
              height: 48,
              borderRadius: '16px',
              fontWeight: 700,
              fontSize: '16px',
              bgcolor: '#2F80ED',
              '&:hover': { bgcolor: '#1D6FD8' },
            }}
          >
            {primaryActionLabel || '＋ 建立月份'}
          </Button>

          {onMoreAction && (
            <Button
              variant="outlined"
              onClick={onMoreAction}
              sx={{
                height: 48,
                borderRadius: '16px',
                borderColor: tokens.border,
                color: tokens.cardTextPrimary,
                fontWeight: 700,
                fontSize: '15px',
                px: 2,
                flexShrink: 0,
              }}
            >
              ⋯ 更多
            </Button>
          )}
        </Stack>
      ) : action ? (
        <Box
          sx={{
            width: '100%',
            '& .MuiButton-contained': {
              height: 48,
              px: '20px',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: 700,
              width: '100%',
            },
            '& .MuiButton-outlined': {
              height: 48,
              borderRadius: '16px',
              fontSize: '15px',
              px: '18px',
              width: '100%',
            },
          }}
        >
          {action}
        </Box>
      ) : null}
    </Box>
  )
}
