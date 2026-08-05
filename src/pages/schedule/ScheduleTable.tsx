import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, IconButton, TextField, Box, Typography, Tooltip,
  Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions, Stack,
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

const WEEKDAY_NAMES = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']

export default function ScheduleTable({ weekDates, employees, onChangeEmployees }: Props) {
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null)
  const { state: masterState, addEmployee: masterAddEmployee } = useMasterEmployees()
  const { showSnackbar } = useSnackbar()

  // State for Add Employee Dialog / Expanded Input
  const [addEmpModalOpen, setAddEmpModalOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [pendingNewName, setPendingNewName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Master Employee Option Type for Autocomplete
  interface MasterOptionItem {
    id: string
    name: string
    store?: string
    isShared?: boolean
    isNewOption?: boolean
  }

  // Sorted Master Employee Options for Autocomplete
  const masterOptions = useMemo<MasterOptionItem[]>(() => {
    return [...masterState.employees]
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'))
      .map(m => ({
        id: m.id,
        name: m.name,
        store: m.store,
        isShared: m.isShared,
      }))
  }, [masterState.employees])

  // Reset search input value whenever modal is opened
  useEffect(() => {
    if (addEmpModalOpen) {
      setInputValue('')
    }
  }, [addEmpModalOpen])

  // Custom filter options for Autocomplete
  const filterOptions = (options: MasterOptionItem[], state: { inputValue: string }) => {
    const q = state.inputValue.trim().toLowerCase()
    // 1. Result list initially displays NO options until user types keyword
    if (!q) return []

    const filtered = options.filter(opt => {
      const nameMatch = opt.name.toLowerCase().includes(q)
      const storeMatch = opt.store ? opt.store.toLowerCase().includes(q) : false
      return nameMatch || storeMatch
    })

    // If query is non-empty and doesn't exactly match an existing name, add "➕ 建立新員工"
    if (q && !options.some(opt => opt.name.trim().toLowerCase() === q)) {
      filtered.push({
        id: 'new_custom_emp',
        name: state.inputValue.trim(),
        isNewOption: true,
      })
    }

    return filtered
  }

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
    const match = masterState.employees.find(m => m.name.trim() === name)

    if (match) {
      // Add directly to schedule using existing Master Employee UUID
      const newEmp: ScheduleEmployee = {
        id: match.id,
        name: match.name,
        shifts: [],
      }
      onChangeEmployees([...employees, newEmp])
      setInputValue('')
      setAddEmpModalOpen(false)
      showSnackbar(`已將「${name}」加入排班。`, 'success')
    } else {
      // Ask user if they want to join shared employee list
      setPendingNewName(name)
    }
  }

  // Handle Master Employee sync dialog answer
  const handleConfirmAddToMaster = async (addToMaster: boolean) => {
    if (!pendingNewName) return
    const name = pendingNewName.trim()

    if (addToMaster) {
      const existingMaster = masterState.employees.find(m => m.name.trim().toLowerCase() === name.toLowerCase())
      
      if (existingMaster) {
        const newEmp: ScheduleEmployee = {
          id: existingMaster.id,
          name: existingMaster.name,
          isTemp: false,
          shifts: [],
        }
        onChangeEmployees([...employees, newEmp])
        showSnackbar(`已對應至既有共用員工「${existingMaster.name}」並加入排班。`, 'success')
      } else {
        const newMasterEmp = await masterAddEmployee({
          name,
          isShared: true,
          hireDate: new Date().toISOString().slice(0, 10),
          remark: ''
        })

        const realUuid = newMasterEmp?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2))

        const newEmp: ScheduleEmployee = {
          id: realUuid,
          name,
          isTemp: false,
          shifts: [],
        }

        onChangeEmployees([...employees, newEmp])
        showSnackbar(`已將「${name}」建立為正式員工並加入排班。`, 'success')
      }
    } else {
      // Temporary employee
      const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
      const newEmp: ScheduleEmployee = {
        id: tempId,
        name,
        isTemp: true,
        shifts: [],
      }

      onChangeEmployees([...employees, newEmp])
      showSnackbar(`已將「${name}」以本週臨時工身分加入排班。`, 'info')
    }

    setPendingNewName(null)
    setInputValue('')
    setAddEmpModalOpen(false)
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
    <Paper
      elevation={0}
      sx={{
        borderRadius: '24px',
        bgcolor: '#FFFFFF',
        overflow: 'hidden',
        mb: 3,
        boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
        border: '1px solid #F1F5F9',
      }}
    >
      <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <Table size="small" sx={{ minWidth: { xs: 520, sm: 680, md: '100%' }, tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              {/* Sticky Employee Name Column */}
              <TableCell
                sx={{
                  width: { xs: 110, sm: 140 },
                  fontWeight: 700,
                  fontSize: 13,
                  py: 1.5,
                  px: 1.5,
                  position: 'sticky',
                  left: 0,
                  zIndex: 10,
                  bgcolor: '#F8FAFC',
                  borderRight: '1px solid #E2E8F0',
                  boxShadow: '2px 0 8px rgba(0,0,0,0.03)',
                }}
              >
                員工姓名
              </TableCell>

              {/* 7 Date Columns Header */}
              {weekDates.map((d, index) => {
                const parts = d.date.split('-')
                const dateNumStr = `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`
                const weekdayName = WEEKDAY_NAMES[index] || ''

                return (
                  <TableCell
                    key={d.date}
                    align="center"
                    sx={{
                      width: { xs: 95, sm: 105, md: 'auto' },
                      py: 1.2,
                      px: 0.5,
                      borderRight: '1px solid #F1F5F9',
                      bgcolor: d.isWeekend ? '#EBF3FE' : '#F8FAFC',
                      color: d.isWeekend ? '#2F80ED' : '#1E293B',
                    }}
                  >
                    <Typography variant="caption" display="block" sx={{ fontSize: '11px', color: d.isWeekend ? '#2F80ED' : '#64748B', fontWeight: 600 }}>
                      {weekdayName}
                    </Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ fontSize: '14px', lineHeight: 1.2, mt: 0.2 }}>
                      {dateNumStr}
                    </Typography>
                  </TableCell>
                )
              })}

              {/* Action Column */}
              <TableCell align="center" sx={{ width: { xs: 44, sm: 50 }, fontWeight: 700, fontSize: 12, py: 1.5, px: 0.5 }}>
                操作
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {employees.map(emp => (
              <TableRow key={emp.id} hover sx={{ '&:hover': { bgcolor: '#FAFAFA' } }}>
                {/* Sticky Employee Name cell */}
                <TableCell
                  sx={{
                    p: 1,
                    position: 'sticky',
                    left: 0,
                    zIndex: 9,
                    bgcolor: '#FFFFFF',
                    borderRight: '1px solid #E2E8F0',
                    boxShadow: '2px 0 8px rgba(0,0,0,0.03)',
                  }}
                >
                  <TextField
                    placeholder="輸入姓名"
                    value={emp.name}
                    variant="standard"
                    fullWidth
                    InputProps={{ disableUnderline: true, style: { fontWeight: 700, fontSize: '14px', color: '#1E293B' } }}
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
                      sx={{ p: 0.8 }}
                    >
                      <DelSvg />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Bottom Button: ＋ 新增員工 */}
      <Box sx={{ p: 2, bgcolor: '#FAFBFD', borderTop: '1px solid #F1F5F9' }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => setAddEmpModalOpen(true)}
          sx={{
            borderRadius: '18px',
            height: 46,
            borderColor: '#CBD5E1',
            color: '#4F8FEF',
            fontWeight: 700,
            fontSize: '15px',
            bgcolor: '#FFFFFF',
            '&:hover': {
              borderColor: '#4F8FEF',
              bgcolor: '#EBF3FE',
            },
          }}
        >
          ＋ 新增員工到排班表
        </Button>
      </Box>

      {/* Add Employee Dialog Modal */}
      <Dialog
        open={addEmpModalOpen}
        onClose={() => {
          setAddEmpModalOpen(false)
          setInputValue('')
        }}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle fontWeight={700}>新增員工到排班</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            可自主資料庫搜尋既有員工，或輸入全新姓名建立排班列。
          </Typography>
          <Autocomplete
            freeSolo
            openOnFocus
            options={masterOptions}
            filterOptions={filterOptions}
            noOptionsText={inputValue.trim() ? '未找到相符員工' : '請輸入員工姓名進行搜尋...'}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option
              return option.name
            }}
            inputValue={inputValue}
            onInputChange={(_, newValue) => setInputValue(newValue)}
            onChange={(_, value) => {
              if (!value) return
              if (typeof value === 'string') {
                tryAddEmployeeName(value)
              } else {
                tryAddEmployeeName(value.name)
              }
            }}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: '16px',
                  mt: 1,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  border: '1px solid #F1F5F9',
                },
              },
            }}
            ListboxProps={{
              sx: {
                maxHeight: 280,
                p: 1,
                '& .MuiAutocomplete-option': {
                  borderRadius: '12px',
                  py: 1,
                  px: 1.5,
                  mb: 0.5,
                },
              },
            }}
            renderOption={(props, option) => {
              if (option.isNewOption) {
                return (
                  <Box component="li" {...props} key={option.id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle2" fontWeight={700} color="#2F80ED">
                      ➕ 建立新員工：「{option.name}」
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      點擊將「{option.name}」加入排班
                    </Typography>
                  </Box>
                )
              }

              return (
                <Box component="li" {...props} key={option.id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="body1" fontWeight={700} color="#1E293B">
                    {option.name}
                  </Typography>
                  <Typography variant="caption" color="#64748B">
                    {option.store ? `${option.store} · ` : ''}{option.isShared ? '共用主資料庫員工' : '本店員工'}
                  </Typography>
                </Box>
              )
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                inputRef={inputRef}
                placeholder="搜尋或輸入員工姓名"
                size="small"
                autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                    height: 48,
                    bgcolor: '#F8FAFC',
                    px: 1.5,
                  },
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && inputValue.trim()) {
                    e.preventDefault()
                    tryAddEmployeeName(inputValue)
                  }
                }}
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddEmpModalOpen(false)} sx={{ borderRadius: '12px' }}>
            取消
          </Button>
          <Button
            variant="contained"
            onClick={() => tryAddEmployeeName(inputValue)}
            disabled={!inputValue.trim()}
            sx={{ borderRadius: '12px', px: 3 }}
          >
            確定新增
          </Button>
        </DialogActions>
      </Dialog>

      {/* Master Employee Sync Confirm Dialog */}
      <Dialog
        open={!!pendingNewName}
        onClose={() => handleConfirmAddToMaster(false)}
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle fontWeight={700}>加入共用員工主資料庫？</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            「<strong>{pendingNewName}</strong>」目前不在門市共用員工主資料庫中。
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 選擇「<strong>是</strong>」：建立為正式共用員工（未來可在其他週次選用）<br />
            • 選擇「<strong>否</strong>」：僅作為本週臨時/代班人員使用
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => handleConfirmAddToMaster(false)}
            sx={{ borderRadius: '12px' }}
          >
            否 (僅本週臨時工)
          </Button>
          <Button
            variant="contained"
            onClick={() => handleConfirmAddToMaster(true)}
            sx={{ borderRadius: '12px', px: 2.5 }}
          >
            是 (加入主資料庫)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Shift Edit Cell Dialog */}
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
    </Paper>
  )
}
