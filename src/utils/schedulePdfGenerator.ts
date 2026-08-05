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
  const displayStoreNo = [schedule.storeNo, schedule.storeCode]
    .map(value => (value || '').toString().trim())
    .find(value => Boolean(value) && !['001', '002'].includes(value)) || ''
  const displayStoreName = escapeHtml(schedule.storeName || '門市')
  const displayStoreNoHtml = escapeHtml(displayStoreNo)

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
      if (!shift || !shift.type || shift.type.trim() === '') {
        return `<td style="border: 1px solid #000; text-align: center; font-size: 14px; padding: 2px 2px; vertical-align: middle;"></td>`
      }

      const hasRemark = Boolean(shift.remark && shift.remark.trim() !== '')
      const cleanRemark = hasRemark ? escapeHtml(shift.remark!.trim()) : ''

      if (shift.type === 'work') {
        const s = shift.startTime ? shift.startTime.trim() : ''
        const e = shift.endTime ? shift.endTime.trim() : ''
        let timeText = '上班'

        if (s && e) {
          const [sH, sM = 0] = s.split(':').map(Number)
          const [eH, eM = 0] = e.split(':').map(Number)
          const sFormatted = sM === 0 ? String(sH) : s.slice(0, 5)
          const eFormatted = eM === 0 ? String(eH) : e.slice(0, 5)
          timeText = `${sFormatted}~${eFormatted}`
        }

        const subText = hasRemark
          ? `<div style="font-size: 12px; font-weight: 700; color: #16A34A; margin-top: 1px; line-height: 1.15;">${cleanRemark}</div>`
          : ''

        return `
          <td style="border: 1px solid #000; text-align: center; padding: 2px 2px; vertical-align: middle;">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.15;">
              <div style="font-size: 18px; font-weight: 700; color: #111827;">${timeText}</div>
              ${subText}
            </div>
          </td>
        `
      }

      // 休/公/特/病/事
      const labelMap: Record<string, string> = {
        off: '休',
        public: '公',
        annual: '特',
        sick: '病',
        personal: '事',
      }
      const label = labelMap[shift.type] || ''
      if (!label) {
        return `<td style="border: 1px solid #000; text-align: center; padding: 2px 2px; vertical-align: middle;"></td>`
      }
      const isRed = shift.type === 'off' || shift.type === 'personal'
      const subText = hasRemark
        ? `<div style="font-size: 12px; font-weight: 700; color: #16A34A; margin-top: 1px; line-height: 1.15;">${cleanRemark}</div>`
        : ''

      return `
        <td style="border: 1px solid #000; text-align: center; background-color: ${isRed ? '#FEECEC' : '#ffffff'}; padding: 2px 2px; vertical-align: middle;">
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.15;">
            <div style="font-size: 18px; font-weight: 700; color: ${isRed ? '#DC2626' : '#111827'};">${label}</div>
            ${subText}
          </div>
        </td>
      `
    }).join('')

    return `
      <tr style="height: 48px;">
        <td style="border: 1px solid #000; width: 140px; text-align: center; font-size: 18px; font-weight: 700; color: #111827; padding: 2px 4px; vertical-align: middle;">${emp.name}</td>
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
        <span>店號：${displayStoreNoHtml || '—'}</span>
        <span style="margin-left: 35px;">店名：${displayStoreName}</span>
      </div>
      <div>
        <span>列印日期：${printDate}</span>
      </div>
    </div>

    <!-- Schedule Grid Table -->
    <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; table-layout: fixed;">
      <thead>
        <tr style="height: 44px; background-color: #f2f2f2;">
          <th style="border: 1px solid #000; width: 140px; text-align: center; font-size: 18px; font-weight: 700; color: #111827;">員工姓名</th>
          ${weekDaysInfo.map(w => `<th style="border: 1px solid #000; text-align: center; font-size: 18px; font-weight: 700; color: #111827;">${w.display}</th>`).join('')}
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

export async function createSchedulePDFDoc(
  schedule: Schedule,
  customFileName?: string,
  weekIndex?: number
): Promise<{ doc: jsPDF; blob: Blob; url: string; fileName: string }> {
  const { default: html2canvas } = await import('html2canvas')

  const container = document.createElement('div')
  container.style.cssText = 'position:fixed; left:-9999px; top:0; width:1123px; background:white; z-index:-1;'
  document.body.appendChild(container)

  try {
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

    const blob = doc.output('blob')

    if (blob.size === 0) {
      throw new Error('PDF 建立失敗，Blob Size 為 0')
    }

    const url = URL.createObjectURL(blob)

    const { getScheduleFileName } = await import('./pdfFileNameHelper')
    const fileName = customFileName || getScheduleFileName(schedule, 'single', weekIndex)
    return { doc, blob, url, fileName }
  } catch (err) {
    console.error('[PDF Debug] createSchedulePDFDoc Error:', err)
    throw err
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container)
    }
  }
}

export async function generateSchedulePDF(schedule: Schedule, customFileName?: string, weekIndex?: number): Promise<void> {
  const { doc, fileName } = await createSchedulePDFDoc(schedule, customFileName, weekIndex)
  doc.save(fileName)
}
