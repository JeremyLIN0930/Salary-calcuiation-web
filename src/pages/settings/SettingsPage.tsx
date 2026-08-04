import React, { useState, useRef } from 'react'
import {
  Box, Typography, Card, CardContent, TextField, Button, Stack, Grid, CircularProgress,
} from '@mui/material'
import { useSettings } from '../../context/SettingsContext'
import { useSnackbar } from '../../context/SnackbarContext'
import { useAppearance, ThemeMode, UiDensity } from '../../context/AppearanceContext'
import PageHeader from '../../components/common/PageHeader'
import PageContainer from '../../components/common/PageContainer'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { BackupService, BackupSchema } from '../../services/backup/backup.service'

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const { showSnackbar } = useSnackbar()
  const { themeMode, setThemeMode, uiDensity, setUiDensity } = useAppearance()

  // Form State
  const [form, setForm] = useState({
    companyName: settings.companyName,
    taxId: settings.taxId,
    phone: settings.phone,
    address: settings.address,
  })

  // Action states
  const [loading, setLoading] = useState(false)
  const [importPendingData, setImportPendingData] = useState<BackupSchema | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    updateSettings(form)
    showSnackbar('系統設定已成功儲存！', 'success')
  }

  // ① 匯出所有資料
  const handleExportAll = async () => {
    setLoading(true)
    try {
      const { jsonStr, fileName } = await BackupService.exportBackup()
      BackupService.downloadFile(jsonStr, fileName)
      showSnackbar('所有資料已成功匯出！', 'success')
    } catch (err) {
      console.error('Export error:', err)
      showSnackbar('資料匯出失敗，請重試。', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ③ 建立備份
  const handleCreateBackup = async () => {
    setLoading(true)
    try {
      const { jsonStr, fileName } = await BackupService.exportBackup()
      BackupService.downloadFile(jsonStr, fileName)
      showSnackbar('備份建立完成。', 'success')
    } catch (err) {
      console.error('Backup error:', err)
      showSnackbar('備份建立失敗，請重試。', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ② 匯入資料 - 檔案選擇監聽與備份檔驗證
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const validatedBackup = BackupService.validateBackupJson(content)
        setImportPendingData(validatedBackup)
      } catch (err: any) {
        console.error('Validation error:', err)
        showSnackbar(err.message || '備份檔格式錯誤。', 'error')
      }
    }
    reader.readAsText(file)

    // Reset input value so same file can be re-selected
    e.target.value = ''
  }

  // ② 匯入資料 - 確認執行
  const handleConfirmImport = async () => {
    if (!importPendingData) return
    setLoading(true)
    try {
      await BackupService.restoreBackup(importPendingData)
      showSnackbar('資料匯入成功。', 'success')
      setTimeout(() => {
        window.location.reload()
      }, 800)
    } catch (err) {
      console.error('Restore error:', err)
      showSnackbar('備份檔格式錯誤。', 'error')
    } finally {
      setLoading(false)
      setImportPendingData(null)
    }
  }

  // ④ 清除全部資料 - 確認執行
  const handleConfirmClear = async () => {
    setLoading(true)
    try {
      await BackupService.clearAllData()
      showSnackbar('所有資料已清除。', 'info')
      setTimeout(() => {
        window.location.reload()
      }, 800)
    } catch (err) {
      console.error('Clear error:', err)
      showSnackbar('清除失敗，請重試。', 'error')
    } finally {
      setLoading(false)
      setShowClearConfirm(false)
    }
  }

  return (
    <PageContainer maxWidth={840}>
      <PageHeader
        title="⚙️ 系統設定"
        subtitle="預設公司基本資料，供薪資單與排班表自動帶入抬頭資訊。"
      />

      {/* Hidden File Input for Import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* ── 區塊一：基本資料設定 ── */}
      <Card variant="outlined" sx={{ borderRadius: 4, mb: 4, p: 1 }}>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ mb: 2.5, fontSize: 18 }}>
            📋 公司資訊
          </Typography>
          <Stack spacing={2.5}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="公司名稱"
                  value={form.companyName}
                  size="small"
                  fullWidth
                  onChange={e => setForm({ ...form, companyName: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="統一編號"
                  value={form.taxId}
                  size="small"
                  fullWidth
                  onChange={e => setForm({ ...form, taxId: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="聯絡電話"
                  value={form.phone}
                  size="small"
                  fullWidth
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="公司地址"
                  value={form.address}
                  size="small"
                  fullWidth
                  onChange={e => setForm({ ...form, address: e.target.value })}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
              <Button
                variant="contained"
                onClick={handleSave}
                sx={{ borderRadius: 2.5, fontWeight: 700, px: 3, height: 52 }}
              >
                儲存設定
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* ── 區塊二：外觀設定 (Appearance Settings) ── */}
      <Card variant="outlined" sx={{ borderRadius: 4, p: 1, mb: 3 }}>
        <CardContent sx={{ p: { xs: 2.25, sm: 3 }, '&:last-child': { pb: 3 } }}>
          <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ fontSize: 18, mb: 0.5 }}>
            🌙 外觀設定
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            自訂系統外觀視覺主題與介面元素大小。
          </Typography>

          <Grid container spacing={2}>
            {/* 卡片一：主題模式 */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                  🌙 主題模式
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  選擇系統外觀。
                </Typography>

                <Grid container spacing={1.25}>
                  {[
                    { key: 'system' as ThemeMode, label: '跟隨系統', icon: '💻' },
                    { key: 'light' as ThemeMode, label: '淺色模式', icon: '☀️' },
                    { key: 'dark' as ThemeMode, label: '深色模式', icon: '🌙' },
                  ].map(item => {
                    const isSelected = themeMode === item.key
                    return (
                      <Grid item xs={12} sm={4} key={item.key}>
                        <Button
                          fullWidth
                          variant={isSelected ? 'contained' : 'outlined'}
                          onClick={() => setThemeMode(item.key)}
                          sx={{
                            borderRadius: 2.5,
                            height: 64,
                            fontWeight: 700,
                            fontSize: { xs: 13, sm: 14 },
                            bgcolor: isSelected ? '#2F80ED' : 'background.paper',
                            color: isSelected ? '#FFFFFF' : 'text.primary',
                            borderColor: isSelected ? '#2F80ED' : 'divider',
                            flexDirection: 'column',
                            gap: 0.25,
                            py: 0.75,
                            whiteSpace: 'nowrap',
                            '&:hover': {
                              bgcolor: isSelected ? '#1D6FD8' : 'action.hover',
                            },
                          }}
                        >
                          <span style={{ fontSize: 16 }}>{item.icon}</span>
                          <span>{item.label}</span>
                        </Button>
                      </Grid>
                    )
                  })}
                </Grid>
              </Box>
            </Grid>

            {/* 卡片二：介面大小 */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                  🔠 介面大小
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  調整介面元素與字體大小。
                </Typography>

                <Grid container spacing={1.25}>
                  {[
                    { key: 'compact' as UiDensity, label: '緊湊', desc: 'Compact' },
                    { key: 'default' as UiDensity, label: '標準', desc: 'Default' },
                    { key: 'comfort' as UiDensity, label: '舒適', desc: 'Comfort' },
                  ].map(item => {
                    const isSelected = uiDensity === item.key
                    return (
                      <Grid item xs={12} sm={4} key={item.key}>
                        <Button
                          fullWidth
                          variant={isSelected ? 'contained' : 'outlined'}
                          onClick={() => setUiDensity(item.key)}
                          sx={{
                            borderRadius: 2.5,
                            height: 64,
                            fontWeight: 700,
                            fontSize: { xs: 13, sm: 14 },
                            bgcolor: isSelected ? '#2F80ED' : 'background.paper',
                            color: isSelected ? '#FFFFFF' : 'text.primary',
                            borderColor: isSelected ? '#2F80ED' : 'divider',
                            flexDirection: 'column',
                            gap: 0.25,
                            py: 0.75,
                            whiteSpace: 'nowrap',
                            '&:hover': {
                              bgcolor: isSelected ? '#1D6FD8' : 'action.hover',
                            },
                          }}
                        >
                          <span>{item.label}</span>
                          <span style={{ fontSize: 11, opacity: 0.8 }}>({item.desc})</span>
                        </Button>
                      </Grid>
                    )
                  })}
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ── 區塊三：資料管理 (Data Management) ── */}
      <Card variant="outlined" sx={{ borderRadius: 4, p: 1 }}>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ fontSize: 18 }}>
            💾 資料管理
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
            管理系統資料、建立備份及還原資料。
          </Typography>

          <Grid container spacing={2}>
            {/* ① 匯出所有資料 */}
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                fullWidth
                disabled={loading}
                onClick={handleExportAll}
                sx={{ height: 52, borderRadius: 3, fontWeight: 700, fontSize: 16 }}
              >
                {loading ? <CircularProgress size={20} /> : '匯出所有資料'}
              </Button>
            </Grid>

            {/* ② 匯入資料 */}
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                fullWidth
                disabled={loading}
                onClick={() => fileInputRef.current?.click()}
                sx={{ height: 52, borderRadius: 3, fontWeight: 700, fontSize: 16 }}
              >
                匯入資料
              </Button>
            </Grid>

            {/* ③ 建立備份 */}
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                onClick={handleCreateBackup}
                sx={{ height: 52, borderRadius: 3, fontWeight: 700, fontSize: 16 }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : '立即建立備份'}
              </Button>
            </Grid>

            {/* ④ 清除全部資料 */}
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                color="error"
                fullWidth
                disabled={loading}
                onClick={() => setShowClearConfirm(true)}
                sx={{ height: 52, borderRadius: 3, fontWeight: 700, fontSize: 16 }}
              >
                清除全部資料
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ── Confirm Dialog: 匯入資料確認 ── */}
      <ConfirmDialog
        open={!!importPendingData}
        title="即將匯入資料"
        content="目前資料將被取代。是否繼續？"
        confirmText="確認匯入"
        confirmColor="primary"
        onClose={() => setImportPendingData(null)}
        onConfirm={handleConfirmImport}
      />

      {/* ── Confirm Dialog: 清除全部資料確認 ── */}
      <ConfirmDialog
        open={showClearConfirm}
        title="確定要清除所有資料？"
        content="此操作無法復原。將刪除：所有薪資、所有排班、所有員工、所有設定。"
        confirmText="確認清除"
        confirmColor="error"
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleConfirmClear}
      />
    </PageContainer>
  )
}
