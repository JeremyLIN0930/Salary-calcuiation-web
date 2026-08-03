import React, { useState, useMemo } from 'react'
import {
  Box, Button, Typography, Card, CardContent,
  Stack, Divider, Chip, IconButton, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions,
  TextField, InputAdornment, Grid, CircularProgress, Checkbox,
  FormControl, InputLabel, Select, MenuItem, Alert,
} from '@mui/material'
import { useEmployees } from '../context/EmployeeContext'
import { useSnackbar } from '../context/SnackbarContext'
import { Employee, createEmptyEmployee } from '../types/employee'
import { PDFService } from '../services/pdfService'
import PageHeader from '../components/common/PageHeader'
import PageContainer from '../components/common/PageContainer'
import EmptyState from '../components/common/EmptyState'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { groupSalariesByMonth, MonthGroup } from '../utils/salaryMigration'

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
const ArrowBackSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
  </svg>
)

interface Props {
  onAddEmployee: () => void
  onEditEmployee: (emp: Employee) => void
}

export default function HomePage({ onAddEmployee, onEditEmployee }: Props) {
  const { state, dispatch } = useEmployees()
  const { showSnackbar } = useSnackbar()

  // Navigation View State: 'MONTH_LIST' | 'MONTH_DETAIL'
  const [activeMonthKey, setActiveMonthKey] = useState<string | null>(null)

  // Local Search & Selection State
  const [search, setSearch]                 = useState('')
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget]     = useState<Employee | null>(null)
  const [deleteMonthKey, setDeleteMonthKey] = useState<string | null>(null)
  const [exporting, setExporting]           = useState(false)

  // Create Month Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const currentYear = new Date().getFullYear()
  const currentMonthNum = new Date().getMonth() + 1
  const [inputYear, setInputYear]             = useState<number>(currentYear)
  const [inputMonth, setInputMonth]           = useState<number>(currentMonthNum)
  const [copyPrevConfirmOpen, setCopyPrevConfirmOpen] = useState(false)
  const [targetMonthToCreate, setTargetMonthToCreate] = useState<string | null>(null)
  const [prevMonthToCopyFrom, setPrevMonthToCopyFrom] = useState<string | null>(null)

  // Group salaries by month (Migration included)
  const monthGroups = useMemo(() => {
    return groupSalariesByMonth(state.employees)
  }, [state.employees])

  // Active month group when in detail view
  const activeMonthGroup = useMemo(() => {
    if (!activeMonthKey) return null
    return monthGroups.find(g => g.monthKey === activeMonthKey) || null
  }, [monthGroups, activeMonthKey])

  // Filtered employees inside detail view
  const filteredEmployeesInMonth = useMemo(() => {
    if (!activeMonthGroup) return []
    if (!search.trim()) return activeMonthGroup.employees
    const q = search.trim().toLowerCase()
    return activeMonthGroup.employees.filter(e =>
      e.name.toLowerCase().includes(q) ||
      (e.store && e.store.toLowerCase().includes(q))
    )
  }, [activeMonthGroup, search])

  // ── Handlers: Create Month ──────────────────────────────────────────────────

  const handleOpenCreateModal = () => {
    setInputYear(new Date().getFullYear())
    setInputMonth(new Date().getMonth() + 1)
    setCreateModalOpen(true)
  }

  const handleProcessCreateMonth = () => {
    const formattedMonth = `${inputYear}-${String(inputMonth).padStart(2, '0')}`

    // Check if month already exists
    const exists = monthGroups.some(g => g.monthKey === formattedMonth)
    if (exists) {
      showSnackbar(`「${inputYear} 年 ${String(inputMonth).padStart(2, '0')} 月已存在。」`, 'warning')
      return
    }

    // Find closest previous month
    const previousMonths = monthGroups.filter(g => g.monthKey < formattedMonth)
    const closestPrevMonth = previousMonths.length > 0 ? previousMonths[0] : null

    setCreateModalOpen(false)

    if (closestPrevMonth && closestPrevMonth.employees.length > 0) {
      setTargetMonthToCreate(formattedMonth)
      setPrevMonthToCopyFrom(closestPrevMonth.monthKey)
      setCopyPrevConfirmOpen(true)
    } else {
      // Create empty month directly & navigate
      setActiveMonthKey(formattedMonth)
      showSnackbar(`已成功建立「${inputYear} 年 ${String(inputMonth).padStart(2, '0')} 月」！`, 'success')
    }
  }

  // Answer for Copy Prev Month Dialog
  const handleConfirmCopyPrevMonth = (shouldCopy: boolean) => {
    if (!targetMonthToCreate) return

    if (shouldCopy && prevMonthToCopyFrom) {
      const prevGroup = monthGroups.find(g => g.monthKey === prevMonthToCopyFrom)
      if (prevGroup && prevGroup.employees.length > 0) {
        // Copy employees list with zeroed salary amounts
        prevGroup.employees.forEach(prevEmp => {
          const emptyEmp: Employee = {
            ...createEmptyEmployee(),
            id: Math.random().toString(36).slice(2),
            name: prevEmp.name,
            store: prevEmp.store,
            hireDate: prevEmp.hireDate || '',
            payDate: prevEmp.payDate || '',
            month: targetMonthToCreate,
            // Keep all financial numbers 0 or blank
            baseSalary: 0,
            mealAllowance: 0,
            positionAllowance: 0,
            otherAllowance: 0,
            nightAllowance: 0,
            bonusItems: 0,
            profitSharing: 0,
            otherAdditions: 0,
            specialLeaveAllowance: 0,
            weekdayOT: 0,
            restDayOT: 0,
            holidayOT: 0,
            sickLeaveDeduction: 0,
            grossSalary: 0,
            laborInsurance: 0,
            healthInsurance: 0,
            laborPension: 0,
            incomeTax: 0,
            otherDeductions: 0,
            totalDeductions: 0,
            companyPensionContribution: 0,
            monthlyPensionContribution: 0,
            netSalary: 0,
            remark: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          dispatch({ type: 'ADD', payload: emptyEmp })
        })
        showSnackbar(`已成功建立 ${targetMonthToCreate} 並複製上個月 ${prevGroup.employees.length} 位員工資料（薪資保持空白）！`, 'success')
      }
    } else {
      showSnackbar(`已建立 ${targetMonthToCreate} 空白月份！`, 'success')
    }

    setActiveMonthKey(targetMonthToCreate)
    setCopyPrevConfirmOpen(false)
    setTargetMonthToCreate(null)
    setPrevMonthToCopyFrom(null)
  }

  // ── Handlers: PDF Export ────────────────────────────────────────────────────

  // ① Single employee PDF
  const handleExportSingleEmpPDF = async (emp: Employee) => {
    setExporting(true)
    try {
      await PDFService.exportPayroll([emp], 'single', emp.month)
      showSnackbar(`已成功匯出「${emp.name}」的薪資單 PDF！`, 'success')
    } catch (err) {
      console.error(err)
      showSnackbar('PDF 產生失敗，請重試。', 'error')
    } finally {
      setExporting(false)
    }
  }

  // ② Multi-selected employees PDF
  const handleExportSelectedPDF = async () => {
    if (selectedEmpIds.length === 0) return
    const selectedEmps = state.employees.filter(e => selectedEmpIds.includes(e.id))
    setExporting(true)
    try {
      await PDFService.exportPayroll(selectedEmps, 'multi', activeMonthKey || undefined)
      showSnackbar(`已成功匯出勾選的 ${selectedEmps.length} 位員工薪資單 PDF！`, 'success')
    } catch (err) {
      console.error(err)
      showSnackbar('PDF 產生失敗，請重試。', 'error')
    } finally {
      setExporting(false)
    }
  }

  // ③ Entire Month PDF (Each emp 1 page)
  const handleExportMonthPDF = async (monthGroup: MonthGroup) => {
    if (monthGroup.employees.length === 0) {
      showSnackbar('該月份尚無員工資料，無法匯出 PDF。', 'warning')
      return
    }
    setExporting(true)
    try {
      await PDFService.exportPayroll(monthGroup.employees, 'month', monthGroup.monthKey)
      showSnackbar(`已成功匯出「${monthGroup.displayTitle}」全體 ${monthGroup.employees.length} 位員工薪資單 PDF！`, 'success')
    } catch (err) {
      console.error(err)
      showSnackbar('PDF 產生失敗，請重試。', 'error')
    } finally {
      setExporting(false)
    }
  }

  // ④ All Months PDF (Sorted)
  const handleExportAllMonthsPDF = async () => {
    if (state.employees.length === 0) {
      showSnackbar('系統尚無薪資資料可供匯出。', 'warning')
      return
    }
    setExporting(true)
    try {
      // Sort employees by month descending
      const sorted = [...state.employees].sort((a, b) => b.month.localeCompare(a.month))
      await PDFService.exportPayroll(sorted, 'all')
      showSnackbar(`已成功匯出所有月份（共 ${sorted.length} 筆）薪資單 PDF！`, 'success')
    } catch (err) {
      console.error(err)
      showSnackbar('PDF 產生失敗，請重試。', 'error')
    } finally {
      setExporting(false)
    }
  }

  // ── Handlers: Delete Month & Single Record ─────────────────────────────────

  const handleConfirmDeleteMonth = () => {
    if (!deleteMonthKey) return
    const group = monthGroups.find(g => g.monthKey === deleteMonthKey)
    if (group) {
      group.employees.forEach(emp => {
        dispatch({ type: 'DELETE', payload: emp.id })
      })
      showSnackbar(`已刪除「${group.displayTitle}」及其所有員工薪資資料。`, 'info')
    }
    setDeleteMonthKey(null)
    if (activeMonthKey === deleteMonthKey) {
      setActiveMonthKey(null)
    }
  }

  const handleConfirmDeleteSingleEmp = () => {
    if (!deleteTarget) return
    dispatch({ type: 'DELETE', payload: deleteTarget.id })
    showSnackbar(`已刪除「${deleteTarget.name || '員工'}」的薪資資料`, 'info')
    setDeleteTarget(null)
  }

  // Multi-select Checkbox helpers
  const handleToggleSelectEmp = (id: string) => {
    setSelectedEmpIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleToggleSelectAllInMonth = () => {
    if (!activeMonthGroup) return
    const currentAllIds = activeMonthGroup.employees.map(e => e.id)
    const isAllSelected = currentAllIds.every(id => selectedEmpIds.includes(id))

    if (isAllSelected) {
      setSelectedEmpIds(prev => prev.filter(id => !currentAllIds.includes(id)))
    } else {
      setSelectedEmpIds(prev => Array.from(new Set([...prev, ...currentAllIds])))
    }
  }

  // Add new employee specifically for active month
  const handleAddNewEmployeeInActiveMonth = () => {
    const newEmp = createEmptyEmployee()
    if (activeMonthKey) {
      newEmp.month = activeMonthKey
    }
    dispatch({ type: 'ADD', payload: newEmp })
    onEditEmployee(newEmp)
  }

  // ── RENDER: Month List View ─────────────────────────────────────────────────

  if (!activeMonthKey) {
    return (
      <PageContainer maxWidth={1200}>
        <PageHeader
          title="💰 薪資管理"
          subtitle="依月份分類管理全公司薪資表、建立月份與匯出整月 PDF"
          action={
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                onClick={handleExportAllMonthsPDF}
                disabled={exporting || state.employees.length === 0}
                sx={{ borderRadius: 2.5, fontWeight: 700, height: 52 }}
              >
                {exporting ? <CircularProgress size={18} sx={{ mr: 1 }} /> : <PdfSvg />}
                匯出全部月份 PDF
              </Button>

              <Button
                variant="contained"
                onClick={handleOpenCreateModal}
                sx={{ borderRadius: 2.5, fontWeight: 700, height: 52, px: 3 }}
              >
                <AddSvg />
                ＋ 建立月份
              </Button>
            </Stack>
          }
        />

        {monthGroups.length === 0 ? (
          <EmptyState
            title="尚無薪資月份資料"
            subtitle="點擊右上角「＋ 建立月份」開始進行月份薪資管理。"
            actionLabel="＋ 建立第一個月份"
            onAction={handleOpenCreateModal}
          />
        ) : (
          <Grid container spacing={2.5}>
            {monthGroups.map(group => (
              <Grid item xs={12} key={group.monthKey}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 4,
                    transition: 'all 0.2s ease',
                    '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.06)', borderColor: 'primary.main' },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
                      {/* Left Month Info */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 64, height: 64, borderRadius: 3,
                            bgcolor: 'primary.light', color: 'primary.main',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 32, flexShrink: 0,
                          }}
                        >
                          📂
                        </Box>
                        <Box>
                          <Typography variant="h6" fontWeight={800} color="text.primary">
                            {group.displayTitle}
                          </Typography>
                          <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                            <Chip label={`${group.employeeCount} 位員工`} size="small" color="primary" sx={{ fontWeight: 700 }} />
                            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                              建立：{group.createdDate}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                              最後修改：{group.lastUpdatedDate}
                            </Typography>
                          </Stack>
                        </Box>
                      </Box>

                      {/* Right Total & Action Buttons */}
                      <Stack direction={{ xs: 'row', sm: 'row' }} spacing={1} alignItems="center" justifyContent="flex-end" flexWrap="wrap">
                        <Box sx={{ mr: 2, textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                          <Typography variant="caption" color="text.secondary">
                            應付薪資總計
                          </Typography>
                          <Typography variant="subtitle1" fontWeight={900} color="primary.main">
                            ${group.totalNetSalary.toLocaleString()}
                          </Typography>
                        </Box>

                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleExportMonthPDF(group)}
                          disabled={exporting}
                          sx={{ borderRadius: 2, height: 44, fontWeight: 700 }}
                        >
                          <PdfSvg />
                          匯出整月 PDF
                        </Button>

                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => {
                            setActiveMonthKey(group.monthKey)
                            setSearch('')
                            setSelectedEmpIds([])
                          }}
                          sx={{ borderRadius: 2, height: 44, fontWeight: 700, px: 2.5 }}
                        >
                          進入月份 →
                        </Button>

                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteMonthKey(group.monthKey)}
                          sx={{ ml: 0.5 }}
                        >
                          <DelSvg />
                        </IconButton>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* ── Modal: 建立月份 ── */}
        <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} PaperProps={{ sx: { borderRadius: 4, minWidth: 320 } }}>
          <DialogTitle fontWeight={800}>＋ 建立新薪資月份</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              請選擇欲建立的年份與月份：
            </Typography>
            <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>年份</InputLabel>
                <Select value={inputYear} label="年份" onChange={e => setInputYear(Number(e.target.value))}>
                  {Array.from({ length: 101 }, (_, i) => currentYear - 50 + i).map(y => (
                    <MenuItem key={y} value={y}>{y} 年</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>月份</InputLabel>
                <Select value={inputMonth} label="月份" onChange={e => setInputMonth(Number(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <MenuItem key={m} value={m}>{String(m).padStart(2, '0')} 月</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button variant="outlined" onClick={() => setCreateModalOpen(false)} sx={{ borderRadius: 2 }}>
              取消
            </Button>
            <Button variant="contained" onClick={handleProcessCreateMonth} sx={{ borderRadius: 2, fontWeight: 700 }}>
              確定建立
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Dialog: 複製上個月員工確認 ── */}
        <Dialog open={copyPrevConfirmOpen} onClose={() => handleConfirmCopyPrevMonth(false)} PaperProps={{ sx: { borderRadius: 4, minWidth: 340 } }}>
          <DialogTitle fontWeight={800}>是否複製上個月員工？</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ borderRadius: 3, mb: 2 }}>
              偵測到前一月份（{prevMonthToCopyFrom}）共有員工資料。
            </Alert>
            <Typography variant="body2" color="text.secondary">
              是否自動將「{prevMonthToCopyFrom}」的所有員工姓名與門市複製建立至「{targetMonthToCreate}」？
              <br /><br />
              <strong>說明：</strong>所有金額與薪資數字皆會保持空白/0，您可再進入月份內快速填寫。
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button variant="outlined" onClick={() => handleConfirmCopyPrevMonth(false)} sx={{ borderRadius: 2 }}>
              否 (建立空白月份)
            </Button>
            <Button variant="contained" color="primary" onClick={() => handleConfirmCopyPrevMonth(true)} sx={{ borderRadius: 2, fontWeight: 700 }}>
              是 (複製員工名單)
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Dialog: 刪除整個月份確認 ── */}
        <ConfirmDialog
          open={!!deleteMonthKey}
          title="確定刪除此薪資月份？"
          content={`刪除後將連同此月份所有員工的薪資記錄一併刪除，此操作無法復原。確定要繼續嗎？`}
          confirmText="確定刪除月份"
          confirmColor="error"
          onClose={() => setDeleteMonthKey(null)}
          onConfirm={handleConfirmDeleteMonth}
        />
      </PageContainer>
    )
  }

  // ── RENDER: Month Detail View (員工薪資明細) ───────────────────────────────

  const isAllInMonthSelected = filteredEmployeesInMonth.length > 0 &&
    filteredEmployeesInMonth.every(e => selectedEmpIds.includes(e.id))

  return (
    <PageContainer maxWidth={1200}>
      {/* Top Breadcrumb & Header */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setActiveMonthKey(null)}
          sx={{ borderRadius: 2, mb: 1.5, fontWeight: 700 }}
        >
          <ArrowBackSvg />
          回月份列表
        </Button>
      </Box>

      <PageHeader
        title={`📂 ${activeMonthGroup ? activeMonthGroup.displayTitle : activeMonthKey} — 薪資明細`}
        subtitle={`共 ${filteredEmployeesInMonth.length} 位員工 · 應付金額合計: $${(activeMonthGroup?.totalNetSalary || 0).toLocaleString()}`}
        action={
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            {selectedEmpIds.length > 0 && (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleExportSelectedPDF}
                disabled={exporting}
                sx={{ borderRadius: 2.5, fontWeight: 700, height: 48 }}
              >
                <PdfSvg />
                匯出已選 ({selectedEmpIds.length}) PDF
              </Button>
            )}

            <Button
              variant="outlined"
              onClick={() => activeMonthGroup && handleExportMonthPDF(activeMonthGroup)}
              disabled={exporting || filteredEmployeesInMonth.length === 0}
              sx={{ borderRadius: 2.5, fontWeight: 700, height: 48 }}
            >
              <PdfSvg />
              匯出整月 PDF
            </Button>

            <Button
              variant="contained"
              onClick={handleAddNewEmployeeInActiveMonth}
              sx={{ borderRadius: 2.5, fontWeight: 700, height: 48, px: 2.5 }}
            >
              <AddSvg />
              新增員工薪資
            </Button>
          </Stack>
        }
      />

      {/* Instant Search Bar & Selection Toolbar */}
      <Card variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: '#FAFBFD' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <TextField
            placeholder="🔍 搜尋員工姓名或門市..."
            value={search}
            size="small"
            onChange={e => setSearch(e.target.value)}
            sx={{ width: { xs: '100%', sm: 320 }, bgcolor: '#fff', borderRadius: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchSvg />
                </InputAdornment>
              ),
            }}
          />

          <Stack direction="row" spacing={1} alignItems="center">
            <Checkbox
              checked={isAllInMonthSelected}
              indeterminate={selectedEmpIds.length > 0 && !isAllInMonthSelected}
              onChange={handleToggleSelectAllInMonth}
            />
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              全選本頁員工 ({selectedEmpIds.length}/{filteredEmployeesInMonth.length})
            </Typography>
          </Stack>
        </Stack>
      </Card>

      {/* Employee Salary Cards Grid */}
      {filteredEmployeesInMonth.length === 0 ? (
        <EmptyState
          title="尚無此月份之員工薪資紀錄"
          subtitle={search ? `找不到符合「${search}」的員工` : '請點擊上方「新增員工薪資」按鈕為此月份新增成員'}
          actionLabel="新增員工薪資"
          onAction={handleAddNewEmployeeInActiveMonth}
        />
      ) : (
        <Grid container spacing={2.5}>
          {filteredEmployeesInMonth.map(emp => {
            const isSelected = selectedEmpIds.includes(emp.id)
            return (
              <Grid item xs={12} sm={6} key={emp.id}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 4,
                    borderColor: isSelected ? 'primary.main' : '#E5E7EB',
                    bgcolor: isSelected ? '#F0F7FF' : '#ffffff',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 4px 14px rgba(25, 118, 210, 0.12)' : 'none',
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleToggleSelectEmp(emp.id)}
                          sx={{ p: 0.5 }}
                        />
                        <Box>
                          <Typography variant="h6" fontWeight={800} color="text.primary">
                            {emp.name || '未命名員工'}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                            {emp.store && <Chip label={emp.store} size="small" variant="outlined" sx={{ fontWeight: 600 }} />}
                            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                              發薪日: {emp.payDate || '未定'}
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>

                      {/* Right Action Icons */}
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="匯出此員工 PDF">
                          <IconButton size="small" color="primary" onClick={() => handleExportSingleEmpPDF(emp)}>
                            <PdfSvg />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="編輯薪資">
                          <IconButton size="small" color="info" onClick={() => onEditEmployee(emp)}>
                            <EditSvg />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="刪除紀錄">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(emp)}>
                            <DelSvg />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          應發薪資 (Gross)
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                          ${(emp.grossSalary || 0).toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary">
                          實發薪資 (Net)
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={900} color="success.main">
                          ${(emp.netSalary || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      {/* Confirm Delete Single Employee Record Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="確定刪除此員工薪資資料？"
        content={`您即將刪除「${deleteTarget?.name || '未命名'}」於 ${deleteTarget?.month || ''} 的薪資資料。確定繼續？`}
        confirmText="確定刪除"
        confirmColor="error"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDeleteSingleEmp}
      />
    </PageContainer>
  )
}
