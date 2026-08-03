import type { Schedule } from '../types/schedule'
import { jsPDF } from 'jspdf'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

function buildPaperScheduleHTML(schedule: Schedule): HTMLDivElement {
  const printDate = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })

  // Compute 7 week dates (Mon-Sun)
  const weekStart = new Date(schedule.weekStart)
  const weekDaysInfo = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    const month = d.getMonth() + 1
    const date = d.getDate()
    const dateStr = d.toISOString().slice(0, 10)
    return {
      dateStr,
      display: `${month}/${date}（${WEEKDAYS[i]}）`,
    }
  })

  // Ensure at least 10 rows for paper table look
  const displayEmployees = [...schedule.employees]
  while (displayEmployees.length < 10) {
    displayEmployees.push({
      id: `empty-${displayEmployees.length}`,
      name: '',
      shifts: [],
    })
  }

  const rowsHtml = displayEmployees.map(emp => {
    const shiftCells = weekDaysInfo.map(wd => {
      const shift = emp.shifts.find(s => s.date === wd.dateStr)
      if (!shift) {
        return `<td style="border: 1px solid #000; text-align: center; font-size: 13px; padding: 6px 2px;">-</td>`
      }

      if (shift.type === 'work') {
        const timeText = (shift.startTime && shift.endTime)
          ? `${shift.startTime}－${shift.endTime}`
          : '上班'
        return `<td style="border: 1px solid #000; text-align: center; font-size: 12px; font-weight: bold; color: #000; padding: 6px 2px;">${timeText}</td>`
      }

      // 休/公/特/病/事
      const labelMap: Record<string, string> = {
        off: '休',
        public: '公',
        annual: '特',
        sick: '病',
        personal: '事',
      }
      const label = labelMap[shift.type] || '休'
      const isRed = shift.type === 'off' || shift.type === 'personal'
      return `<td style="border: 1px solid #000; text-align: center; font-size: 15px; font-weight: 900; color: ${isRed ? '#c00' : '#000'}; padding: 6px 2px;">${label}</td>`
    }).join('')

    return `
      <tr style="height: 42px;">
        <td style="border: 1px solid #000; width: 140px; text-align: center; font-size: 15px; font-weight: bold; padding: 4px 8px;">${emp.name}</td>
        ${shiftCells}
      </tr>
    `
  }).join('')

  const div = document.createElement('div')
  div.style.cssText = [
    'width: 1123px', // A4 Landscape
    'min-height: 794px',
    'padding: 35px 45px',
    'box-sizing: border-box',
    'background: #ffffff',
    'font-family: "Microsoft JhengHei", "Noto Sans TC", sans-serif',
    'color: #000000',
    'line-height: 1.4',
  ].join(';')

  div.innerHTML = `
    <div style="text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 6px; margin-bottom: 24px;">
      排 班 表
    </div>

    <!-- Info bar -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 14px; font-size: 16px; font-weight: bold;">
      <div>
        <span>店號：${schedule.storeId}</span>
        <span style="margin-left: 35px;">店名：${schedule.storeName}</span>
      </div>
      <div>
        <span>列印日期：${printDate}</span>
      </div>
    </div>

    <!-- Schedule Grid Table -->
    <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; table-layout: fixed;">
      <thead>
        <tr style="height: 40px; background-color: #f2f2f2;">
          <th style="border: 1px solid #000; width: 140px; text-align: center; font-size: 15px;">員工姓名</th>
          ${weekDaysInfo.map(w => `<th style="border: 1px solid #000; text-align: center; font-size: 14px;">${w.display}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <!-- Remark Section -->
    <div style="margin-top: 16px; border: 1.5px solid #000; min-height: 70px; padding: 10px 14px; font-size: 13px;">
      <div style="font-weight: bold; margin-bottom: 4px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">備註：</div>
      <div style="font-size: 13px; line-height: 1.6; white-space: pre-wrap;">${schedule.remark ? escapeHtml(schedule.remark) : '無'}</div>
    </div>
  `

  return div
}

export async function generateSchedulePDF(schedule: Schedule): Promise<void> {
  const { default: html2canvas } = await import('html2canvas')

  const container = document.createElement('div')
  container.style.cssText = 'position:fixed; left:-9999px; top:0; width:1123px; background:white; z-index:-1;'
  document.body.appendChild(container)

  const pageElement = buildPaperScheduleHTML(schedule)
  container.appendChild(pageElement)

  await new Promise<void>(resolve => setTimeout(resolve, 200))

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    width: 1123,
    windowWidth: 1123,
  })

  const imgData = canvas.toDataURL('image/jpeg', 0.95)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  doc.addImage(imgData, 'JPEG', 0, 0, 297, 210)

  document.body.removeChild(container)

  const fileName = `排班表_${schedule.storeName}_${schedule.weekStart}.pdf`
  doc.save(fileName)
}
