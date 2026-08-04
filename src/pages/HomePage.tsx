import React, { useState, useMemo } from 'react'
import {
  Box, Button, Typography, Card, CardContent,
  Stack, Divider, Chip, IconButton, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions,
  TextField, InputAdornment, Grid, CircularProgress, Checkbox,
  FormControl, InputLabel, Select, MenuItem, Alert, Skeleton,
} from '@mui/material'
import { useEmployees } from '../context/EmployeeContext'
import { useSnackbar } from '../context/SnackbarContext'
import { Employee, createEmptyEmployee } from '../types/employee'
import { PDFService } from '../services/pdfService'
import PageHeader from '../components/common/PageHeader'
import PageContainer from '../components/common/PageContainer'
import EmptyState from '../components/common/EmptyState'
import ConfirmDialog from '../components/common/ConfirmDialog'
import DeleteConfirmBottomSheet from '../components/common/DeleteConfirmBottomSheet'
import { groupSalariesByMonth, MonthGroup } from '../utils/salaryMigration'

const AddSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6 }}>
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
)
const PdfSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6 }}>
    <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5z"/>
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

interface Props {
  onAddEmployee: () => void
  onEditEmployee: (emp: Employee) => void
}

export default function HomePage({ onAddEmployee, onEditEmployee }: Props) {
  const { state, dispatch, deleteSalary, deleteMonth } = useEmployees()
  const { showSnackbar } = useSnackbar()

  // Navigation View State: 'MONTH_LIST' | 'MONTH_DETAIL'
  const [activeMonthKey, setActiveMonthKey] = useState<string | null>(null)

  // Local Search & Filter State
  const [searchName, setSearchName]   = useState('')
  const [searchYear, setSearchYear]   = useState<string>('all') // 'all' | '2026' | '2025' ...
  const [searchMonth, setSearchMonth] = useState<string>('all') // 'all' | '01' | '02' ... | '12'

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

  // Extract available years dynamically from state.employees
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>()
    state.employees.forEach(emp => {
      if (emp.month) {
        const y = parseInt(emp.month.split('-')[0], 10)
        if (!isNaN(y)) yearSet.add(y)
      }
    })
    if (yearSet.size === 0) {
      yearSet.add(currentYear)
    }
    return Array.from(yearSet).sort((a, b) => b - a)
  }, [state.employees, currentYear])

  // Check if any filter condition is active
  const isFilterActive = useMemo(() => {
    return searchName.trim() !== '' || searchYear !== 'all' || searchMonth !== 'all'
  }, [searchName, searchYear, searchMonth])

  // Clear filter handler
  const handleClearFilter = () => {
    setSearchName('')
    setSearchYear('all')
    setSearchMonth('all')
  }

  // Group salaries by month (Migration included)
  const monthGroups = useMemo(() => {
    return groupSalariesByMonth(state.employees)
  }, [state.employees])

  // Filtered month groups for Month List View
  const filteredMonthGroups = useMemo(() => {
    return monthGroups.filter(group => {
      const [gYear, gMonth] = group.monthKey.split('-')
      const matchYear  = searchYear === 'all' || gYear === searchYear
      const matchMonth = searchMonth === 'all' || gMonth === searchMonth

      let matchName = true
      if (searchName.trim()) {
        const q = searchName.trim().toLowerCase()
        matchName = group.employees.some(e =>
          e.name.toLowerCase().includes(q) || (e.store && e.store.toLowerCase().includes(q))
        )
      }

      return matchYear && matchMonth && matchName
    })
  }, [monthGroups, searchYear, searchMonth, searchName])

  // Active month group when in detail view
  const activeMonthGroup = useMemo(() => {
    if (!activeMonthKey) return null
    return monthGroups.find(g => g.monthKey === activeMonthKey) || null
  }, [monthGroups, activeMonthKey])

  // Filtered employees inside detail view
  const filteredEmployeesInMonth = useMemo(() => {
    if (!activeMonthGroup) return []
    return activeMonthGroup.employees.filter(e => {
      const q = searchName.trim().toLowerCase()
      const matchName = !q || e.name.toLowerCase().includes(q) || (e.store && e.store.toLowerCase().includes(q))
      const [eYear, eMonth] = (e.month || '').split('-')
      const matchYear  = searchYear === 'all' || eYear === searchYear
      const matchMonth = searchMonth === 'all' || eMonth === searchMonth
      return matchName && matchYear && matchMonth
    })
  }, [activeMonthGroup, searchName, searchYear, searchMonth])

  // ── Handlers: Create Month ──────────────────────────────────────────────────

  const handleOpenCreateModal = () => {
    setInputYear(new Date().getFullYear())
    setInputMonth(new Date().getMonth() + 1)
    setCreateModalOpen(true)
  }

  const handleProcessCreateMonth = () => {
    const formattedMonth = `${inputYear}-${String(inputMonth).padStart(2, '0')}`

    const exists = monthGroups.some(g => g.monthKey === formattedMonth)
    if (exists) {
      showSnackbar(`「${inputYear} 年 ${String(inputMonth).padStart(2, '0')} 月已存在。」`, 'warning')
      return
    }

    const previousMonths = monthGroups.filter(g => g.monthKey < formattedMonth)
    const closestPrevMonth = previousMonths.length > 0 ? previousMonths[0] : null

    setCreateModalOpen(false)

    if (closestPrevMonth && closestPrevMonth.employees.length > 0) {
      setTargetMonthToCreate(formattedMonth)
      setPrevMonthToCopyFrom(closestPrevMonth.monthKey)
      setCopyPrevConfirmOpen(true)
    } else {
      setActiveMonthKey(formattedMonth)
      showSnackbar(`已成功建立「${inputYear} 年 ${String(inputMonth).padStart(2, '0')} 月」！`, 'success')
    }
  }

  const handleConfirmCopyPrevMonth = (shouldCopy: boolean) => {
    if (!targetMonthToCreate) return

    if (shouldCopy && prevMonthToCopyFrom) {
      const prevGroup = monthGroups.find(g => g.monthKey === prevMonthToCopyFrom)
      if (prevGroup && prevGroup.employees.length > 0) {
        prevGroup.employees.forEach(prevEmp => {
          const emptyEmp: Employee = {
            ...createEmptyEmployee(),
            id: Math.random().toString(36).slice(2),
            name: prevEmp.name,
            store: prevEmp.store,
            hireDate: prevEmp.hireDate || '',
            payDate: prevEmp.payDate || '',
            month: targetMonthToCreate,
            baseSalary: 0,
            positionAllowance: 0,
            otherAllowance: 0,
            nightAllowance: 0,
            bonusItems: 0,
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
        showSnackbar(`已成功建立 ${targetMonthToCreate} 並複製上個月 ${prevGroup.employees.length} 位員工資料！`, 'success')
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

  const handleExportSelectedPDF = async () => {
    if (selectedEmpIds.length === 0) return
    const selectedEmps = state.employees.filter(e => selectedEmpIds.includes(e.id))
    setExporting(true)
    try {
      await PDFService.exportPayroll(selectedEmps, 'multi', activeMonthKey || undefined)
      showSnackbar(`已成功匯出勾選的 ${selectedEmps.length} 筆薪資單 PDF！`, 'success')
    } catch (err) {
      console.error(err)
      showSnackbar('PDF 產生失敗，請重試。', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleExportMonthPDF = async (group: MonthGroup) => {
    if (group.employees.length === 0) {
      showSnackbar('該月份尚無員工薪資資料，無法匯出 PDF。', 'warning')
      return
    }
    setExporting(true)
    try {
      await PDFService.exportPayroll(group.employees, 'month', group.monthKey)
      showSnackbar(`已成功匯出「${group.displayTitle}」整月薪資單 PDF！`, 'success')
    } catch (err) {
      console.error(err)
      showSnackbar('PDF 產生失敗，請重試。', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleExportAllMonthsPDF = async () => {
    setExporting(true)
    try {
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

  const handleConfirmDeleteMonth = async () => {
    if (!deleteMonthKey) return
    const group = monthGroups.find(g => g.monthKey === deleteMonthKey)
    if (group) {
      const ok = await deleteMonth(deleteMonthKey)
      if (ok) {
        showSnackbar('已刪除本月份所有薪資資料', 'info')
      } else {
        showSnackbar(`刪除「${group.displayTitle}」失敗，請確認網路錯誤。`, 'error')
      }
    }
    setDeleteMonthKey(null)
    if (activeMonthKey === deleteMonthKey) {
      setActiveMonthKey(null)
    }
  }

  const handleConfirmDeleteSingleEmp = async () => {
    if (!deleteTarget) return
    const ok = await deleteSalary(deleteTarget.id)
    if (ok) {
      showSnackbar(`已刪除「${deleteTarget.name || '員工'}」的薪資資料`, 'info')
    } else {
      showSnackbar(`刪除失敗，請確認 Supabase 連線與 Console 錯誤。`, 'error')
    }
    setDeleteTarget(null)
  }

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

  const handleAddNewEmployeeInActiveMonth = () => {
    const newEmp = createEmptyEmployee()
    if (activeMonthKey) {
      newEmp.month = activeMonthKey
    }
    dispatch({ type: 'ADD', payload: newEmp })
    onEditEmployee(newEmp)
  }

  // ── RENDER: Month List View (薪資首頁：月份列表) ───────────────────────────

  if (!activeMonthKey) {
    return (
      <PageContainer maxWidth={1120}>
        <PageHeader
          title="💰 薪資管理"
          subtitle="依月份分類管理全公司薪資表、輕鬆建立月份與匯出整月 PDF"
          action={
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Button
                variant="outlined"
                onClick={handleExportAllMonthsPDF}
                disabled={exporting || state.employees.length === 0}
                sx={{ borderRadius: '16px', fontWeight: 700, minHeight: 48, borderColor: '#2F80ED', color: '#2F80ED' }}
              >
                {exporting ? <CircularProgress size={18} sx={{ mr: 1 }} /> : <PdfSvg />}
                匯出全部月份 PDF
              </Button>

              <Button
                variant="contained"
                onClick={handleOpenCreateModal}
                sx={{ borderRadius: '16px', fontWeight: 700, minHeight: 48, px: 3, bgcolor: '#2F80ED', '&:hover': { bgcolor: '#1D6FD8' } }}
              >
                <AddSvg />
                建立月份
              </Button>
            </Stack>
          }
        />

        {/* ── Top Data Search & Filter Card ── */}
        <Card
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 3,
            borderRadius: '24px',
            bgcolor: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
            border: '1px solid #F1F5F9',
          }}
        >
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#1F2937', mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '15px' }}>
            🔍 資料搜尋
          </Typography>

          <Grid container spacing={1.5} alignItems="center">
            {/* Employee Name Search Input */}
            <Grid item xs={12} sm={4} md={5}>
              <TextField
                placeholder="輸入員工姓名搜尋 (如：林致玄)..."
                value={searchName}
                size="small"
                fullWidth
                onChange={e => setSearchName(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                    height: 48,
                    bgcolor: '#F8FAFC',
                    px: 1.5,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchSvg />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Year Select Dropdown */}
            <Grid item xs={6} sm={2.5} md={2.5}>
              <FormControl size="small" fullWidth>
                <InputLabel>年份</InputLabel>
                <Select
                  value={searchYear}
                  label="年份"
                  onChange={e => setSearchYear(e.target.value)}
                  sx={{
                    borderRadius: '16px',
                    height: 48,
                    bgcolor: '#F8FAFC',
                    fontWeight: 700,
                  }}
                >
                  <MenuItem value="all">全部分年</MenuItem>
                  {availableYears.map(y => (
                    <MenuItem key={y} value={String(y)}>{y} 年</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Month Select Dropdown */}
            <Grid item xs={6} sm={2.5} md={2.5}>
              <FormControl size="small" fullWidth>
                <InputLabel>月份</InputLabel>
                <Select
                  value={searchMonth}
                  label="月份"
                  onChange={e => setSearchMonth(e.target.value)}
                  sx={{
                    borderRadius: '16px',
                    height: 48,
                    bgcolor: '#F8FAFC',
                    fontWeight: 700,
                  }}
                >
                  <MenuItem value="all">全部月份</MenuItem>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                    <MenuItem key={m} value={m}>{m} 月</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Clear Filter Button */}
            <Grid item xs={12} sm={3} md={2}>
              <Button
                fullWidth
                variant="outlined"
                disabled={!isFilterActive}
                onClick={handleClearFilter}
                sx={{
                  height: 48,
                  borderRadius: '16px',
                  borderColor: '#CBD5E1',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: '#F1F5F9', borderColor: '#94A3B8' },
                }}
              >
                ✕ 清除篩選
              </Button>
            </Grid>
          </Grid>
        </Card>

        {filteredMonthGroups.length === 0 ? (
          <EmptyState
            title="目前尚無薪資資料"
            subtitle="點擊右上角「建立月份」按鈕即可開始管理薪資。"
            actionLabel="＋ 建立月份"
            onAction={() => setCreateModalOpen(true)}
          />
        ) : (
          <Grid container spacing={2.5}>
            {filteredMonthGroups.map(group => (
              <Grid item xs={12} sm={6} key={group.monthKey}>
                <Card
                  elevation={0}
                  className="animate-card-fade-up"
                  sx={{
                    borderRadius: '24px',
                    p: { xs: 2.5, sm: 3 },
                    transition: 'transform 200ms ease, box-shadow 200ms ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
                    {/* Left Month Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 52, height: 52, borderRadius: '16px',
                          bgcolor: '#EBF3FE', color: '#2F80ED',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 26, flexShrink: 0,
                        }}
                      >
                        📁
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ color: '#1E293B', fontSize: '22px' }}>
                          {group.displayTitle}
                        </Typography>
                        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mt: 0.5 }}>
                          <Chip
                            label={`${group.employeeCount} 位員工`}
                            size="small"
                            sx={{ bgcolor: '#EBF3FE', color: '#2F80ED', fontWeight: 700, borderRadius: '10px' }}
                          />
                          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '13px' }}>
                            建立：{group.createdDate}
                          </Typography>
                        </Stack>
                      </Box>
                    </Box>

                    {/* Middle Net Total Card */}
                    <Box
                      sx={{
                        bgcolor: '#FAFBFD',
                        px: 2.5,
                        py: 1.2,
                        borderRadius: '16px',
                        border: '1px solid #F1F5F9',
                        minWidth: 180,
                        textAlign: { xs: 'left', sm: 'right' },
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '12px' }}>
                        💰 本月薪資總額
                      </Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#16A34A', fontSize: '20px', lineHeight: 1.2 }}>
                        ${(group.totalNetSalary || 0).toLocaleString('zh-TW')}
                      </Typography>
                    </Box>

                    {/* Right Action Buttons */}
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'stretch', sm: 'flex-end' }} flexWrap="wrap">
                      <Button
                        variant="outlined"
                        onClick={() => handleExportMonthPDF(group)}
                        disabled={exporting}
                        sx={{ borderRadius: '14px', height: 44, fontWeight: 700, borderColor: '#2F80ED', color: '#2F80ED' }}
                      >
                        <PdfSvg />
                        匯出整月 PDF
                      </Button>

                      <Button
                        variant="contained"
                        onClick={() => {
                          setActiveMonthKey(group.monthKey)
                          handleClearFilter()
                          setSelectedEmpIds([])
                        }}
                        sx={{ borderRadius: '14px', height: 44, fontWeight: 700, px: 2.5, bgcolor: '#2F80ED', '&:hover': { bgcolor: '#1D6FD8' } }}
                      >
                        進入月份 →
                      </Button>

                      <IconButton
                        onClick={() => setDeleteMonthKey(group.monthKey)}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: '#FFF1F2',
                          color: '#E11D48',
                          '&:hover': { bgcolor: '#FFE4E6' },
                        }}
                      >
                        <DelSvg />
                      </IconButton>
                    </Stack>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* ── Modal: 建立月份 ── */}
        <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
          <DialogTitle fontWeight={700}>＋ 建立新薪資月份</DialogTitle>
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
            <Button variant="outlined" onClick={() => setCreateModalOpen(false)} sx={{ borderRadius: '12px' }}>
              取消
            </Button>
            <Button variant="contained" onClick={handleProcessCreateMonth} sx={{ borderRadius: '12px', fontWeight: 700, bgcolor: '#2F80ED' }}>
              確定建立
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Month Confirmation Bottom Sheet / Dialog */}
        <DeleteConfirmBottomSheet
          open={!!deleteMonthKey}
          title="確定刪除此薪資月份？"
          monthLabel={deleteMonthKey ? deleteMonthKey.replace('-', ' 年 ') + ' 月' : ''}
          employeeCount={monthGroups.find(g => g.monthKey === deleteMonthKey)?.employeeCount || 0}
          warningText="該月份包含之所有員工薪資資料將永久刪除且無法復原。"
          onClose={() => setDeleteMonthKey(null)}
          onConfirm={handleConfirmDeleteMonth}
        />

        {/* ── Dialog: 複製上個月員工確認 ── */}
        <Dialog open={copyPrevConfirmOpen} onClose={() => handleConfirmCopyPrevMonth(false)} PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
          <DialogTitle fontWeight={700}>是否複製上個月員工？</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ borderRadius: '12px', mb: 2 }}>
              偵測到前一月份（{prevMonthToCopyFrom}）共有員工資料。
            </Alert>
            <Typography variant="body2" color="text.secondary">
              是否自動將「{prevMonthToCopyFrom}」的所有員工姓名與門市複製建立至「{targetMonthToCreate}」？
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button variant="outlined" onClick={() => handleConfirmCopyPrevMonth(false)} sx={{ borderRadius: '12px' }}>
              否 (建立空白月份)
            </Button>
            <Button variant="contained" onClick={() => handleConfirmCopyPrevMonth(true)} sx={{ borderRadius: '12px', fontWeight: 700, bgcolor: '#2F80ED' }}>
              是 (複製員工名單)
            </Button>
          </DialogActions>
        </Dialog>
      </PageContainer>
    )
  }

  // ── RENDER: Month Detail View (特定月份內員工薪資列表) ────────────────────

  const isAllInMonthSelected = filteredEmployeesInMonth.length > 0 &&
    filteredEmployeesInMonth.every(e => selectedEmpIds.includes(e.id))

  return (
    <PageContainer maxWidth={1120}>
      <Box sx={{ mb: 2 }}>
        <Button
          onClick={() => setActiveMonthKey(null)}
          size="small"
          sx={{
            color: '#64748B',
            fontWeight: 700,
            fontSize: '14px',
            px: 1.5,
            py: 0.8,
            borderRadius: '12px',
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            '&:hover': { bgcolor: '#F8FAFC', color: '#1E293B' },
          }}
        >
          ← 返回月份列表
        </Button>
      </Box>

      <PageHeader
        title={`📂 ${activeMonthGroup ? activeMonthGroup.displayTitle : activeMonthKey} — 薪資明細`}
        subtitle={`共 ${filteredEmployeesInMonth.length} 位員工 · 實發金額合計: $${(activeMonthGroup?.totalNetSalary || 0).toLocaleString()}`}
        action={
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            {selectedEmpIds.length > 0 && (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleExportSelectedPDF}
                disabled={exporting}
                sx={{ borderRadius: '16px', fontWeight: 700, minHeight: 48 }}
              >
                <PdfSvg />
                匯出已選 ({selectedEmpIds.length}) PDF
              </Button>
            )}

            <Button
              variant="outlined"
              onClick={() => activeMonthGroup && handleExportMonthPDF(activeMonthGroup)}
              disabled={exporting || filteredEmployeesInMonth.length === 0}
              sx={{ borderRadius: '16px', fontWeight: 700, minHeight: 48, borderColor: '#2F80ED', color: '#2F80ED' }}
            >
              <PdfSvg />
              匯出整月 PDF
            </Button>

            <Button
              variant="contained"
              onClick={handleAddNewEmployeeInActiveMonth}
              sx={{ borderRadius: '16px', fontWeight: 700, minHeight: 48, px: 3, bgcolor: '#2F80ED', '&:hover': { bgcolor: '#1D6FD8' } }}
            >
              <AddSvg />
              新增員工薪資
            </Button>
          </Stack>
        }
      />

      {/* Instant Search Bar & Selection Toolbar */}
      <Card
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 3,
          borderRadius: '24px',
          bgcolor: '#FFFFFF',
          boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
          border: '1px solid #F1F5F9',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#1F2937', display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '15px' }}>
            🔍 資料搜尋
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <Checkbox
              checked={isAllInMonthSelected}
              indeterminate={selectedEmpIds.length > 0 && !isAllInMonthSelected}
              onChange={handleToggleSelectAllInMonth}
              sx={{ p: 0.5 }}
            />
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              全選本頁員工 ({selectedEmpIds.length}/{filteredEmployeesInMonth.length})
            </Typography>
          </Stack>
        </Stack>

        <Grid container spacing={1.5} alignItems="center">
          {/* Employee Name Search Input */}
          <Grid item xs={12} sm={4} md={5}>
            <TextField
              placeholder="輸入員工姓名搜尋 (如：林致玄)..."
              value={searchName}
              size="small"
              fullWidth
              onChange={e => setSearchName(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                  height: 48,
                  bgcolor: '#F8FAFC',
                  px: 1.5,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchSvg />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Year Select Dropdown */}
          <Grid item xs={6} sm={2.5} md={2.5}>
            <FormControl size="small" fullWidth>
              <InputLabel>年份</InputLabel>
              <Select
                value={searchYear}
                label="年份"
                onChange={e => setSearchYear(e.target.value)}
                sx={{
                  borderRadius: '16px',
                  height: 48,
                  bgcolor: '#F8FAFC',
                  fontWeight: 700,
                }}
              >
                <MenuItem value="all">全部分年</MenuItem>
                {availableYears.map(y => (
                  <MenuItem key={y} value={String(y)}>{y} 年</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Month Select Dropdown */}
          <Grid item xs={6} sm={2.5} md={2.5}>
            <FormControl size="small" fullWidth>
              <InputLabel>月份</InputLabel>
              <Select
                value={searchMonth}
                label="月份"
                onChange={e => setSearchMonth(e.target.value)}
                sx={{
                  borderRadius: '16px',
                  height: 48,
                  bgcolor: '#F8FAFC',
                  fontWeight: 700,
                }}
              >
                <MenuItem value="all">全部月份</MenuItem>
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                  <MenuItem key={m} value={m}>{m} 月</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Clear Filter Button */}
          <Grid item xs={12} sm={3} md={2}>
            <Button
              fullWidth
              variant="outlined"
              disabled={!isFilterActive}
              onClick={handleClearFilter}
              sx={{
                height: 48,
                borderRadius: '16px',
                borderColor: '#CBD5E1',
                color: '#475569',
                fontWeight: 700,
                fontSize: '14px',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#F1F5F9', borderColor: '#94A3B8' },
              }}
            >
              ✕ 清除篩選
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Employee Salary Cards Grid */}
      {filteredEmployeesInMonth.length === 0 ? (
        <EmptyState
          title="找不到符合條件的薪資單"
          subtitle={searchName ? `找不到符合「${searchName}」的員工紀錄` : '請點擊上方「新增員工薪資」按鈕或重置搜尋條件。'}
          actionLabel="✕ 清除篩選"
          onAction={handleClearFilter}
        />
      ) : (
        <Grid container spacing={3}>
          {filteredEmployeesInMonth.map(emp => {
            const isSelected = selectedEmpIds.includes(emp.id)
            return (
              <Grid item xs={12} sm={6} md={6} key={emp.id}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: '24px',
                    borderColor: isSelected ? '#2F80ED' : '#ECECEC',
                    borderWidth: '1.5px',
                    borderStyle: 'solid',
                    bgcolor: isSelected ? '#F0F7FF' : '#FFFFFF',
                    transition: 'all 200ms ease',
                    boxShadow: isSelected ? '0 8px 24px rgba(47, 128, 237, 0.12)' : '0 8px 24px rgba(0,0,0,0.04)',
                    p: { xs: 2.5, sm: 3.5 },
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
                    },
                  }}
                >
                  {/* Top Section: Checkbox + Name + Pay Date vs Tool Icons */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleToggleSelectEmp(emp.id)}
                        sx={{
                          p: 0.5,
                          color: '#CBD5E1',
                          '&.Mui-checked': { color: '#2F80ED' }
                        }}
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="h5"
                          fontWeight={700}
                          sx={{
                            color: '#1F2937',
                            fontSize: { xs: '22px', sm: '26px', md: '28px' },
                            lineHeight: 1.2,
                            letterSpacing: '-0.5px',
                            wordBreak: 'break-word',
                          }}
                        >
                          {emp.name || '未命名員工'}
                        </Typography>

                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mt: 0.8 }}>
                          {emp.store && (
                            <Chip
                              label={emp.store}
                              size="small"
                              sx={{
                                bgcolor: '#EBF3FE',
                                color: '#2F80ED',
                                fontWeight: 700,
                                fontSize: '13px',
                                borderRadius: '10px',
                              }}
                            />
                          )}
                          <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '15px', fontWeight: 500 }}>
                            📅 發薪日：{emp.payDate || '未定'}
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>

                    {/* Top Right Tool Buttons */}
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Tooltip title="匯出此員工 PDF">
                        <IconButton
                          onClick={() => handleExportSingleEmpPDF(emp)}
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: '#EBF3FE',
                            color: '#2F80ED',
                            transition: 'all 150ms ease',
                            '&:hover': { bgcolor: '#DBEAFE', transform: 'scale(1.05)' },
                          }}
                        >
                          <PdfSvg />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="編輯薪資">
                        <IconButton
                          onClick={() => onEditEmployee(emp)}
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: '#F8FAFC',
                            color: '#475569',
                            transition: 'all 150ms ease',
                            '&:hover': { bgcolor: '#F1F5F9', color: '#1F2937', transform: 'scale(1.05)' },
                          }}
                        >
                          <EditSvg />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="刪除紀錄">
                        <IconButton
                          onClick={() => setDeleteTarget(emp)}
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: '#FFF1F2',
                            color: '#E11D48',
                            transition: 'all 150ms ease',
                            '&:hover': { bgcolor: '#FFE4E6', transform: 'scale(1.05)' },
                          }}
                        >
                          <DelSvg />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>

                  {/* Divider Line */}
                  <Divider sx={{ my: 2.5, borderColor: '#F1F5F9' }} />

                  {/* Bottom Net Salary Highlight Section */}
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '15px', fontWeight: 600, mb: 0.5 }}>
                      💰 實發薪資
                    </Typography>
                    <Typography
                      variant="h3"
                      fontWeight={700}
                      sx={{
                        color: '#16A34A',
                        fontSize: { xs: '32px', sm: '38px', md: '40px' },
                        letterSpacing: '-1px',
                        lineHeight: 1.1,
                      }}
                    >
                      ${(emp.netSalary || 0).toLocaleString('zh-TW')}
                    </Typography>
                  </Box>
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
