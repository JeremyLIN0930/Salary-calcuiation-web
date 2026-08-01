import type { Employee } from '../types/employee'
import { jsPDF } from 'jspdf'

function fmt(n: number | undefined | null): string {
  const v = n ?? 0
  return v === 0 ? '—' : v.toLocaleString('zh-TW')
}

function fmtH(n: number | undefined | null): string {
  const v = n ?? 0
  return v === 0 ? '—' : String(v)
}

function createPayslipElement(emp: Employee): HTMLDivElement {
  const monthStr = emp.month ? emp.month.replace('-', ' 年 ') + ' 月' : ''

  const div = document.createElement('div')
  div.style.cssText = [
    'width:794px', 'padding:32px 40px',
    'box-sizing:border-box', 'background:white',
    'font-family:"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif',
    'font-size:12px', 'color:#111',
  ].join(';')

  div.innerHTML = `
<style>
  .pt { width:100%; border-collapse:collapse; margin-bottom:8px; }
  .pt td, .pt th { border:1px solid #888; padding:5px 8px; font-size:11.5px; vertical-align:middle; }
  .pt th { background:#e8e8e8; font-weight:700; text-align:center; }
  .lbl { color:#444; white-space:nowrap; width:105px; font-size:11px; }
  .val { text-align:right; font-weight:500; min-width:80px; }
  .tot td { background:#f0f0f0; font-weight:700; }
  .net td { background:#1a237e; color:white; font-weight:700; }
</style>
<div style="text-align:center;margin-bottom:12px;">
  <div style="font-size:22px;font-weight:900;letter-spacing:6px;margin-bottom:4px;">薪　資　明　細　表</div>
  <div style="font-size:12px;color:#666;">${monthStr} 薪資</div>
</div>

<table class="pt">
  <tr>
    <td class="lbl">姓　　名</td><td class="val" style="text-align:left;font-size:15px;font-weight:700;">${emp.name ?? ''}</td>
    <td class="lbl">月　　份</td><td class="val" style="text-align:left;">${monthStr}</td>
  </tr>
  <tr>
    <td class="lbl">門　　市</td><td class="val" style="text-align:left;">${emp.store || '—'}</td>
    <td class="lbl">到　職　日</td><td class="val" style="text-align:left;">${emp.hireDate || '—'}</td>
  </tr>
  <tr>
    <td class="lbl">發薪日期</td><td class="val" style="text-align:left;">${emp.payDate || '—'}</td>
    <td class="lbl"></td><td class="val"></td>
  </tr>
</table>

<table class="pt">
  <thead>
    <tr><th colspan="2">薪　資　項Custom項目</th><th colspan="2">代扣　項　目</th></tr>
  </thead>
  <tbody>
    <tr><td class="lbl">本薪</td><td class="val">${fmt(emp.baseSalary)}</td><td class="lbl">勞保費</td><td class="val">${fmt(emp.laborInsurance)}</td></tr>
    <tr><td class="lbl">伙食津貼</td><td class="val">${fmt(emp.mealAllowance)}</td><td class="lbl">健保費</td><td class="val">${fmt(emp.healthInsurance)}</td></tr>
    <tr><td class="lbl">職務津貼</td><td class="val">${fmt(emp.positionAllowance)}</td><td class="lbl">勞退個人自提</td><td class="val">${fmt(emp.laborPension)}</td></tr>
    <tr><td class="lbl">其他津貼</td><td class="val">${fmt(emp.otherAllowance)}</td><td class="lbl">所得稅</td><td class="val">${fmt(emp.incomeTax)}</td></tr>
    <tr><td class="lbl">夜勤津貼</td><td class="val">${fmt(emp.nightAllowance)}</td><td class="lbl">其他扣款</td><td class="val">${fmt(emp.otherDeductions)}</td></tr>
    <tr><td class="lbl">津貼/獎金項目</td><td class="val">${fmt(emp.bonusItems)}</td><td class="lbl"></td><td class="val"></td></tr>
    <tr><td class="lbl">盈餘分紅</td><td class="val">${fmt(emp.profitSharing)}</td><td class="lbl"></td><td class="val"></td></tr>
    <tr><td class="lbl">其他加款</td><td class="val">${fmt(emp.otherAdditions)}</td><td class="lbl"></td><td class="val"></td></tr>
    <tr><td class="lbl">特別假津貼</td><td class="val">${fmt(emp.specialLeaveAllowance)}</td><td class="lbl"></td><td class="val"></td></tr>
    <tr><td class="lbl">平日加班費</td><td class="val">${fmt(emp.weekdayOT)}</td><td class="lbl"></td><td class="val"></td></tr>
    <tr><td class="lbl">休息日加班費</td><td class="val">${fmt(emp.restDayOT)}</td><td class="lbl"></td><td class="val"></td></tr>
    <tr><td class="lbl">國定假日加班費</td><td class="val">${fmt(emp.holidayOT)}</td><td class="lbl"></td><td class="val"></td></tr>
    <tr><td class="lbl">事病假扣款</td><td class="val">${fmt(emp.sickLeaveDeduction)}</td><td class="lbl"></td><td class="val"></td></tr>
    <tr class="tot">
      <td class="lbl">應發薪資</td><td class="val" style="font-size:13px;">$ ${(emp.grossSalary ?? 0).toLocaleString('zh-TW')}</td>
      <td class="lbl">代扣合計</td><td class="val" style="font-size:13px;">$ ${(emp.totalDeductions ?? 0).toLocaleString('zh-TW')}</td>
    </tr>
  </tbody>
</table>

<table class="pt">
  <thead><tr><th colspan="4">考　勤　記　錄</th></tr></thead>
  <tbody>
    <tr>
      <td class="lbl">年度剩餘特別假</td><td class="val">${fmtH(emp.annualLeaveRemaining)} 日</td>
      <td class="lbl">結轉特別假</td><td class="val">${fmtH(emp.carriedOverLeave)} 日</td>
    </tr>
  </tbody>
</table>

<table class="pt">
  <tr>
    <td class="lbl">公司提撥退休金</td><td class="val">${fmt(emp.companyPensionContribution)}</td>
    <td class="lbl">當月提撥退休金</td><td class="val">${fmt(emp.monthlyPensionContribution)}</td>
  </tr>
  <tr class="net">
    <td colspan="2" style="text-align:center;font-size:15px;padding:10px;">實　發　金額</td>
    <td colspan="2" style="text-align:right;font-size:18px;font-weight:900;padding:10px 16px;">
      $ ${(emp.netSalary ?? 0).toLocaleString('zh-TW')}
    </td>
  </tr>
</table>
`
  return div
}

export async function generatePayrollPDF(employees: Employee[]): Promise<void> {
  if (!employees || employees.length === 0) return

  const { default: html2canvas } = await import('html2canvas')

  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:white;z-index:-1;'
  document.body.appendChild(container)

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i]
    const page = createPayslipElement(emp)
    container.innerHTML = ''
    container.appendChild(page)

    await new Promise<void>(r => setTimeout(r, 150))

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 794,
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.92)
    if (i > 0) doc.addPage()
    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297)
  }

  document.body.removeChild(container)

  const date = new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')
  doc.save(`薪資單_${date}.pdf`)
}
