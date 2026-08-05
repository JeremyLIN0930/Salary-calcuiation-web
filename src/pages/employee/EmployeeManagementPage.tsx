import React, { useState, useMemo } from 'react'
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, Stack, Tooltip, Chip,
  InputAdornment, Skeleton,
} from '@mui/material'
import { useMasterEmployees } from '../../context/MasterEmployeeContext'
import { useStoreContext } from '../../context/StoreContext'
import { useSnackbar } from '../../context/SnackbarContext'
import { MasterEmployee } from '../../types/masterEmployee'
import { DEFAULT_STORES } from '../../types/store'
import PageHeader from '../../components/common/PageHeader'
import PageContainer from '../../components/common/PageContainer'
import { stripSystemTags } from '../../utils/textUtils'
import { useAppearance } from '../../context/AppearanceContext'

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
const SearchSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
)

export default function EmployeeManagementPage() {
  const { tokens } = useAppearance()
  const { state, addEmployee, updateEmployee, deleteEmployee } = useMasterEmployees()
  const { stores: storeList } = useStoreContext()
  const { showSnackbar }    = useSnackbar()

  const [search, setSearch]             = useState('')
  const [dialogOpen, setDialogOpen]     = useState(false)
  const [editingItem, setEditingItem]   = useState<MasterEmployee | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MasterEmployee | null>(null)

  const [name, setName]         = useState('')
  const [storeId, setStoreId]   = useState<string>(storeList[0]?.id || DEFAULT_STORES[0].id)
  const [isShared, setIsShared] = useState<boolean>(true)
  const [hireDate, setHireDate] = useState('')
  const [remark, setRemark]     = useState('')
  const [errors, setErrors]     = useState<Record<string, string>>({})

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return state.employees
    const q = search.trim().toLowerCase()
    return state.employees.filter(e =>
      e.name.toLowerCase().includes(q) ||
      (e.store && e.store.toLowerCase().includes(q)) ||
      (e.storeName && e.storeName.toLowerCase().includes(q))
    )
  }, [state.employees, search])

  const openAdd = () => {
    setEditingItem(null)
    setName('')
    setStoreId(storeList[0]?.id || DEFAULT_STORES[0].id)
    setIsShared(true)
    setHireDate('')
    setRemark('')
    setErrors({})
    setDialogOpen(true)
  }

  const openEdit = (emp: MasterEmployee) => {
    setEditingItem(emp)
    setName(emp.name)
    const match = storeList.find(s => s.id === emp.storeId || s.name === emp.store || s.id === emp.store)
    setStoreId(match ? match.id : (storeList[0]?.id || DEFAULT_STORES[0].id))
    setIsShared(emp.isShared !== undefined ? emp.isShared : true)
    setHireDate(emp.hireDate || '')
    setRemark(emp.remark || '')
    setErrors({})
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setErrors({ name: '姓名為必填' })
      return
    }

    const selectedStoreObj = storeList.find(s => s.id === storeId) || DEFAULT_STORES[0]
    const now = new Date().toISOString()

    if (editingItem) {
      const updated: MasterEmployee = {
        ...editingItem,
        name: name.trim(),
        store: selectedStoreObj.name,
        storeId: selectedStoreObj.id,
        storeName: selectedStoreObj.name,
        isShared: isShared,
        hireDate,
        remark,
        updatedAt: now,
      }
      const ok = await updateEmployee(updated)
      if (ok) {
        showSnackbar('員工資料已成功更新！', 'success')
      } else {
        showSnackbar('更新失敗，請確認網路連線或重試。', 'error')
      }
    } else {
      const newEmp: Partial<MasterEmployee> = {
        name: name.trim(),
        store: selectedStoreObj.name,
        storeId: selectedStoreObj.id,
        storeName: selectedStoreObj.name,
        isShared: isShared,
        hireDate,
        remark,
        createdAt: now,
        updatedAt: now,
      }
      const res = await addEmployee(newEmp)
      if (res) {
        showSnackbar('全新員工資料已成功建立！', 'success')
      } else {
        showSnackbar('新增失敗，請確認網路連線或重試。', 'error')
      }
    }

    setDialogOpen(false)
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      const ok = await deleteEmployee(deleteTarget.id)
      if (ok) {
        showSnackbar('員工資料已刪除！', 'info')
      } else {
        showSnackbar('刪除失敗，請確認網路連線或重試。', 'error')
      }
      setDeleteTarget(null)
    }
  }

  return (
    <PageContainer maxWidth={1120}>
      {/* ── Page Header (Japanese Minimalism Style) ── */}
      <PageHeader
        title="👥 員工管理"
        subtitle="建立共用員工資料"
        primaryActionLabel="＋ 新增員工"
        onPrimaryAction={openAdd}
        action={
          <Button
            variant="contained"
            onClick={openAdd}
            sx={{
              borderRadius: '16px',
              minHeight: 48,
              px: 3,
              fontWeight: 700,
              fontSize: '15px',
              bgcolor: '#2F80ED',
              boxShadow: '0 4px 12px rgba(47,128,237,0.2)',
              '&:hover': { bgcolor: '#1D6FD8' },
            }}
          >
            <AddSvg />
            新增員工
          </Button>
        }
      />

      {/* ── Search Bar (Sticky on Mobile, Card on Desktop) ── */}
      <Card
        elevation={0}
        sx={{
          p: 1.5,
          mb: 3,
          borderRadius: '24px',
          bgcolor: tokens.card,
          boxShadow: tokens.shadow,
          border: `1px solid ${tokens.border}`,
          position: { xs: 'sticky', sm: 'static' },
          top: { xs: 10, sm: 'auto' },
          zIndex: { xs: 999, sm: 'auto' },
        }}
      >
        <TextField
          placeholder="🔍 搜尋員工姓名或門市..."
          value={search}
          size="small"
          onChange={e => setSearch(e.target.value)}
          sx={{
            width: { xs: '100%', sm: 360 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              height: 48,
              bgcolor: tokens.inputBackground,
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
      </Card>

      {/* ── Apple Table Container ── */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '24px',
          bgcolor: '#FFFFFF',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
          border: '1px solid #F1F5F9',
        }}
      >
        <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#475569', py: 2, px: 2.5 }}>姓名</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#475569', py: 2 }}>類型</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#475569', py: 2 }}>所屬門市</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#475569', py: 2 }}>到職日</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#475569', py: 2 }}>備註</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: 13, color: '#475569', py: 2, px: 2.5 }}>操作</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {state.loading ? (
                [1, 2, 3, 4].map(i => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} sx={{ py: 2 }}>
                      <Skeleton variant="text" height={28} />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, color: '#64748B' }}>
                    {search ? `找不到符合「${search}」的員工` : '目前尚無員工資料，請點擊上方「新增員工」按鈕。'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map(emp => (
                  <TableRow
                    key={emp.id}
                    hover
                    sx={{
                      transition: 'background-color 150ms ease',
                      '&:hover': { bgcolor: '#F8FAFC' },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700, fontSize: 15, color: '#1E293B', py: 2, px: 2.5 }}>
                      {emp.name}
                    </TableCell>

                    <TableCell sx={{ py: 2 }}>
                      <Chip
                        label={emp.isShared !== false ? '共用員工' : '本店員工'}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: 12,
                          borderRadius: '10px',
                          bgcolor: emp.isShared !== false ? '#EBF3FE' : '#F1F5F9',
                          color: emp.isShared !== false ? '#2F80ED' : '#64748B',
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ fontSize: 14, color: '#475569', py: 2 }}>
                      {emp.storeName || emp.store}
                    </TableCell>

                    <TableCell sx={{ fontSize: 14, color: '#64748B', py: 2 }}>
                      {emp.hireDate || '—'}
                    </TableCell>

                    <TableCell sx={{ fontSize: 14, color: '#64748B', py: 2, maxWidth: 200 }}>
                      {stripSystemTags(emp.remark) || '—'}
                    </TableCell>

                    <TableCell align="right" sx={{ py: 2, px: 2.5 }}>
                      <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                        <Tooltip title="編輯員工">
                          <IconButton
                            onClick={() => openEdit(emp)}
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              bgcolor: '#F8FAFC',
                              color: '#475569',
                              '&:hover': { bgcolor: '#F1F5F9', color: '#1F2937' },
                            }}
                          >
                            <EditSvg />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="刪除員工">
                          <IconButton
                            onClick={() => setDeleteTarget(emp)}
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              bgcolor: '#FFF1F2',
                              color: '#E11D48',
                              '&:hover': { bgcolor: '#FFE4E6' },
                            }}
                          >
                            <DelSvg />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ── Dialog: Add/Edit Master Employee ── */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle fontWeight={700}>
          {editingItem ? '編輯員工資料' : '新增員工'}
        </DialogTitle>
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
              <InputLabel>員工類型</InputLabel>
              <Select
                value={isShared ? 'shared' : 'local'}
                label="員工類型"
                onChange={e => setIsShared(e.target.value === 'shared')}
              >
                <MenuItem value="shared">共用員工（所有門市可選取）</MenuItem>
                <MenuItem value="local">本店員工（僅所選門市可使用）</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>門市</InputLabel>
              <Select value={storeId} label="門市" onChange={e => setStoreId(e.target.value)}>
                {storeList.map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
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
          <Button variant="outlined" onClick={() => setDialogOpen(false)} sx={{ borderRadius: '12px' }}>
            取消
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{ borderRadius: '12px', px: 3, bgcolor: '#2F80ED', '&:hover': { bgcolor: '#1D6FD8' } }}
          >
            確定儲存
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Confirm Delete Employee ── */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle fontWeight={700}>確定刪除此員工？</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            您即將刪除「<strong>{deleteTarget?.name}</strong>」。此操作無法復原，確定繼續？
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDeleteTarget(null)} sx={{ borderRadius: '12px' }}>
            取消
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} sx={{ borderRadius: '12px', px: 2.5 }}>
            確定刪除
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  )
}
