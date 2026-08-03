import React, { useState } from 'react'
import {
  Box, Typography, Button, Card, CardContent, Grid, Stack,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, Tooltip, CircularProgress,
} from '@mui/material'
import { useSchedule } from '../../context/ScheduleContext'
import { Schedule } from '../../types/schedule'
import CreateScheduleDialog from './CreateScheduleDialog'

const AddSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6 }}>
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
)
const EditSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6 }}>
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
)
const PdfSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
  </svg>
)
const DelSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
)

interface Props {
  onSelectSchedule: (schedule: Schedule) => void
}

export default function ScheduleListPage({ onSelectSchedule }: Props) {
  const { state, dispatch } = useSchedule()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget]         = useState<Schedule | null>(null)
  const [toast, setToast]                       = useState('')
  const [exportingId, setExportingId]           = useState<string | null>(null)

  // Handle new schedule creation
  const handleCreate = (newSchedule: Schedule) => {
    dispatch({ type: 'ADD_SCHEDULE', payload: newSchedule })
    setToast('全新週排班表已建立')
    onSelectSchedule(newSchedule)
  }

  // Handle delete
  const handleDelete = () => {
    if (deleteTarget) {
      dispatch({ type: 'DELETE_SCHEDULE', payload: deleteTarget.id })
      setToast('排班表已刪除')
      setDeleteTarget(null)
    }
  }

  // Handle quick PDF export
  const handleExportPDF = async (schedule: Schedule, e: React.MouseEvent) => {
    e.stopPropagation()
    setExportingId(schedule.id)
    try {
      const { generateSchedulePDF } = await import('../../utils/schedulePdfGenerator')
      await generateSchedulePDF(schedule)
      setToast('PDF 已成功匯出下載！')
    } catch (err) {
      console.error(err)
      setToast('PDF 匯出失敗')
    } finally {
      setExportingId(null)
    }
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', px: 2, pt: 3, pb: 10 }}>
      {/* Top Banner & Main Create Action */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={900} color="primary.main">
            排班管理
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            每週排班表管理與 PDF 匯出（完全相容實體紙本格式）
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="medium"
          onClick={() => setCreateDialogOpen(true)}
          sx={{ borderRadius: 2.5, px: 2.5, py: 1, fontWeight: 700, fontSize: 15 }}
        >
          <AddSvg />
          新增本週排班
        </Button>
      </Box>

      {/* Schedule List Cards */}
      {state.schedules.length === 0 ? (
        <Card variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 4, bgcolor: '#FAFAFA' }}>
          <Typography variant="h6" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>
            目前尚無任何週排班表
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
            請點擊上方「新增本週排班」按鈕，建立第一張週班表。
          </Typography>
          <Button
            variant="contained"
            onClick={() => setCreateDialogOpen(true)}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            <AddSvg />
            新增本週排班
          </Button>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {state.schedules.map(s => (
            <Grid item xs={12} sm={6} md={4} key={s.id}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        店號 {s.storeId}
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color="text.primary">
                        {s.storeName}
                      </Typography>
                    </Box>
                    <Chip label={`${s.employees.length} 位員工`} size="small" color="primary" variant="outlined" />
                  </Box>

                  <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mb: 2 }}>
                    {s.weekStart}（一） ～ {s.weekEnd}（日）
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ pt: 1, borderTop: '1px solid #F3F4F6' }}>
                    <Button
                      variant="contained"
                      size="small"
                      fullWidth
                      onClick={() => onSelectSchedule(s)}
                      sx={{ borderRadius: 2, fontWeight: 700 }}
                    >
                      <EditSvg />
                      編輯班表
                    </Button>

                    <Tooltip title="匯出 PDF">
                      <IconButton
                        size="small"
                        color="primary"
                        disabled={exportingId === s.id}
                        onClick={e => handleExportPDF(s, e)}
                        sx={{ border: '1px solid #E5E7EB', borderRadius: 2 }}
                      >
                        {exportingId === s.id ? <CircularProgress size={16} /> : <PdfSvg />}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="刪除班表">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={e => {
                          e.stopPropagation()
                          setDeleteTarget(s)
                        }}
                        sx={{ border: '1px solid #FEE2E2', borderRadius: 2 }}
                      >
                        <DelSvg />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Dialog */}
      <CreateScheduleDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreate}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>確定刪除這張排班表？</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            刪除【{deleteTarget?.storeId} {deleteTarget?.storeName}】（{deleteTarget?.weekStart}）的排班表後無法復原。
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDeleteTarget(null)} sx={{ borderRadius: 2 }}>
            取消
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} sx={{ borderRadius: 2 }}>
            確定刪除
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={!!toast}
        autoHideDuration={2500}
        onClose={() => setToast('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={toast.includes('失敗') ? 'error' : 'success'} sx={{ borderRadius: 2 }}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  )
}
