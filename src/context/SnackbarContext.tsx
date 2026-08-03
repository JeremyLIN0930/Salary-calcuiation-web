import React, { createContext, useContext, useState, useCallback } from 'react'
import { Snackbar, Alert, AlertColor } from '@mui/material'

interface SnackbarContextValue {
  showSnackbar: (message: string, severity?: AlertColor) => void
}

const SnackbarCtx = createContext<SnackbarContextValue | null>(null)

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen]         = useState(false)
  const [message, setMessage]   = useState('')
  const [severity, setSeverity] = useState<AlertColor>('success')

  const showSnackbar = useCallback((msg: string, sev: AlertColor = 'success') => {
    setMessage(msg)
    setSeverity(sev)
    setOpen(true)
  }, [])

  const handleClose = () => setOpen(false)

  return (
    <SnackbarCtx.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={severity} onClose={handleClose} sx={{ borderRadius: 2, fontWeight: 600 }}>
          {message}
        </Alert>
      </Snackbar>
    </SnackbarCtx.Provider>
  )
}

export function useSnackbar() {
  const ctx = useContext(SnackbarCtx)
  if (!ctx) throw new Error('useSnackbar must be used within SnackbarProvider')
  return ctx
}
