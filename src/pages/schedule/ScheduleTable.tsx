import React, { useState, useMemo, useRef } from 'react'
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, IconButton, TextField, Box, Typography, Tooltip,
  Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material'
import { ScheduleEmployee, Shift } from '../../types/schedule'
import { useMasterEmployees } from '../../context/MasterEmployeeContext'
import { useSnackbar } from '../../context/SnackbarContext'
import ScheduleCell from './ScheduleCell'
import ScheduleDialog from './ScheduleDialog'

const DelSvg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
)

interface Props {
  weekDates: { date: string; label: string; isWeekend: boolean }[] // 7 days (Mon-Sun)
  employees: ScheduleEmployee[]
  onChangeEmployees: (emps: ScheduleEmployee[]) => void
}

interface ActiveCell {
  employeeId: string
  employeeName: string
  date: string
  dayLabel: string
  shift?: Shift
}

export default function ScheduleTable({ weekDates, employees, onChangeEmployees }: Props) {
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null)
  const { state: masterState, dispatch: masterDispatch } = useMasterEmployees()
  const { showSnackbar } = useSnackbar()

  // State for Autocomplete input
  const [inputValue, setInputValue] = useState('')
  const [pendingNewName, setPendingNewName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Master Employee Options for Autocomplete
  const masterOptions = useMemo(() => masterState.employees.map(m => m.name), [masterState.employees])

  // Try adding a name to current schedule
  const tryAddEmployeeName = (rawName: string) => {
    const name = rawName.trim()
    if (!name) return

    // 1. Check duplicate in current schedule
    const isDuplicate = employees.some(e => e.name.trim() === name)
    if (isDuplicate) {
      showSnackbar('此員工已在本週排班中。', 'warning')
      setInputValue('')
      return
    }

    // 2. Check if exists in Master Employee database
    const existsInMaster = masterState.employees.some(m => m.name.trim() === name)

    if (existsInMaster) {
      // Add directly to schedule
      const newEmp: ScheduleEmployee = {
        id: Math.random().toString(36).slice(2),
        name,
        shifts: [],
      }
      onChangeEmployees([...employees, newEmp])
      setInputValue('')
      showSnackbar(`已將「${name}」加入排班。`, 'success')
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      // Ask user if they want to sync to Master Employees as well
      setPendingNewName(name)
    }
  }

  // Handle Master Employee sync dialog answer
  const handleConfirmAddToMaster = (addToMaster: boolean) => {
    if (!pendingNewName) return
    const name = pendingNewName

    if (addToMaster) {
      masterDispatch({
        type: 'ADD',
        payload: {
          id: Math.random().toString(36).slice(2),
          name,
          store: '',
          hireDate: '',
          remark: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })
    }

    const newEmp: ScheduleEmployee = {
      id: Math.random().toString(36).slice(2),
      name,
      shifts: [],
    }
    onChangeEmployees([...employees, newEmp])
    setPendingNewName(null)
    setInputValue('')
    showSnackbar(`已將「${name}」加入排班${addToMaster ? '並同步至共用員工名單' : ''}。`, 'success')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // Delete employee row
  const handleDeleteEmployee = (id: string) => {
    onChangeEmployees(employees.filter(e => e.id !== id))
  }

  // Update employee name in place
  const handleUpdateName = (id: string, name: string) => {
    onChangeEmployees(employees.map(e => e.id === id ? { ...e, name } : e))
  }

  // Save shift from dialog
  const handleSaveShift = (newShift: Shift) => {
    if (!activeCell) return
    const updatedEmps = employees.map(emp => {
      if (emp.id !== activeCell.employeeId) return emp
      const existingShifts = emp.shifts.filter(s => s.date !== newShift.date)
      return {
        ...emp,
        shifts: [...existingShifts, newShift],
      }
    })
    onChangeEmployees(updatedEmps)
  }

  // Clear shift from cell
  const handleClearShift = () => {
    if (!activeCell) return
    const updatedEmps = employees.map(emp => {
      if (emp.id !== activeCell.employeeId) return emp
      return {
        ...emp,
        shifts: emp.shifts.filter(s => s.date !== activeCell.date),
      }
    })
    onChangeEmployees(updatedEmps)
  }

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 2 }}>
      <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 700, tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8F9FA' }}>
              <TableCell sx={{ width: 140, fontWeight: 700, fontSize: 13, py: 1.5, borderRight: '1px solid #E5E7EB' }}>
                員工姓名
              </TableCell>
              {weekDates.map(d => (
                <TableCell
                  key={d.date}
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: 13,
                    py: 1.5,
                    borderRight: '1px solid #E5E7EB',
                    bgcolor: d.isWeekend ? '#EFF6FF' : 'inherit',
                    color: d.isWeekend ? 'primary.main' : 'text.primary',
                  }}
                >
                  {d.label}
                </TableCell>
              ))}
              <TableCell align="center" sx={{ width: 50, fontWeight: 700, fontSize: 12, py: 1.5 }}>
                刪除
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {employees.map(emp => (
              <TableRow key={emp.id} hover>
                {/* Employee Name cell */}
                <TableCell sx={{ p: 1, borderRight: '1px solid #E5E7EB' }}>
                  <TextField
                    placeholder="輸入姓名"
                    value={emp.name}
                    variant="standard"
                    fullWidth
                    InputProps={{ disableUnderline: true, style: { fontWeight: 600, fontSize: 14 } }}
                    onChange={e => handleUpdateName(emp.id, e.target.value)}
                  />
                </TableCell>

                {/* 7 Shift Cells */}
                {weekDates.map(d => {
                  const shift = emp.shifts.find(s => s.date === d.date)
                  return (
                    <ScheduleCell
                      key={d.date}
                      shift={shift}
                      onClick={() =>
                        setActiveCell({
                          employeeId: emp.id,
                          employeeName: emp.name || '未命名員工',
                          date: d.date,
                          dayLabel: d.label,
                          shift,
                        })
                      }
                    />
                  )
                })}

                {/* Delete Employee Action */}
                <TableCell align="center" sx={{ p: 0.5 }}>
                  <Tooltip title="刪除此員工列">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteEmployee(emp.id)}
                    >
                      <DelSvg />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

            {/* ── 核心 Autocomplete 新增員工列 ── */}
            <TableRow sx={{ bgcolor: '#FAFBFD' }}>
              <TableCell sx={{ p: 1, borderRight: '1px solid #E5E7EB', minWidth: 200 }}>
                <Autocomplete
                  freeSolo
                  options={masterOptions}
                  value={null}
                  inputValue={inputValue}
                  onInputChange={(e, newInputValue) => setInputValue(newInputValue)}
                  onChange={(e, value) => {
                    if (value) {
                      tryAddEmployeeName(value)
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      inputRef={inputRef}
                      placeholder="輸入姓名或選擇已有員工"
                      size="small"
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: 48,
                          borderRadius: 2,
                          bgcolor: '#ffffff',
                          fontWeight: 600,
                          fontSize: 14,
                        },
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (inputValue.trim()) {
                            tryAddEmployeeName(inputValue)
                          }
                        }
                      }}
                    />
                  )}
                />
              </TableCell>

              {/* Empty placeholder cells for dates */}
              {weekDates.map(d => (
                <TableCell key={d.date} align="center" sx={{ borderRight: '1px solid #E5E7EB', color: '#D1D5DB' }}>
                  —
                </TableCell>
              ))}

              <TableCell align="center" sx={{ color: '#D1D5DB', fontSize: 12 }}>
                新增
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Toolbar Status */}
      <Box sx={{ p: 1.5, bgcolor: '#FAFBFD', borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          已排班員工共 {employees.length} 位 · 輸入姓名可快速連續新增下一位
        </Typography>
      </Box>

      {/* Cell Shift Editor Dialog */}
      {activeCell && (
        <ScheduleDialog
          open={!!activeCell}
          employeeName={activeCell.employeeName}
          date={activeCell.date}
          dayLabel={activeCell.dayLabel}
          shift={activeCell.shift}
          onClose={() => setActiveCell(null)}
          onSave={handleSaveShift}
          onClear={handleClearShift}
        />
      )}

      {/* ── Dialog: 是否同時新增至共用員工名單 ── */}
      <Dialog
        open={!!pendingNewName}
        onClose={() => handleConfirmAddToMaster(false)}
        PaperProps={{ sx: { borderRadius: 3, minWidth: 320 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>是否同時新增至共用員工名單？</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            即將新增「{pendingNewName}」至本週排班，是否一併儲存至員工管理庫，供日後快速選擇？
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => handleConfirmAddToMaster(false)}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            否 (僅新增至本週排班)
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleConfirmAddToMaster(true)}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            是 (同步新增至共用名單)
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
