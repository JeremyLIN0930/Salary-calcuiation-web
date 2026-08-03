import React, { useState } from 'react'
import {
  Box, Typography, Card, CardContent, TextField, Button, Stack,
} from '@mui/material'
import { useSettings } from '../../context/SettingsContext'
import { useSnackbar } from '../../context/SnackbarContext'

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const { showSnackbar } = useSnackbar()

  const [form, setForm] = useState({
    companyName: settings.companyName,
    taxId: settings.taxId,
    phone: settings.phone,
    address: settings.address,
  })

  const handleSave = () => {
    updateSettings(form)
    showSnackbar('系統設定已成功儲存！', 'success')
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', px: 2, py: 3 }}>
      <Typography variant="h5" fontWeight={900} color="primary.main" sx={{ mb: 0.5 }}>
        系統設定
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        預設公司基本資料，供薪資單與排班表自動帶入抬頭資訊。
      </Typography>

      <Card variant="outlined" sx={{ borderRadius: 3, p: 1 }}>
        <CardContent>
          <Stack spacing={2.5}>
            <TextField
              label="公司名稱"
              value={form.companyName}
              size="small"
              fullWidth
              onChange={e => setForm({ ...form, companyName: e.target.value })}
            />

            <TextField
              label="統一編號"
              value={form.taxId}
              size="small"
              fullWidth
              onChange={e => setForm({ ...form, taxId: e.target.value })}
            />

            <TextField
              label="聯絡電話"
              value={form.phone}
              size="small"
              fullWidth
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />

            <TextField
              label="公司地址"
              value={form.address}
              size="small"
              fullWidth
              onChange={e => setForm({ ...form, address: e.target.value })}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
              <Button variant="contained" onClick={handleSave} sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}>
                儲存設定
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
