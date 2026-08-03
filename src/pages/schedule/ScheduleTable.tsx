import React, { useState } from 'react'
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, IconButton, TextField, Box, Typography, Tooltip,
} from '@mui/material'
import { ScheduleEmployee, Shift } from '../../types/schedule'
import ScheduleCell from './ScheduleCell'
import ScheduleDialog from './ScheduleDialog'

const AddSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6 }}>
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
)
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

  // Add new employee row
  const handleAddEmployee = () => {
    const newEmp: ScheduleEmployee = {
      id: Math.random().toString(36).slice(2),
      name: '',
      shifts: [],
    }
    onChangeEmployees([...employees, newEmp])
  }

  // Delete employee row
  const handleDeleteEmployee = (id: string) => {
    onChangeEmployees(employees.filter(e => e.id !== id))
  }

  // Update employee name
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
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.disabled' }}>
                  尚無員工，請點擊左下角「新增員工」建立排班資料
                </TableCell>
              </TableRow>
            ) : (
              employees.map(emp => (
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
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Employee Row Toolbar */}
      <Box sx={{ p: 1.5, bgcolor: '#FAFBFD', borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center' }}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleAddEmployee}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          <AddSvg />
          新增員工
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
          共 {employees.length} 位員工
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
    </Paper>
  )
}
