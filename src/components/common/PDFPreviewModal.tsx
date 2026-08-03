import React from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, CircularProgress, Alert, Stack,
} from '@mui/material'

interface Props {
  open: boolean
  title: string
  pdfUrl?: string | null
  pdfError?: string | null
  loading?: boolean
  onClose: () => void
  onConfirmDownload: () => void | Promise<void>
  children?: React.ReactNode
}

export default function PDFPreviewModal({
  open, title, pdfUrl, pdfError, loading, onClose, onConfirmDownload, children,
}: Props) {
  React.useEffect(() => {
    if (open) {
      console.log('[PDF Preview Debug] Modal Opened. pdfUrl:', pdfUrl, 'loading:', loading, 'error:', pdfError)
    }
  }, [open, pdfUrl, loading, pdfError])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: 4,
          minHeight: 580,
          maxHeight: '90vh',
          width: { xs: '95%', sm: '90%', md: '85%' },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={800}>
          📄 {title} — PDF 預覽
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: '#F3F4F6', p: { xs: 1, sm: 2 }, display: 'flex', flexDirection: 'column', height: 540 }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 8 }}>
            <CircularProgress size={44} sx={{ mb: 2 }} />
            <Typography variant="body1" fontWeight={700} color="text.secondary">
              正在產生 PDF 預覽，請稍候...
            </Typography>
          </Box>
        ) : pdfError ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
            <Alert severity="error" sx={{ borderRadius: 3, maxWidth: 500, width: '100%', mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={800}>
                PDF 預覽失敗，請重新產生。
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {pdfError}
              </Typography>
            </Alert>
          </Box>
        ) : pdfUrl ? (
          <Box sx={{ width: '100%', height: '100%', borderRadius: 2, overflow: 'hidden', bgcolor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
            <iframe
              src={pdfUrl}
              title={title}
              width="100%"
              height="100%"
              style={{ border: 'none', display: 'block' }}
            />
          </Box>
        ) : children ? (
          <Box sx={{ width: '100%', height: '100%', overflow: 'auto', bgcolor: '#fff', borderRadius: 2, p: 2 }}>
            {children}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 6 }}>
            <Typography variant="h6" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>
              📄 準備匯出 {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              點擊下方「下載 PDF / 直接列印」即可儲存檔案。
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1, justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
          💡 支援放大、縮小、滾動瀏覽與直接列印
        </Typography>

        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" onClick={onClose} disabled={loading} sx={{ borderRadius: 2.5, px: 2.5 }}>
            關閉
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={loading || !!pdfError}
            onClick={onConfirmDownload}
            sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : '下載 PDF / 列印'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  )
}
