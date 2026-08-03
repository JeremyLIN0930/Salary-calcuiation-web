import React from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button,
} from '@mui/material'

interface Props {
  open: boolean
  title: string
  content: string
  confirmText?: string
  confirmColor?: 'primary' | 'error' | 'success'
  onClose: () => void
  onConfirm: () => void
}

export default function ConfirmDialog({
  open, title, content, confirmText = '確定', confirmColor = 'primary', onClose, onConfirm,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { borderRadius: 3, minWidth: 320 } }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{content}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 2 }}>
          取消
        </Button>
        <Button variant="contained" color={confirmColor} onClick={onConfirm} sx={{ borderRadius: 2 }}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
