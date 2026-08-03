import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Card, CardHeader, CardContent, Typography, Button,
  IconButton, Chip, Stack, Divider, Paper, Collapse, CircularProgress, Grid,
} from '@mui/material'
import { supabase, isSupabaseEnvConfigured } from '../../lib/supabase'
import { debugLogger, LogEntry } from '../../utils/debugLogger'
import { supabaseEmployeeRepository } from '../../repositories/SupabaseEmployeeRepository'
import { supabaseSalaryRepository } from '../../repositories/SupabaseSalaryRepository'
import { supabaseScheduleRepository } from '../../repositories/SupabaseScheduleRepository'
import { supabaseStoreRepository } from '../../repositories/SupabaseStoreRepository'
import { supabaseSettingsRepository } from '../../repositories/SupabaseSettingsRepository'

const BugSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 8h-1.81a5.985 5.985 0 00-1.82-1.96l.93-.93a.996.996 0 10-1.41-1.41l-1.47 1.47C12.86 5.06 12.44 5 12 5s-.86.06-1.43.17L9.1 3.7A.996.996 0 107.69 5.11l.93.93C7.69 6.78 6.94 7.58 6.81 8H5c-.55 0-1 .45-1 1s.45 1 1 1h1.09c-.06.33-.09.66-.09 1v1H4c-.55 0-1 .45-1 1s.45 1 1 1h2v1c0 .34.03.67.09 1H5c-.55 0-1 .45-1 1s.45 1 1 1h1.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H19c.55 0 1-.45 1-1s-.45-1-1-1h-1.09c.06-.33.09-.66.09-1v-1h2c.55 0 1-.45 1-1s-.45-1-1-1h-2v-1c0-.34-.03-.67-.09-1H19c.55 0 1-.45 1-1s-.45-1-1-1zm-7 11c-2.76 0-5-2.24-5-5v-4c0-2.76 2.24-5 5-5s5 2.24 5 5v4c0 2.76-2.24 5-5 5z"/>
  </svg>
)
const MinimizeSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13H5v-2h14v2z"/>
  </svg>
)
const ExpandSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
)
const CloseSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
)

interface Counts {
  employees: number
  salaryMonths: number
  salaryRecords: number
  salaryItems: number
  scheduleMonths: number
  scheduleWeeks: number
  scheduleShifts: number
  stores: number
  settings: number
}

export default function DeveloperDebugPanel() {
  if (!import.meta.env.DEV) {
    return null
  }

  const [expanded, setExpanded] = useState(false)
  const [closed, setClosed] = useState(false)
  const [status, setStatus] = useState<'🟢 Connected' | '🔴 Disconnected' | '🟡 Connecting...'>('🟡 Connecting...')
  const [lastSyncTime, setLastSyncTime] = useState<string>('Never')
  const [lastSyncResult, setLastSyncResult] = useState<'Success' | 'Failed'>('Success')
  const [lastError, setLastError] = useState<string>('None')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [testing, setTesting] = useState(false)

  const [counts, setCounts] = useState<Counts>({
    employees: 0,
    salaryMonths: 0,
    salaryRecords: 0,
    salaryItems: 0,
    scheduleMonths: 0,
    scheduleWeeks: 0,
    scheduleShifts: 0,
    stores: 0,
    settings: 0,
  })

  const projectUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jqrkyculdldsyhoowhdv.supabase.co'

  // Health Ping to test companies table
  const pingSupabase = useCallback(async () => {
    try {
      const { error } = await supabase.from('companies').select('*').limit(1)

      if (error && error.code !== 'PGRST116') {
        setStatus('🔴 Disconnected')
        setLastSyncResult('Failed')
        setLastError(error.message || 'Connection Failed')
      } else {
        setStatus('🟢 Connected')
        setLastSyncResult('Success')
        setLastError('None')
        const now = new Date()
        setLastSyncTime(now.toLocaleDateString() + ' ' + now.toLocaleTimeString())
      }
    } catch (err: any) {
      setStatus('🔴 Disconnected')
      setLastSyncResult('Failed')
      setLastError(err?.message || 'Network Error')
    }
  }, [])

  // Query Database Counts from Repositories
  const fetchCounts = useCallback(async () => {
    try {
      const [empRes, salRes, schedRes, storeRes, setRes] = await Promise.all([
        supabaseEmployeeRepository.getAll(),
        supabaseSalaryRepository.getSalaryRecords(),
        supabaseScheduleRepository.getWeeks(),
        supabaseStoreRepository.getStores(),
        supabaseSettingsRepository.getSettings(),
      ])

      const empCount = empRes.data ? empRes.data.length : 0
      const salRecords = salRes.data ? salRes.data : []
      const salMonths = Array.from(new Set(salRecords.map((s: any) => s.month || ''))).length
      const schedWeeks = schedRes.data ? schedRes.data : []
      const schedMonths = Array.from(new Set(schedWeeks.map((w: any) => (w.weekStart || '').slice(0, 7)))).length

      let totalShifts = 0
      schedWeeks.forEach((w: any) => {
        (w.employees || []).forEach((e: any) => {
          totalShifts += (e.shifts || []).length
        })
      })

      setCounts({
        employees: empCount,
        salaryMonths: salMonths,
        salaryRecords: salRecords.length,
        salaryItems: salRecords.length * 5,
        scheduleMonths: schedMonths,
        scheduleWeeks: schedWeeks.length,
        scheduleShifts: totalShifts,
        stores: storeRes.data ? storeRes.data.length : 0,
        settings: setRes.data ? 1 : 0,
      })
    } catch (err) {
      console.warn('[DebugPanel] Counts fetch error:', err)
    }
  }, [])

  // Subscribe to debugLogger
  useEffect(() => {
    const unsubscribe = debugLogger.subscribe(newLogs => {
      setLogs(newLogs)
      if (newLogs.length > 0) {
        const latest = newLogs[0]
        setLastSyncResult(latest.status === 'Failed' ? 'Failed' : 'Success')
        if (latest.detail) setLastError(latest.detail)
        const now = new Date()
        setLastSyncTime(now.toLocaleDateString() + ' ' + now.toLocaleTimeString())
      }
    })
    return () => unsubscribe()
  }, [])

  // Health Check Ping interval (60s)
  useEffect(() => {
    pingSupabase()
    fetchCounts()
    const timer = setInterval(() => {
      pingSupabase()
    }, 60000)
    return () => clearInterval(timer)
  }, [pingSupabase, fetchCounts])

  // Handle Manual Connection Test (Select 1 or companies)
  const handleTestConnection = async () => {
    setTesting(true)
    setStatus('🟡 Connecting...')
    try {
      const { error } = await supabase.from('companies').select('*').limit(1)
      if (error && error.code !== 'PGRST116') {
        setStatus('🔴 Disconnected')
        setLastError(error.message)
        debugLogger.addLog('Test Connection', 'Failed', error.message)
      } else {
        setStatus('🟢 Connected')
        setLastError('None')
        debugLogger.addLog('Test Connection', 'Success', 'Connection Success')
      }
    } catch (err: any) {
      setStatus('🔴 Disconnected')
      setLastError(err?.message || 'Error')
      debugLogger.addLog('Test Connection', 'Failed', err?.message)
    } finally {
      setTesting(false)
      const now = new Date()
      setLastSyncTime(now.toLocaleDateString() + ' ' + now.toLocaleTimeString())
    }
  }

  if (closed) {
    return (
      <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 99999 }}>
        <IconButton
          color="primary"
          onClick={() => setClosed(false)}
          sx={{ bgcolor: '#1E293B', color: '#fff', '&:hover': { bgcolor: '#0F172A' }, boxShadow: 4 }}
        >
          <BugSvg />
        </IconButton>
      </Box>
    )
  }

  const isConnected = status === '🟢 Connected'

  return (
    <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 99999, width: expanded ? 360 : 260 }}>
      <Card
        elevation={8}
        sx={{
          borderRadius: 3,
          bgcolor: '#0F172A',
          color: '#F8FAFC',
          border: '1px solid #334155',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        }}
      >
        <CardHeader
          sx={{ p: 1.5, pb: expanded ? 1 : 1.5 }}
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              <BugSvg />
              <Typography variant="subtitle2" fontWeight={800} sx={{ letterSpacing: 0.5 }}>
                Dev Debug Panel
              </Typography>
            </Stack>
          }
          action={
            <Stack direction="row" spacing={0.5}>
              <IconButton size="small" onClick={() => setExpanded(!expanded)} sx={{ color: '#94A3B8' }}>
                {expanded ? <MinimizeSvg /> : <ExpandSvg />}
              </IconButton>
              <IconButton size="small" onClick={() => setClosed(true)} sx={{ color: '#94A3B8' }}>
                <CloseSvg />
              </IconButton>
            </Stack>
          }
        />

        {/* Collapsed View Brief */}
        {!expanded && (
          <Box sx={{ px: 1.5, pb: 1.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" fontWeight={800} sx={{ color: isConnected ? '#4ADE80' : '#F87171' }}>
                {status}
              </Typography>
              <Chip
                label={isConnected ? 'Supabase' : 'Dexie (Offline)'}
                size="small"
                color={isConnected ? 'primary' : 'default'}
                sx={{ height: 22, fontSize: 11, fontWeight: 700 }}
              />
            </Stack>
          </Box>
        )}

        {/* Expanded View Content */}
        <Collapse in={expanded}>
          <CardContent sx={{ p: 2, pt: 0, maxHeight: 480, overflowY: 'auto' }}>
            <Divider sx={{ borderColor: '#334155', my: 1 }} />

            <Typography variant="caption" color="#94A3B8" fontWeight={700}>
              【Supabase Status】
            </Typography>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
              <Typography variant="body2" fontWeight={700}>
                Status:
              </Typography>
              <Typography variant="body2" fontWeight={800} sx={{ color: isConnected ? '#4ADE80' : status === '🟡 Connecting...' ? '#FBBF24' : '#F87171' }}>
                {status}
              </Typography>
            </Stack>

            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="#94A3B8" display="block" noWrap title={projectUrl}>
                Project URL: {projectUrl}
              </Typography>
              <Typography variant="caption" color="#94A3B8" display="block">
                Storage: <strong style={{ color: isConnected ? '#60A5FA' : '#F87171' }}>{isConnected ? 'Supabase' : 'Dexie (Offline)'}</strong>
              </Typography>
              <Typography variant="caption" color="#94A3B8" display="block">
                Last Sync: {lastSyncTime}
              </Typography>
              <Typography variant="caption" color="#94A3B8" display="block">
                Result: <span style={{ color: lastSyncResult === 'Success' ? '#4ADE80' : '#F87171' }}>{lastSyncResult}</span>
              </Typography>
              <Typography variant="caption" color="#94A3B8" display="block" noWrap title={lastError}>
                Last Error: {lastError}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} sx={{ mt: 1.5, mb: 1.5 }}>
              <Button
                variant="contained"
                size="small"
                fullWidth
                disabled={testing}
                onClick={handleTestConnection}
                sx={{ fontSize: 11, fontWeight: 700, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' } }}
              >
                {testing ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Test Connection'}
              </Button>

              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={() => {
                  fetchCounts()
                  pingSupabase()
                }}
                sx={{ fontSize: 11, fontWeight: 700, borderColor: '#475569', color: '#E2E8F0' }}
              >
                Refresh Data
              </Button>
            </Stack>

            <Divider sx={{ borderColor: '#334155', my: 1 }} />

            <Typography variant="caption" color="#94A3B8" fontWeight={700}>
              【Database Counts】
            </Typography>
            <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: '#1E293B', borderColor: '#334155', borderRadius: 2 }}>
              <Grid container spacing={1} sx={{ fontSize: 11, color: '#CBD5E1' }}>
                <Grid item xs={6}>Employees: <strong>{counts.employees}</strong></Grid>
                <Grid item xs={6}>Stores: <strong>{counts.stores}</strong></Grid>
                <Grid item xs={6}>Salary Months: <strong>{counts.salaryMonths}</strong></Grid>
                <Grid item xs={6}>Salary Records: <strong>{counts.salaryRecords}</strong></Grid>
                <Grid item xs={6}>Schedule Months: <strong>{counts.scheduleMonths}</strong></Grid>
                <Grid item xs={6}>Schedule Weeks: <strong>{counts.scheduleWeeks}</strong></Grid>
                <Grid item xs={6}>Schedule Shifts: <strong>{counts.scheduleShifts}</strong></Grid>
                <Grid item xs={6}>Settings: <strong>{counts.settings}</strong></Grid>
              </Grid>
            </Paper>

            <Divider sx={{ borderColor: '#334155', my: 1.5 }} />

            <Typography variant="caption" color="#94A3B8" fontWeight={700}>
              【Sync Log (Last 20)】
            </Typography>
            <Box sx={{ mt: 0.5, maxHeight: 120, overflowY: 'auto' }}>
              {logs.length === 0 ? (
                <Typography variant="caption" color="#64748B" display="block">
                  No sync events recorded yet.
                </Typography>
              ) : (
                logs.map(log => (
                  <Box key={log.id} sx={{ py: 0.4, borderBottom: '1px solid #1E293B' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="#94A3B8">
                        {log.time} {log.action}
                      </Typography>
                      <Chip
                        label={log.status}
                        size="small"
                        color={log.status === 'Success' ? 'success' : 'error'}
                        sx={{ height: 16, fontSize: 9, fontWeight: 700 }}
                      />
                    </Stack>
                  </Box>
                ))
              )}
            </Box>
          </CardContent>
        </Collapse>
      </Card>
    </Box>
  )
}
