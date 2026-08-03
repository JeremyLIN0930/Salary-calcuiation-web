import React from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, CircularProgress,
} from '@mui/material'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  onConfirmDownload: () => Promise<void>
  loading?: boolean
  children?: React.ReactNode
}

export default function PDFPreviewModal({
  open, title, onClose, onConfirmDownload, loading, children,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 4, minHeight: 450 } }}
    >
      <DialogTitle fontWeight={800}>
        {title} — 檔案預覽
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: '#F8F9FA', p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {children ? (
          <Box sx={{ width: '100%', overflow: 'auto', bgcolor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: 2, p: 2 }}>
            {children}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>
              📄 準備匯出 {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              格式為標準 A4 尺寸，點擊下方「下載 PDF / 直接列印」即可儲存檔案。
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} disabled={loading} sx={{ borderRadius: 2.5 }}>
          取消
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={loading}
          onClick={onConfirmDownload}
          sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}
        >
          {loading ? <CircularProgress size={20} sx={{ mr: 1, color: '#fff' }} /> : '下載 PDF / 列印'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
