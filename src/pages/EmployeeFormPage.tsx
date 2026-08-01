import React, { useState, useEffect } from 'react'
import {
  Box, Button, TextField, Grid, Typography, AppBar, Toolbar,
  IconButton, Chip, Alert, Snackbar, Divider, Paper
} from '@mui/material'
import { Employee, createEmptyEmployee, calcGross, calcDeductions } from '../types/employee'
import { useEmployees } from '../context/EmployeeContext'

// Inline SVG icons — no @mui/icons-material dependency
const ArrowBackSvg = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
  </svg>
)
const SaveSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:6}}>
    <path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16a3 3 0 110-6 3 3 0 010 6zm3-10H5V5h10v4z"/>
  </svg>
)

// Section header
function SectionHeader({ title, icon, expanded, onToggle }: {
  title: string; icon: string; expanded: boolean; onToggle: () => void
}) {
  return (
    <Box
      onClick={onToggle}
      sx={{
        display: 'flex', alignItems: 'center', px: 2.5, py: 1.8,
        cursor: 'pointer', userSelect: 'none', bgcolor: 'background.paper',
        borderRadius: expanded ? '12px 12px 0 0' : 3,
        '&:hover': { bgcolor: '#f0f4ff' }, transition: 'background 0.15s',
        border: '1px solid', borderColor: 'divider',
        borderBottom: expanded ? 'none' : '1px solid',
      }}
    >
      <Typography sx={{ mr: 1, fontSize: 18 }}>{icon}</Typography>
      <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1, color: 'text.primary', letterSpacing: 0.3 }}>
        {title}
      </Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: 20, lineHeight: 1 }}>
        {expanded ? '▲' : '▼'}
      </Typography>
    </Box>
  )
}

function Section({ title, icon, children, defaultOpen = true }: {
  title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Box sx={{ mb: 2 }}>
      <SectionHeader title={title} icon={icon} expanded={open} onToggle={() => setOpen(o => !o)} />
      {open && (
        <Box sx={{
          bgcolor: 'background.paper', p: 2.5,
          border: '1px solid', borderColor: 'divider',
          borderTop: 'none', borderRadius: '0 0 12px 12px'
        }}>
          {children}
        </Box>
      )}
    </Box>
  )
}

// Number field: right-aligned, thousand separator on blur
function MoneyField({ label, value, onChange, highlight }: {
  label: string; value: number; onChange: (v: number) => void; highlight?: boolean
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
      size="small"
      fullWidth
      inputProps={{ inputMode: 'numeric', style: { textAlign: 'right' } }}
      InputProps={{ startAdornment: <Typography sx={{ color: 'text.secondary', mr: 0.5, fontSize: 14 }}>$</Typography> }}
      sx={highlight ? { '& .MuiOutlinedInput-root': { borderColor: 'primary.main' } } : undefined}
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
      size="small"
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
  const { dispatch } = useEmployees()
  const [emp, setEmp] = useState<Employee>(editEmployee ? { ...editEmployee } : createEmptyEmployee())
  const [errors, setErrors] = useState<{ name?: string; month?: string }>({})
  const [saved, setSaved] = useState(false)

  // Auto-calc gross
  useEffect(() => {
    if (emp.isGrossManual) return
    const auto = calcGross(emp)
    setEmp(p => ({ ...p, grossSalary: auto }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emp.baseSalary, emp.mealAllowance, emp.positionAllowance, emp.otherAllowance,
      emp.nightAllowance, emp.bonusItems, emp.profitSharing, emp.otherAdditions,
      emp.specialLeaveAllowance, emp.weekdayOT, emp.restDayOT, emp.holidayOT,
      emp.sickLeaveDeduction, emp.isGrossManual])

  // Auto-calc deductions
  useEffect(() => {
    if (emp.isDeductionManual) return
    const auto = calcDeductions(emp)
    setEmp(p => ({ ...p, totalDeductions: auto }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emp.laborInsurance, emp.healthInsurance, emp.laborPension, emp.incomeTax, emp.otherDeductions, emp.isDeductionManual])

  // Auto-calc net
  useEffect(() => {
    if (emp.isNetManual) return
    setEmp(p => ({ ...p, netSalary: p.grossSalary - p.totalDeductions }))
  }, [emp.grossSalary, emp.totalDeductions, emp.isNetManual])

  const set = <K extends keyof Employee>(key: K, val: Employee[K]) =>
    setEmp(p => ({ ...p, [key]: val }))

  const money = (key: keyof Employee) => (v: number) => setEmp(p => ({ ...p, [key]: v }))

  const handleSave = () => {
    const e: typeof errors = {}
    if (!emp.name.trim()) e.name = '姓名為必填'
    if (!emp.month) e.month = '月份為必填'
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    if (editEmployee) dispatch({ type: 'UPDATE', payload: emp })
    else dispatch({ type: 'ADD', payload: emp })
    setSaved(true)
    setTimeout(onBack, 800)
  }

  return (
    <Box sx={{ bgcolor: '#f5f6fa', minHeight: '100vh', pb: 14 }}>
      {/* Header */}
      <AppBar position="sticky" elevation={0}
        sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <IconButton onClick={onBack} edge="start" sx={{ mr: 1, color: 'text.primary' }}>
            <ArrowBackSvg />
          </IconButton>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1, color: 'text.primary', fontSize: 17 }}>
            {editEmployee ? '編輯員工薪資' : '新增員工薪資'}
          </Typography>
          {emp.name && <Chip label={emp.name} size="small" color="primary" variant="outlined" />}
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 720, mx: 'auto', px: 2, pt: 2 }}>

        {/* 第一區：基本資料 */}
        <Section title="基本資料" icon="👤">
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="姓名 *" value={emp.name} fullWidth size="small"
                error={!!errors.name} helperText={errors.name}
                onChange={e => set('name', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="月份 *" type="month" value={emp.month} fullWidth size="small"
                error={!!errors.month} helperText={errors.month}
                InputLabelProps={{ shrink: true }}
                onChange={e => set('month', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="部門" value={emp.department} fullWidth size="small"
                onChange={e => set('department', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="職稱（可留空）" value={emp.jobTitle} fullWidth size="small"
                onChange={e => set('jobTitle', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="員工編號（可留空）" value={emp.employeeId} fullWidth size="small"
                onChange={e => set('employeeId', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="發薪日期" type="date" value={emp.payDate} fullWidth size="small"
                InputLabelProps={{ shrink: true }}
                onChange={e => set('payDate', e.target.value)} />
            </Grid>
          </Grid>
        </Section>

        {/* 第二區：薪資資料 */}
        <Section title="薪資資料" icon="💰">
          <Grid container spacing={2}>
            {([
              ['本薪', 'baseSalary'], ['伙食津貼', 'mealAllowance'],
              ['職務津貼', 'positionAllowance'], ['其他津貼', 'otherAllowance'],
              ['夜勤津貼', 'nightAllowance'], ['津貼/獎金項目', 'bonusItems'],
              ['盈餘分紅', 'profitSharing'], ['其他加款', 'otherAdditions'],
              ['特別假津貼', 'specialLeaveAllowance'], ['平日加班費', 'weekdayOT'],
              ['休息日加班費', 'restDayOT'], ['國定假日加班費', 'holidayOT'],
              ['事病假扣款', 'sickLeaveDeduction'],
            ] as [string, keyof Employee][]).map(([label, key]) => (
              <Grid item xs={12} sm={6} key={key}>
                <MoneyField label={label} value={emp[key] as number} onChange={money(key)} />
              </Grid>
            ))}

            {/* 應發薪資 */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, borderColor: emp.isGrossManual ? 'warning.main' : 'primary.main', borderWidth: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                  <Typography variant="body2" fontWeight={700} color="primary.main">應發薪資</Typography>
                  {emp.isGrossManual && <Chip label="手動覆寫中" size="small" color="warning" sx={{ height: 20, fontSize: 10 }} />}
                  {!emp.isGrossManual && <Chip label="自動計算" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: 10 }} />}
                </Box>
                <MoneyField label="應發薪資" value={emp.grossSalary}
                  onChange={v => { set('isGrossManual', true); set('grossSalary', v) }} />
                {emp.isGrossManual && (
                  <Button size="small" sx={{ mt: 1 }} onClick={() => set('isGrossManual', false)}>↺ 恢復自動計算</Button>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Section>

        {/* 第三區：代扣資料 */}
        <Section title="代扣資料" icon="📋">
          <Grid container spacing={2}>
            {([
              ['勞保費', 'laborInsurance'], ['健保費', 'healthInsurance'],
              ['勞退個人自提', 'laborPension'], ['所得稅', 'incomeTax'],
              ['其他扣款', 'otherDeductions'],
            ] as [string, keyof Employee][]).map(([label, key]) => (
              <Grid item xs={12} sm={6} key={key}>
                <MoneyField label={label} value={emp[key] as number} onChange={money(key)} />
              </Grid>
            ))}

            {/* 代扣合計 */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, borderColor: emp.isDeductionManual ? 'warning.main' : 'error.light', borderWidth: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                  <Typography variant="body2" fontWeight={700} color="error.main">代扣合計</Typography>
                  {emp.isDeductionManual && <Chip label="手動覆寫中" size="small" color="warning" sx={{ height: 20, fontSize: 10 }} />}
                </Box>
                <MoneyField label="代扣合計" value={emp.totalDeductions}
                  onChange={v => { set('isDeductionManual', true); set('totalDeductions', v) }} />
                {emp.isDeductionManual && (
                  <Button size="small" sx={{ mt: 1 }} onClick={() => set('isDeductionManual', false)}>↺ 恢復自動計算</Button>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Section>

        {/* 第四區：考勤資料 */}
        <Section title="考勤資料" icon="🕐">
          <Grid container spacing={2}>
            {([
              ['年假剩餘特別假（日）', 'annualLeaveRemaining'],
              ['結轉特別假（日）', 'carriedOverLeave'],
              ['加班前 2 小時', 'ot2Hours'],
              ['加班 2 後小時', 'otAfter2Hours'],
              ['休息日前 2 小時', 'restDay2Hours'],
              ['休息日後 6 小時', 'restDayAfter6Hours'],
              ['休息日 8 小時後', 'restDay8HoursAfter'],
              ['國定假日出勤（時）', 'holidayAttendance'],
              ['事假時數（時）', 'sickLeaveHours'],
              ['病假時數（時）', 'personalLeaveHours'],
            ] as [string, keyof Employee][]).map(([label, key]) => (
              <Grid item xs={12} sm={6} key={key}>
                <PlainField label={label} value={emp[key] as number} onChange={money(key)} />
              </Grid>
            ))}
            <Grid item xs={12} sm={6}>
              <MoneyField label="加班費計算基礎" value={emp.otBaseRate} onChange={money('otBaseRate')} />
            </Grid>
          </Grid>
        </Section>

        {/* 第五區：退休金與實發 */}
        <Section title="退休金與實發金額" icon="🏦">
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <MoneyField label="公司提撥退休金" value={emp.companyPensionContribution} onChange={money('companyPensionContribution')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MoneyField label="當月提撥退休金" value={emp.monthlyPensionContribution} onChange={money('monthlyPensionContribution')} />
            </Grid>

            {/* 實發金額 */}
            <Grid item xs={12}>
              <Box sx={{ bgcolor: '#1a237e', borderRadius: 3, p: 2.5, color: 'white' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    實發金額（應發薪資 − 代扣合計）
                  </Typography>
                  {emp.isNetManual && <Chip label="手動覆寫中" size="small" color="warning" sx={{ height: 20, fontSize: 10 }} />}
                </Box>
                <Typography variant="h4" fontWeight={900} sx={{ fontFamily: 'monospace', mb: 2, letterSpacing: 1 }}>
                  $ {(emp.netSalary ?? 0).toLocaleString('zh-TW')}
                </Typography>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', mb: 2 }} />
                <TextField
                  label="手動修改實發金額"
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
        </Section>
      </Box>

      {/* Bottom Bar */}
      <Box sx={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        bgcolor: 'white', borderTop: '1px solid #e0e0e0',
        px: 2, py: 1.5, display: 'flex', gap: 1.5,
        boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
      }}>
        <Button variant="outlined" fullWidth onClick={onBack}
          sx={{ borderRadius: 2, py: 1.2, fontWeight: 600, maxWidth: 720, mx: 'auto' }}>
          取消
        </Button>
        <Button variant="contained" fullWidth onClick={handleSave}
          sx={{ borderRadius: 2, py: 1.2, fontWeight: 700, maxWidth: 720, mx: 'auto' }}>
          <SaveSvg /> 儲存此員工
        </Button>
      </Box>

      <Snackbar open={saved} autoHideDuration={2000} onClose={() => setSaved(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" sx={{ borderRadius: 2 }}>已成功儲存！</Alert>
      </Snackbar>
    </Box>
  )
}
