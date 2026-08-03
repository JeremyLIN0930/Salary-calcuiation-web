import React, { useState } from 'react'
import {
  Box, Typography, Button, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, Stack, Tooltip,
} from '@mui/material'
import { useMasterEmployees } from '../../context/MasterEmployeeContext'
import { useSnackbar } from '../../context/SnackbarContext'
import { MasterEmployee } from '../../types/masterEmployee'
import { DEFAULT_STORES } from '../../types/store'

const AddSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6 }}>
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
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

export default function EmployeeManagementPage() {
  const { state, dispatch } = useMasterEmployees()
  const { showSnackbar }    = useSnackbar()

  const [dialogOpen, setDialogOpen]     = useState(false)
  const [editingItem, setEditingItem]   = useState<MasterEmployee | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MasterEmployee | null>(null)

  const [name, setName]         = useState('')
  const [store, setStore]       = useState('慶東門市')
  const [hireDate, setHireDate] = useState('')
  const [remark, setRemark]     = useState('')
  const [errors, setErrors]     = useState<Record<string, string>>({})

  const openAdd = () => {
    setEditingItem(null)
    setName('')
    setStore('慶東門市')
    setHireDate('')
    setRemark('')
    setErrors({})
    setDialogOpen(true)
  }

  const openEdit = (emp: MasterEmployee) => {
    setEditingItem(emp)
    setName(emp.name)
    setStore(emp.store || '慶東門市')
    setHireDate(emp.hireDate || '')
    setRemark(emp.remark || '')
    setErrors({})
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!name.trim()) {
      setErrors({ name: '姓名為必填' })
      return
    }

    const now = new Date().toISOString()
    if (editingItem) {
      const updated: MasterEmployee = {
        ...editingItem,
        name: name.trim(),
        store,
        hireDate,
        remark,
        updatedAt: now,
      }
      dispatch({ type: 'UPDATE', payload: updated })
      showSnackbar('員工資料已成功更新！')
    } else {
      const newEmp: MasterEmployee = {
        id: Math.random().toString(36).slice(2),
        name: name.trim(),
        store,
        hireDate,
        remark,
        createdAt: now,
        updatedAt: now,
      }
      dispatch({ type: 'ADD', payload: newEmp })
      showSnackbar('全新員工資料已成功建立！')
    }

    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (deleteTarget) {
      dispatch({ type: 'DELETE', payload: deleteTarget.id })
      showSnackbar('員工資料已刪除！')
      setDeleteTarget(null)
    }
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={900} color="primary.main">
            員工管理
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            共用員工主資料庫。在此建立員工後，薪資管理與排班管理可直接選擇取用。
          </Typography>
        </Box>

        <Button variant="contained" onClick={openAdd} sx={{ borderRadius: 2.5, px: 2.5, fontWeight: 700 }}>
          <AddSvg />
          新增員工
        </Button>
      </Box>

      <Card variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8F9FA' }}>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>姓名</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>所屬門市</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>到職日</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>備註</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, py: 1.5 }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {state.employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.disabled' }}>
                    目前尚無共用員工資料，請點擊「新增員工」按鈕建立。
                  </TableCell>
                </TableRow>
              ) : (
                state.employees.map(emp => (
                  <TableRow key={emp.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{emp.name}</TableCell>
                    <TableCell>{emp.store || '—'}</TableCell>
                    <TableCell>{emp.hireDate || '—'}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{emp.remark || '—'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="編輯員工">
                        <IconButton size="small" color="primary" onClick={() => openEdit(emp)}>
                          <EditSvg />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="刪除員工">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(emp)}>
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
      </Card>

      {/* Add/Edit Master Employee Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>{editingItem ? '編輯員工資料' : '新增共用員工'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="姓名 *"
              value={name}
              size="small"
              fullWidth
              error={!!errors.name}
              helperText={errors.name}
              onChange={e => setName(e.target.value)}
            />

            <FormControl fullWidth size="small">
              <InputLabel>門市</InputLabel>
              <Select value={store} label="門市" onChange={e => setStore(e.target.value)}>
                {DEFAULT_STORES.map(s => (
                  <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="到職日"
              type="date"
              value={hireDate}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              onChange={e => setHireDate(e.target.value)}
            />

            <TextField
              label="備註"
              value={remark}
              size="small"
              fullWidth
              multiline
              rows={2}
              onChange={e => setRemark(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDialogOpen(false)} sx={{ borderRadius: 2 }}>
            取消
          </Button>
          <Button variant="contained" onClick={handleSave} sx={{ borderRadius: 2 }}>
            儲存
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>確定刪除員工？</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            確定要從主員工名單中刪除「{deleteTarget?.name}」？此操作不會影響已儲存的歷史薪資或排班紀錄。
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
    </Box>
  )
}
