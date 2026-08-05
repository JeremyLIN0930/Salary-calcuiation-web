import React from 'react'
import { Box, Typography, Drawer, Button, Stack, CircularProgress } from '@mui/material'
import { useAppearance } from '../../context/AppearanceContext'

interface Props {
  open: boolean
  onClose: () => void
  onExportPDF: () => void
  exporting?: boolean
  disabled?: boolean
}

export default function MoreActionsBottomSheet({
  open,
  onClose,
  onExportPDF,
  exporting = false,
  disabled = false,
}: Props) {
  const { tokens, effectiveTheme } = useAppearance()
  const isDark = effectiveTheme === 'dark'

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          bgcolor: isDark ? '#1C2128' : '#FFFFFF',
          color: tokens.cardTextPrimary,
          px: 2.5,
          pt: 1.5,
          pb: 3.5,
          maxHeight: '60vh',
        },
      }}
    >
      {/* Top Grabber Pill */}
      <Box
        sx={{
          width: 36,
          height: 4,
          borderRadius: 2,
          bgcolor: isDark ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
          mx: 'auto',
          mb: 2,
        }}
      />

      <Typography variant="h6" fontWeight={800} sx={{ mb: 2, fontSize: '18px' }}>
        更多功能
      </Typography>

      <Stack spacing={1.5}>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => {
            onClose()
            onExportPDF()
          }}
          disabled={disabled || exporting}
          sx={{
            height: 52,
            borderRadius: '16px',
            borderColor: '#2F80ED',
            color: '#2F80ED',
            fontWeight: 700,
            fontSize: '16px',
            justifyContent: 'flex-start',
            px: 2.5,
          }}
        >
          {exporting ? (
            <CircularProgress size={20} sx={{ mr: 1.5 }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 10 }}>
              <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5z"/>
            </svg>
          )}
          📄 匯出全部月份 PDF
        </Button>

        <Button
          fullWidth
          variant="text"
          onClick={onClose}
          sx={{
            height: 48,
            borderRadius: '16px',
            color: tokens.cardTextMuted,
            fontWeight: 600,
            fontSize: '15px',
          }}
        >
          取消
        </Button>
      </Stack>
    </Drawer>
  )
}
