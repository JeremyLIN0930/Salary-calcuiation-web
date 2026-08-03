import type { ScheduleStaff, ShiftTemplate, ScheduleRecord } from '../types/schedule'
import { jsPDF } from 'jspdf'

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function buildScheduleTable(
  staff: ScheduleStaff[],
  shifts: ShiftTemplate[],
  records: ScheduleRecord[],
  year: number,
  month: number,
): HTMLDivElement {
  const totalDays = daysInMonth(year, month)
  const monthStr  = `${year} 年 ${month + 1} 月`

  // Build record lookup: staffId → date → record
  const lookup: Record<string, Record<string, ScheduleRecord>> = {}
  records.forEach(r => {
    if (!lookup[r.staffId]) lookup[r.staffId] = {}
    lookup[r.staffId][r.date] = r
  })

  // Column widths: name col + day cols
  const nameColW = 80
  const dayColW  = Math.max(28, Math.floor((1060 - nameColW) / totalDays))

  const div = document.createElement('div')
  div.style.cssText = [
    'width:1123px',        // A4 landscape
    'padding:32px 28px',
    'box-sizing:border-box',
    'background:#fff',
    'font-family:"Microsoft JhengHei","Noto Sans TC",sans-serif',
    'font-size:12px',
    'color:#111',
  ].join(';')

  // Build day headers
  const dayHeaders = Array.from({ length: totalDays }, (_, i) => {
    const d   = i + 1
    const dow = new Date(year, month, d).getDay()
    const bg  = dow === 0 ? '#fee2e2' : dow === 6 ? '#dbeafe' : '#f3f4f6'
    const fc  = dow === 0 ? '#b91c1c' : dow === 6 ? '#1d4ed8' : '#374151'
    return `<th style="min-width:${dayColW}px;max-width:${dayColW}px;background:${bg};color:${fc};padding:4px 2px;text-align:center;border:1px solid #ccc;font-size:10px;font-weight:700;">
              <div>${d}</div><div style="font-size:9px;font-weight:400;">${WEEKDAYS[dow]}</div>
            </th>`
  }).join('')

  // Build staff rows
  const staffRows = staff.map(s => {
    const cells = Array.from({ length: totalDays }, (_, i) => {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
      const rec     = lookup[s.id]?.[dateStr]
      if (!rec) return `<td style="min-width:${dayColW}px;max-width:${dayColW}px;border:1px solid #ddd;padding:3px 2px;text-align:center;"></td>`
      return `<td style="min-width:${dayColW}px;max-width:${dayColW}px;border:1px solid #ddd;padding:2px;text-align:center;background:${rec.shiftColor}22;">
                <span style="display:inline-block;background:${rec.shiftColor};color:#fff;border-radius:3px;padding:1px 4px;font-size:10px;font-weight:700;">${rec.shiftName}</span>
              </td>`
    }).join('')
    return `<tr>
              <td style="min-width:${nameColW}px;max-width:${nameColW}px;padding:6px 8px;border:1px solid #ccc;font-weight:700;background:#f8f9fa;white-space:nowrap;">${s.name}${s.store ? `<br><span style="font-size:9px;color:#888;font-weight:400;">${s.store}</span>` : ''}</td>
              ${cells}
            </tr>`
  }).join('')

  div.innerHTML = `
<div style="text-align:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #111;">
  <div style="font-size:20px;font-weight:900;letter-spacing:6px;">排　班　明　細　表</div>
  <div style="font-size:13px;color:#555;margin-top:4px;letter-spacing:2px;">${monthStr}</div>
</div>

<div style="overflow-x:auto;">
  <table style="border-collapse:collapse;width:100%;table-layout:fixed;">
    <thead>
      <tr>
        <th style="min-width:${nameColW}px;max-width:${nameColW}px;background:#1a237e;color:#fff;padding:6px 8px;text-align:left;border:1px solid #999;font-size:12px;letter-spacing:1px;">員工姓名</th>
        ${dayHeaders}
      </tr>
    </thead>
    <tbody>
      ${staff.length === 0
        ? `<tr><td colspan="${totalDays + 1}" style="text-align:center;padding:20px;color:#999;">本月無員工資料</td></tr>`
        : staffRows
      }
    </tbody>
  </table>
</div>

<div style="margin-top:14px;padding-top:10px;border-top:1px solid #ddd;display:flex;flex-wrap:wrap;gap:8px;">
  <span style="font-size:11px;color:#666;margin-right:4px;">班別說明：</span>
  ${shifts.map(s => `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;">
      <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${s.color};"></span>
      ${s.name}${s.startTime ? ` ${s.startTime}–${s.endTime}` : ''}
    </span>`).join(' | ')}
</div>
`
  return div
}

export async function generateSchedulePDF(
  staff: ScheduleStaff[],
  shifts: ShiftTemplate[],
  records: ScheduleRecord[],
  year: number,
  month: number,
): Promise<void> {
  const { default: html2canvas } = await import('html2canvas')

  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:1123px;background:white;z-index:-1;'
  document.body.appendChild(container)

  const page = buildScheduleTable(staff, shifts, records, year, month)
  container.appendChild(page)

  await new Promise<void>(r => setTimeout(r, 250))

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    width: 1123,
    windowWidth: 1123,
  })

  document.body.removeChild(container)

  const imgData = canvas.toDataURL('image/jpeg', 0.95)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  doc.addImage(imgData, 'JPEG', 0, 0, 297, 210)

  const monthLabel = `${year}-${String(month + 1).padStart(2, '0')}`
  doc.save(`排班表_${monthLabel}.pdf`)
}
