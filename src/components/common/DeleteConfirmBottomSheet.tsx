import React from 'react'
import {
  Drawer, Dialog, Box, Typography, Button, Stack, useMediaQuery, useTheme
} from '@mui/material'
import { useAppearance } from '../../context/AppearanceContext'

interface Props {
  open: boolean
  title?: string
  monthLabel?: string
  employeeCount?: number
  warningText?: string
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteConfirmBottomSheet({
  open,
  title = '確認刪除？',
  monthLabel,
  employeeCount,
  warningText = '所有資料將永久刪除。',
  onClose,
  onConfirm,
}: Props) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { tokens, effectiveTheme } = useAppearance()
  const isDark = effectiveTheme === 'dark'

  const content = (
    <Box sx={{ p: 3, pt: isMobile ? 2 : 3 }}>
      {/* Mobile grabber bar */}
      {isMobile && (
        <Box
          sx={{
            width: 40,
            height: 4,
            bgcolor: isDark ? '#475569' : '#CBD5E1',
            borderRadius: 2,
            mx: 'auto',
            mb: 2.5,
          }}
        />
      )}

      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" fontWeight={800} sx={{ color: tokens.textPrimary, fontSize: 20 }}>
            {title}
          </Typography>
          {monthLabel && (
            <Typography variant="body1" fontWeight={700} sx={{ color: tokens.primary, mt: 1, fontSize: 16 }}>
              月份：{monthLabel}
            </Typography>
          )}
          {typeof employeeCount === 'number' && (
            <Typography variant="body2" sx={{ color: tokens.textSecondary, mt: 0.5, fontSize: 14 }}>
              共包含：{employeeCount} 位員工資料
            </Typography>
          )}
          <Typography variant="caption" sx={{ color: tokens.danger, mt: 1, display: 'block', fontWeight: 600, fontSize: 13 }}>
            ⚠️ {warningText}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onClose}
            sx={{
              height: 48,
              borderRadius: '16px',
              fontWeight: 700,
              borderColor: tokens.border,
              color: tokens.textPrimary,
              bgcolor: tokens.secondaryBtnBg,
            }}
          >
            取消
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            sx={{
              height: 48,
              borderRadius: '16px',
              fontWeight: 700,
              bgcolor: tokens.danger,
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            }}
          >
            刪除
          </Button>
        </Stack>
      </Stack>
    </Box>
  )

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            bgcolor: isDark ? '#23272F' : '#FFFFFF',
            backgroundImage: 'none',
          },
        }}
      >
        {content}
      </Drawer>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 6,
          bgcolor: isDark ? '#23272F' : '#FFFFFF',
          width: '100%',
          maxWidth: 420,
        },
      }}
    >
      {content}
    </Dialog>
  )
}
