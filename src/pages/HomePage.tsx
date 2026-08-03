import React, { useState, useMemo } from 'react'
import {
  Box, Button, Typography, Card, CardContent,
  Stack, Divider, Chip, IconButton, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions,
  TextField, InputAdornment, Grid, CircularProgress,
} from '@mui/material'
import { useEmployees } from '../context/EmployeeContext'
import { useSnackbar } from '../context/SnackbarContext'
import { Employee } from '../types/employee'
import { PDFService } from '../services/pdfService'
import PageHeader from '../components/common/PageHeader'
import PageContainer from '../components/common/PageContainer'
import EmptyState from '../components/common/EmptyState'
import ConfirmDialog from '../components/common/ConfirmDialog'

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
const SearchSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
)

interface Props {
  onAddEmployee: () => void
  onEditEmployee: (emp: Employee) => void
}

export default function HomePage({ onAddEmployee, onEditEmployee }: Props) {
  const { state, dispatch } = useEmployees()
  const { showSnackbar } = useSnackbar()

  const [search, setSearch]             = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [exporting, setExporting]       = useState(false)

  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return state.employees
    const q = search.trim().toLowerCase()
    return state.employees.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.month.toLowerCase().includes(q) ||
      e.store.toLowerCase().includes(q)
    )
  }, [state.employees, search])

  const handleCopy = (emp: Employee) => {
    const copied: Employee = {
      ...emp,
      id: Math.random().toString(36).slice(2),
      name: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    dispatch({ type: 'ADD', payload: copied })
    showSnackbar(`已複製「${emp.name || '員工'}」的薪資範本！`, 'info')
    onEditEmployee(copied)
  }

  const handleExport = async () => {
    if (state.employees.length === 0) return
    setExporting(true)
    try {
      await PDFService.exportPayroll(state.employees)
      showSnackbar('全體薪資單 PDF 已成功匯出下載！', 'success')
    } catch (err) {
      console.error('PDF export error:', err)
      showSnackbar('PDF 產生失敗，請重試。', 'error')
    } finally {
      setExporting(false)
    }
  }

  const totalNet = state.employees.reduce((s, e) => s + (e.netSalary ?? 0), 0)

  return (
    <PageContainer>
      {/* ── Page Header ── */}
      <PageHeader
        title="💰 薪資管理"
        subtitle="建立、管理與匯出員工薪資資料。"
        action={
          <>
            <Button
              variant="outlined"
              size="medium"
              disabled={state.employees.length === 0 || exporting}
              onClick={handleExport}
              sx={{ borderRadius: 2.5, px: 2, fontWeight: 700 }}
            >
              {exporting ? <CircularProgress size={18} sx={{ mr: 1 }} /> : <PdfSvg />}
              匯出全部 PDF
            </Button>

            <Button
              variant="contained"
              size="medium"
              onClick={onAddEmployee}
              sx={{ borderRadius: 2.5, px: 2.5, fontWeight: 700, fontSize: 15 }}
            >
              <AddSvg />
              新增薪資
            </Button>
          </>
        }
      />

      {/* ── Summary & Search Bar ── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} alignItems="center" justifyContent="space-between">
        <TextField
          placeholder="搜尋員工姓名、月份、門市..."
          value={search}
          size="small"
          fullWidth
          sx={{ maxWidth: { sm: 360 }, bgcolor: 'white', borderRadius: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchSvg />
              </InputAdornment>
            ),
          }}
          onChange={e => setSearch(e.target.value)}
        />

        {state.employees.length > 0 && (
          <Stack direction="row" spacing={2}>
            <Chip
              label={`總共 ${state.employees.length} 筆薪資`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700, py: 2 }}
            />
            <Chip
              label={`總實發：$ ${totalNet.toLocaleString('zh-TW')}`}
              color="success"
              sx={{ fontWeight: 700, py: 2, color: 'white' }}
            />
          </Stack>
        )}
      </Stack>

      {/* ── Employee Salary List ── */}
      {state.employees.length === 0 ? (
        <EmptyState
          title="目前沒有薪資資料"
          subtitle="點擊「新增薪資」按鈕，建立第一筆員工薪資。"
          actionLabel="新增薪資"
          onAction={onAddEmployee}
        />
      ) : filteredEmployees.length === 0 ? (
        <EmptyState
          title={`找不到符合「${search}」的薪資資料`}
        />
      ) : (
        <Grid container spacing={2}>
          {filteredEmployees.map(emp => (
            <Grid item xs={12} key={emp.id}>
              <EmployeeSalaryCard
                employee={emp}
                onEdit={() => onEditEmployee(emp)}
                onCopy={() => handleCopy(emp)}
                onDelete={() => setDeleteTarget(emp)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="確定刪除此薪資資料？"
        content={`即將刪除「${deleteTarget?.name || '未命名'}」${deleteTarget?.month} 的薪資資料，刪除後無法復原。`}
        confirmText="確定刪除"
        confirmColor="error"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            dispatch({ type: 'DELETE', payload: deleteTarget.id })
            showSnackbar(`已刪除「${deleteTarget.name}」的薪資資料`, 'info')
          }
          setDeleteTarget(null)
        }}
      />
    </PageContainer>
  )
}

// ── Salary Card Component ──
function EmployeeSalaryCard({ employee, onEdit, onCopy, onDelete }: {
  employee: Employee; onEdit: () => void; onCopy: () => void; onDelete: () => void
}) {
  const monthDisplay = employee.month
    ? employee.month.replace('-', ' 年 ') + ' 月'
    : '—'

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 4,
        p: 1,
        transition: 'all 0.15s',
        '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
          {/* Employee Avatar & Name Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                bgcolor: 'primary.main',
                borderRadius: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 900,
                fontSize: 18,
              }}
            >
              {employee.name ? employee.name.charAt(0) : '?'}
            </Box>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                  {employee.name || '（未命名）'}
                </Typography>
                {employee.store && (
                  <Chip label={employee.store} size="small" variant="outlined" color="primary" sx={{ height: 22, fontWeight: 700 }} />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {monthDisplay} {employee.hireDate ? ` · 到職：${employee.hireDate}` : ''}
              </Typography>
            </Box>
          </Box>

          {/* Action Icons */}
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="編輯薪資">
              <IconButton size="small" onClick={onEdit} sx={{ color: 'primary.main' }}>
                <EditSvg />
              </IconButton>
            </Tooltip>
            <Tooltip title="複製員工">
              <IconButton size="small" onClick={onCopy} sx={{ color: 'text.secondary' }}>
                <CopySvg />
              </IconButton>
            </Tooltip>
            <Tooltip title="刪除薪資">
              <IconButton size="small" onClick={onDelete} sx={{ color: 'error.main' }}>
                <DelSvg />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Salary Figures */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary" display="block">
              應發薪資
            </Typography>
            <Typography variant="body1" fontWeight={700}>
              $ {(employee.grossSalary ?? 0).toLocaleString('zh-TW')}
            </Typography>
          </Grid>

          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary" display="block">
              代扣合計
            </Typography>
            <Typography variant="body1" fontWeight={700} color="error.main">
              − $ {(employee.totalDeductions ?? 0).toLocaleString('zh-TW')}
            </Typography>
          </Grid>

          <Grid item xs={4} sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              實發金額
            </Typography>
            <Typography variant="subtitle1" fontWeight={900} color="success.main">
              $ {(employee.netSalary ?? 0).toLocaleString('zh-TW')}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
