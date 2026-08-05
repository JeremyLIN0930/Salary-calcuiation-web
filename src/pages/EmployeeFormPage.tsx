import React, { useState, useEffect } from 'react'
import {
  Box, Button, TextField, Grid, Typography, AppBar, Toolbar,
  IconButton, Chip, Paper, MenuItem, Select, FormControl, InputLabel,
  Card, CardContent, Divider, Stack, CircularProgress,
} from '@mui/material'
import { Employee, Store, createEmptyEmployee, calcGross, calcDeductions } from '../types/employee'
import { useEmployees } from '../context/EmployeeContext'
import { useMasterEmployees } from '../context/MasterEmployeeContext'
import { useSnackbar } from '../context/SnackbarContext'
import { MasterEmployee } from '../types/masterEmployee'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { supabaseSalaryRepository } from '../repositories/SupabaseSalaryRepository'

function MasterEmployeeSelect({ onSelect }: { onSelect: (emp: MasterEmployee) => void }) {
  const { state } = useMasterEmployees()
  if (state.employees.length === 0) return null

  return (
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <InputLabel id="master-emp-select-label">帶入員工</InputLabel>
      <Select
        labelId="master-emp-select-label"
        value=""
        label="帶入員工"
        onChange={e => {
          const selected = state.employees.find(m => m.id === e.target.value)
          if (selected) onSelect(selected)
        }}
      >
        <MenuItem value="" disabled><em>選擇共用員工</em></MenuItem>
        {state.employees.map(m => (
          <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

const ArrowBackSvg = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
  </svg>
)
const SaveSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6 }}>
    <path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16a3 3 0 110-6 3 3 0 010 6zm3-10H5V5h10v4z"/>
  </svg>
)

import SectionCard from '../components/common/SectionCard'
import SummaryCard from '../components/common/SummaryCard'

function MoneyField({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void
}) {
  const [display, setDisplay] = useState(value === 0 ? '' : value.toLocaleString('zh-TW'))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) {
      setDisplay(value === 0 ? '' : value.toLocaleString('zh-TW'))
    }
  }, [value, focused])

  return (
    <TextField
      label={label}
      value={display}
      size="medium"
      fullWidth
      inputProps={{ inputMode: 'numeric', style: { textAlign: 'right' } }}
      InputProps={{ startAdornment: <Typography sx={{ color: 'text.secondary', mr: 0.5, fontSize: 14 }}>$</Typography> }}
      onFocus={() => {
        setFocused(true)
        setDisplay(value === 0 ? '' : String(value))
      }}
      onBlur={(e) => {
        setFocused(false)
        const n = parseFloat(e.target.value.replace(/,/g, '')) || 0
        onChange(n)
        setDisplay(n === 0 ? '' : n.toLocaleString('zh-TW'))
      }}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9.]/g, '')
        setDisplay(raw)
      }}
    />
  )
}

function PlainField({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void
}) {
  return (
    <TextField
      label={label}
      type="number"
      value={value || ''}
      size="medium"
      fullWidth
      inputProps={{ min: 0, style: { textAlign: 'right' } }}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    />
  )
}

interface Props {
  editEmployee?: Employee
  onBack: () => void
}

export default function EmployeeFormPage({ editEmployee, onBack }: Props) {
  const { saveSalary }   = useEmployees()
  const { showSnackbar } = useSnackbar()

  const [emp, setEmp] = useState<Employee>(() => {
    if (editEmployee) {
      const now = new Date().toISOString()
      return {
        ...editEmployee,
        createdAt: editEmployee.createdAt ?? now,
        updatedAt: editEmployee.updatedAt ?? now,
      }
    }
    return createEmptyEmployee()
  })

  const [errors, setErrors] = useState<{ name?: string; month?: string; store?: string }>({})
  const [saving, setSaving] = useState(false)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [duplicateInfo, setDuplicateInfo] = useState<{ employeeName: string; monthLabel: string } | null>(null)

  // Auto-calc gross
  useEffect(() => {
    if (emp.isGrossManual) return
    const auto = calcGross(emp)
    setEmp(p => ({ ...p, grossSalary: auto }))
  }, [emp.baseSalary, emp.positionAllowance, emp.otherAllowance,
      emp.nightAllowance, emp.bonusItems, emp.otherAdditions,
      emp.specialLeaveAllowance, emp.weekdayOT, emp.restDayOT, emp.holidayOT,
      emp.sickLeaveDeduction, emp.isGrossManual])

  // Auto-calc deductions
  useEffect(() => {
    if (emp.isDeductionManual) return
    const auto = calcDeductions(emp)
    setEmp(p => ({ ...p, totalDeductions: auto }))
  }, [emp.laborInsurance, emp.healthInsurance, emp.laborPension, emp.incomeTax, emp.otherDeductions, emp.isDeductionManual])

  // Auto-calc net
  useEffect(() => {
    if (emp.isNetManual) return
    setEmp(p => ({ ...p, netSalary: p.grossSalary - p.totalDeductions }))
  }, [emp.grossSalary, emp.totalDeductions, emp.isNetManual])

  const set = <K extends keyof Employee>(key: K, val: Employee[K]) =>
    setEmp(p => ({ ...p, [key]: val }))

  const money = (key: keyof Employee) => (v: number) => setEmp(p => ({ ...p, [key]: v }))

  const handleSave = async () => {
    const e: typeof errors = {}
    if (!emp.name.trim()) e.name = '姓名為必填'
    if (!emp.month)       e.month = '月份為必填'
    if (!emp.store)       e.store = '門市為必填'
    if (Object.keys(e).length) { setErrors(e); return }

    setErrors({})
    setSaving(true)

    const now = new Date().toISOString()
    const record: Employee = {
      ...emp,
      updatedAt: now,
      createdAt: emp.createdAt || now,
    }

    try {
      if (!editEmployee) {
        const duplicateResult = await supabaseSalaryRepository.checkDuplicateSalary(record)
        if (duplicateResult.success && duplicateResult.data?.duplicate) {
          setDuplicateInfo({
            employeeName: duplicateResult.data.employeeName || emp.name,
            monthLabel: record.month.replace(/-(\d{2})$/, ' 年 $1 月').replace('-', ' 年 '),
          })
          setDuplicateDialogOpen(true)
          setSaving(false)
          return
        }
      }

const ok = await saveSalary(record)

      if (ok) {
        showSnackbar('薪資單已成功寫入 Supabase 並儲存！', 'success')
        setSaving(false)
        onBack()
      } else {
        showSnackbar('薪資單儲存失敗，請確認 Supabase 連線與 Console 錯誤！', 'error')
        setSaving(false)
      }
    } catch (err: any) {
      console.error('[EmployeeFormPage] save failed:', err)
      showSnackbar(err?.message || '薪資單儲存失敗，請確認 Supabase 連線與 Console 錯誤！', 'error')
      setSaving(false)
    }
  }

  return (
    <Box sx={{ bgcolor: '#F5F7FA', minHeight: '100vh', pb: 14 }}>
      {/* Top Header */}
      <AppBar position="sticky" elevation={0}
        sx={{ bgcolor: 'white', borderBottom: '1px solid #E5E7EB' }}>
        <Toolbar sx={{ maxWidth: 840, width: '100%', mx: 'auto', px: 2 }}>
          <IconButton onClick={onBack} edge="start" sx={{ mr: 1, color: 'text.primary' }}>
            <ArrowBackSvg />
          </IconButton>
          <Typography variant="h6" fontWeight={800} sx={{ flexGrow: 1, color: 'text.primary', fontSize: 18 }}>
            {editEmployee ? '編輯員工薪資' : '新增員工薪資'}
          </Typography>
          {emp.name && <Chip label={emp.name} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />}
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 840, mx: 'auto', px: 2, pt: 3 }}>
        <ConfirmDialog
          open={duplicateDialogOpen}
          title="⚠️ 本月薪資單已存在"
          content={`員工：${duplicateInfo?.employeeName || emp.name}\n月份：${duplicateInfo?.monthLabel || emp.month}\n\n此員工本月份已建立薪資單，\n請至薪資列表編輯既有薪資單。`}
          confirmText="我知道了"
          confirmColor="primary"
          hideCancelButton
          onClose={() => setDuplicateDialogOpen(false)}
          onConfirm={() => setDuplicateDialogOpen(false)}
        />

        {/* ── 3 Summary Highlight Cards ── */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <SummaryCard
              title="薪資合計"
              value={`$ ${(emp.grossSalary ?? 0).toLocaleString('zh-TW')}`}
              color="primary"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <SummaryCard
              title="代扣合計"
              value={`− $ ${(emp.totalDeductions ?? 0).toLocaleString('zh-TW')}`}
              color="error"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <SummaryCard
              title="實發金額"
              value={`$ ${(emp.netSalary ?? 0).toLocaleString('zh-TW')}`}
              color="indigo"
            />
          </Grid>
        </Grid>

        {/* ── 第一區：基本資料 ── */}
        <SectionCard title="基本資料" icon="📋">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="姓名 *"
                  value={emp.name}
                  fullWidth
                  size="medium"
                  error={!!errors.name}
                  helperText={errors.name}
                  onChange={e => set('name', e.target.value)}
                />
                <MasterEmployeeSelect
                  onSelect={m => {
                    set('name', m.name)
                    if (m.store) set('store', m.store as Store)
                    if (m.hireDate) set('hireDate', m.hireDate)
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField label="月份 *" type="month" value={emp.month} fullWidth size="medium"
                error={!!errors.month} helperText={errors.month}
                InputLabelProps={{ shrink: true }}
                onChange={e => set('month', e.target.value)} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="medium" error={!!errors.store}>
                <InputLabel id="store-select-label">門市 *</InputLabel>
                <Select
                  labelId="store-select-label"
                  value={emp.store}
                  label="門市 *"
                  onChange={e => { set('store', e.target.value as Store); setErrors(p => ({ ...p, store: undefined })) }}
                >
                  <MenuItem value=""><em>請選擇門市</em></MenuItem>
                  <MenuItem value="慶東門市">慶東門市</MenuItem>
                  <MenuItem value="南醫門市">南醫門市</MenuItem>
                </Select>
                {errors.store && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{errors.store}</Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField label="到職日" type="date" value={emp.hireDate} fullWidth size="medium"
                InputLabelProps={{ shrink: true }}
                onChange={e => set('hireDate', e.target.value)} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField label="發薪日期" type="date" value={emp.payDate} fullWidth size="medium"
                InputLabelProps={{ shrink: true }}
                onChange={e => set('payDate', e.target.value)} />
            </Grid>
          </Grid>
        </SectionCard>

        {/* ── 第二區：薪資資料 ── */}
        <SectionCard title="薪資資料" icon="💰">
          <Grid container spacing={2.5}>
            {([
              ['本薪', 'baseSalary'], ['職務津貼', 'positionAllowance'],
              ['其他津貼', 'otherAllowance'], ['夜勤津貼', 'nightAllowance'],
              ['津貼/獎金項目', 'bonusItems'], ['其他加款', 'otherAdditions'],
              ['特別假津貼', 'specialLeaveAllowance'], ['平日加班費', 'weekdayOT'],
              ['休息日加班費', 'restDayOT'], ['國定假日加班費', 'holidayOT'],
              ['事病假扣款', 'sickLeaveDeduction'],
            ] as [string, keyof Employee][]).map(([label, key]) => (
              <Grid item xs={12} sm={6} key={key}>
                <MoneyField label={label} value={emp[key] as number} onChange={money(key)} />
              </Grid>
            ))}

            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2.5, borderColor: emp.isGrossManual ? 'warning.main' : 'primary.main', borderWidth: 2, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
                  <Typography variant="subtitle2" fontWeight={800} color="primary.main">薪資合計小計</Typography>
                  {emp.isGrossManual && <Chip label="手動覆寫中" size="small" color="warning" sx={{ height: 20, fontSize: 11 }} />}
                  {!emp.isGrossManual && <Chip label="自動計算" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: 11 }} />}
                </Box>
                <MoneyField label="薪資合計" value={emp.grossSalary}
                  onChange={v => { set('isGrossManual', true); set('grossSalary', v) }} />
                {emp.isGrossManual && (
                  <Button size="small" sx={{ mt: 1 }} onClick={() => set('isGrossManual', false)}>↺ 恢復自動計算</Button>
                )}
              </Paper>
            </Grid>
          </Grid>
        </SectionCard>

        {/* ── 第三區：代扣資料 ── */}
        <SectionCard title="代扣資料" icon="🧾">
          <Grid container spacing={2.5}>
            {([
              ['勞保費', 'laborInsurance'], ['健保費', 'healthInsurance'],
              ['勞退個人自提', 'laborPension'], ['所得稅', 'incomeTax'],
              ['其他扣款', 'otherDeductions'],
            ] as [string, keyof Employee][]).map(([label, key]) => (
              <Grid item xs={12} sm={6} key={key}>
                <MoneyField label={label} value={emp[key] as number} onChange={money(key)} />
              </Grid>
            ))}

            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2.5, borderColor: emp.isDeductionManual ? 'warning.main' : 'error.light', borderWidth: 2, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
                  <Typography variant="subtitle2" fontWeight={800} color="error.main">代扣合計小計</Typography>
                  {emp.isDeductionManual && <Chip label="手動覆寫中" size="small" color="warning" sx={{ height: 20, fontSize: 11 }} />}
                </Box>
                <MoneyField label="代扣合計" value={emp.totalDeductions}
                  onChange={v => { set('isDeductionManual', true); set('totalDeductions', v) }} />
                {emp.isDeductionManual && (
                  <Button size="small" sx={{ mt: 1 }} onClick={() => set('isDeductionManual', false)}>↺ 恢復自動計算</Button>
                )}
              </Paper>
            </Grid>
          </Grid>
        </SectionCard>

        {/* ── 第四區：考勤資料 ── */}
        <SectionCard title="考勤資料" icon="🕐">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <PlainField label="年度剩餘特別假（日）" value={emp.annualLeaveRemaining} onChange={money('annualLeaveRemaining')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <PlainField label="結轉特別假（日）" value={emp.carriedOverLeave} onChange={money('carriedOverLeave')} />
            </Grid>
          </Grid>
        </SectionCard>

        {/* ── 第五區：退休金與實發金額 ── */}
        <SectionCard title="退休金與實發金額" icon="🏦">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <MoneyField label="公司提撥退休金" value={emp.companyPensionContribution} onChange={money('companyPensionContribution')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MoneyField label="當月提撥退休金" value={emp.monthlyPensionContribution} onChange={money('monthlyPensionContribution')} />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ bgcolor: '#1A237E', borderRadius: 4, p: 3, color: 'white' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                    實發金額（薪資合計 − 代扣合計）
                  </Typography>
                  {emp.isNetManual && <Chip label="手動覆寫中" size="small" color="warning" sx={{ height: 20, fontSize: 10 }} />}
                </Box>
                <Typography variant="h4" fontWeight={900} sx={{ fontFamily: 'monospace', mb: 2, letterSpacing: 1 }}>
                  $ {(emp.netSalary ?? 0).toLocaleString('zh-TW')}
                </Typography>
                <TextField
                  label="手動修改實发金額"
                  size="small"
                  fullWidth
                  value={emp.isNetManual ? (emp.netSalary || '') : ''}
                  placeholder="如需手動輸入請在此填入"
                  inputProps={{ inputMode: 'numeric', style: { textAlign: 'right', color: 'white' } }}
                  InputLabelProps={{ style: { color: 'rgba(255,255,255,0.7)' } }}
                  sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' } }}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0
                    set('isNetManual', true)
                    set('netSalary', v)
                  }}
                />
                {emp.isNetManual && (
                  <Button size="small" sx={{ mt: 1, color: 'rgba(255,255,255,0.7)' }}
                    onClick={() => set('isNetManual', false)}>
                    ↺ 恢復自動計算
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </SectionCard>

        {/* ── 第六區：備註 (獨立 100% 寬度 Card) ── */}
        <SectionCard title="備註" icon="📝">
          <TextField
            label="備註說明（選填）"
            value={emp.remark}
            onChange={e => set('remark', e.target.value)}
            multiline
            minRows={4}
            maxRows={10}
            fullWidth
            placeholder={`例如：\n・本月請假扣薪 2 天。\n・補發上月加班費。\n・年度績效獎金已併入本月薪資。\n・其他薪資說明事項……`}
            inputProps={{ maxLength: 2000 }}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: 3 },
              '& textarea': { lineHeight: 1.7 },
            }}
          />
          {emp.remark.length > 0 && (
            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}>
              {emp.remark.length} / 2000
            </Typography>
          )}
        </SectionCard>

      </Box>

      {/* Fixed Bottom Save Bar */}
      <Box sx={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        bgcolor: 'white', borderTop: '1px solid #E5E7EB',
        px: 2, py: 1.5, display: 'flex', gap: 1.5, zIndex: 1000,
        boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
      }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={onBack}
          sx={{ borderRadius: 2.5, py: 1.2, fontWeight: 700, maxWidth: 840, mx: 'auto' }}
        >
          取消
        </Button>
        <Button
          variant="contained"
          fullWidth
          disabled={saving}
          onClick={handleSave}
          sx={{ borderRadius: 2.5, py: 1.2, fontWeight: 700, maxWidth: 840, mx: 'auto' }}
        >
          {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <><SaveSvg /> 儲存此薪資單</>}
        </Button>
      </Box>
    </Box>
  )
}
