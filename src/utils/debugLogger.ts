export interface LogEntry {
  id: string
  time: string
  action: string
  status: 'Success' | 'Failed' | 'Pending'
  detail?: string
}

type Listener = (logs: LogEntry[]) => void

class DebugLogger {
  private logs: LogEntry[] = []
  private listeners: Set<Listener> = new Set()
  private maxLogs = 20

  addLog(action: string, status: 'Success' | 'Failed' | 'Pending', detail?: string) {
    const d = new Date()
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
    
    const entry: LogEntry = {
      id: Math.random().toString(36).slice(2),
      time: timeStr,
      action,
      status,
      detail,
    }

    this.logs = [entry, ...this.logs].slice(0, this.maxLogs)
    this.notify()
  }

  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    listener(this.getLogs())
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    const current = this.getLogs()
    this.listeners.forEach(l => l(current))
  }
}

export const debugLogger = new DebugLogger()
