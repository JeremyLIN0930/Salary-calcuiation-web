import React, { useState } from 'react'
import {
  Box, Button, Typography, Card, CardContent,
  Stack, Divider, Chip, IconButton, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material'
import { useEmployees } from '../context/EmployeeContext'
import { Employee } from '../types/employee'

// Inline SVG icons — zero external icon dependency
const AddSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6 }}>
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
)
const PdfSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6 }}>
    <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
  </svg>
)
const EditSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
)
const CopySvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
  </svg>
)
const DelSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
)

interface Props {
  onAddEmployee: () => void
  onEditEmployee: (emp: Employee) => void
}

export default function HomePage({ onAddEmployee, onEditEmployee }: Props) {
  const { state, dispatch } = useEmployees()
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [exporting, setExporting] = useState(false)

  const handleCopy = (emp: Employee) => {
    const copied: Employee = { ...emp, id: Math.random().toString(36).slice(2), name: '' }
    dispatch({ type: 'ADD', payload: copied })
    onEditEmployee(copied)
  }

  const handleExport = async () => {
    if (state.employees.length === 0) return
    setExporting(true)
    try {
      const { generatePayrollPDF } = await import('../utils/pdfGenerator')
      await generatePayrollPDF(state.employees)
    } catch (err) {
      console.error('PDF export error:', err)
      alert('PDF 產生失敗，請重試。')
    } finally {
      setExporting(false)
    }
  }

  const totalNet = state.employees.reduce((s, e) => s + (e.netSalary ?? 0), 0)

  return (
    <Box sx={{ bgcolor: '#f5f6fa', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
        px: 3, pt: 5, pb: 3.5,
      }}>
        <Typography variant="h5" fontWeight={900} sx={{ color: 'white', letterSpacing: 2, mb: 0.5 }}>
          薪資計算系統
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mb: 2.5 }}>
          員工薪資計算暨薪資單產生
        </Typography>
        {state.employees.length > 0 && (
          <Stack direction="row" spacing={2}>
            <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 2, py: 1 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>員工人數</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: 'white' }}>{state.employees.length}</Typography>
            </Box>
            <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 2, py: 1 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>總實發金額</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: 'white' }}>
                $ {totalNet.toLocaleString('zh-TW')}
              </Typography>
            </Box>
          </Stack>
        )}
      </Box>

      {/* Main Content */}
      <Box sx={{ maxWidth: 720, mx: 'auto', px: 2, py: 2.5 }}>
        {/* Action Buttons */}
        <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
          <Button variant="contained" fullWidth onClick={onAddEmployee}
            sx={{ borderRadius: 2.5, py: 1.4, fontWeight: 700, fontSize: 15, boxShadow: '0 4px 12px rgba(21,101,192,0.3)' }}>
            <AddSvg /> 新增員工
          </Button>
          <Button variant="outlined" fullWidth onClick={handleExport}
            disabled={state.employees.length === 0 || exporting}
            sx={{ borderRadius: 2.5, py: 1.4, fontWeight: 700, fontSize: 15, borderWidth: 1.5 }}>
            <PdfSvg /> {exporting ? '產生中...' : '匯出全部 PDF'}
          </Button>
        </Stack>

        {/* Empty State */}
        {state.employees.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography sx={{ fontSize: 64, mb: 2 }}>👥</Typography>
            <Typography variant="h6" fontWeight={600} color="text.secondary" mb={1}>
              尚無員工資料
            </Typography>
            <Typography variant="body2" color="text.disabled" mb={3}>
              點擊「新增員工」開始建立薪資單
            </Typography>
            <Button variant="contained" onClick={onAddEmployee} sx={{ borderRadius: 2, px: 4 }}>
              <AddSvg /> 新增第一位員工
            </Button>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {state.employees.map(emp => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                onEdit={() => onEditEmployee(emp)}
                onCopy={() => handleCopy(emp)}
                onDelete={() => setDeleteTarget(emp)}
              />
            ))}
          </Stack>
        )}
      </Box>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        PaperProps={{ sx: { borderRadius: 3, minWidth: 280 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>確定刪除此員工？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            即將刪除「{deleteTarget?.name ?? ''}」的薪資資料，此動作無法復原。
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDeleteTarget(null)} sx={{ borderRadius: 2 }}>取消</Button>
          <Button variant="contained" color="error" sx={{ borderRadius: 2 }}
            onClick={() => {
              if (deleteTarget) dispatch({ type: 'DELETE', payload: deleteTarget.id })
              setDeleteTarget(null)
            }}>
            刪除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// Employee Card
function EmployeeCard({ employee, onEdit, onCopy, onDelete }: {
  employee: Employee; onEdit: () => void; onCopy: () => void; onDelete: () => void
}) {
  const monthDisplay = employee.month
    ? employee.month.replace('-', ' 年 ') + ' 月'
    : '—'

  return (
    <Card elevation={0} sx={{
      borderRadius: 3, border: '1px solid', borderColor: 'divider',
      transition: 'all 0.2s',
      '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)', transform: 'translateY(-1px)' },
    }}>
      <CardContent sx={{ pb: '12px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
          {/* Avatar */}
          <Box sx={{
            width: 44, height: 44, bgcolor: 'primary.main', borderRadius: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5, flexShrink: 0,
          }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: 'white' }}>
              {employee.name ? employee.name.charAt(0) : '?'}
            </Typography>
          </Box>

          {/* Info */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
              <Typography variant="subtitle1" fontWeight={700} noWrap>{employee.name || '（未命名）'}</Typography>
              {employee.department && <Chip label={employee.department} size="small" sx={{ height: 20, fontSize: 11 }} />}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {monthDisplay}{employee.jobTitle ? ` · ${employee.jobTitle}` : ''}
            </Typography>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', ml: 0.5 }}>
            <Tooltip title="編輯"><IconButton size="small" onClick={onEdit} sx={{ color: 'primary.main' }}><EditSvg /></IconButton></Tooltip>
            <Tooltip title="複製此員工"><IconButton size="small" onClick={onCopy} sx={{ color: 'text.secondary' }}><CopySvg /></IconButton></Tooltip>
            <Tooltip title="刪除"><IconButton size="small" onClick={onDelete} sx={{ color: 'error.main' }}><DelSvg /></IconButton></Tooltip>
          </Box>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">應發薪資</Typography>
            <Typography variant="body2" fontWeight={600}>
              $ {(employee.grossSalary ?? 0).toLocaleString('zh-TW')}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">代扣合計</Typography>
            <Typography variant="body2" fontWeight={600} color="error.main">
              − $ {(employee.totalDeductions ?? 0).toLocaleString('zh-TW')}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">實發金額</Typography>
            <Typography variant="subtitle2" fontWeight={800} color="primary.main">
              $ {(employee.netSalary ?? 0).toLocaleString('zh-TW')}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
