import type { Employee } from '../types/employee'
import { jsPDF } from 'jspdf'

function fmt(n: number | undefined | null): string {
  const v = n ?? 0
  return v === 0 ? '—' : v.toLocaleString('zh-TW')
}

function fmtD(n: number | undefined | null): string {
  const v = n ?? 0
  return v === 0 ? '—' : String(v) + ' 日'
}

function createPayslipElement(emp: Employee): HTMLDivElement {
  const monthStr = emp.month
    ? emp.month.replace('-', ' 年 ') + ' 月'
    : ''

  const div = document.createElement('div')
  // A4 width 794px at 96dpi
  div.style.cssText = [
    'width:794px',
    'min-height:1123px',
    'padding:40px 52px',
    'box-sizing:border-box',
    'background:#ffffff',
    'font-family:"Microsoft JhengHei","Noto Sans TC","PingFang TC",sans-serif',
    'font-size:13px',
    'color:#1a1a1a',
    'line-height:1.5',
  ].join(';')

  div.innerHTML = `
<style>
  /* ========== Reset ========== */
  * { box-sizing: border-box; margin: 0; padding: 0; }

  /* ========== Title Area ========== */
  .title-block {
    text-align: center;
    padding-bottom: 18px;
    margin-bottom: 20px;
    border-bottom: 2.5px solid #1a1a1a;
  }
  .title-main {
    font-size: 26px;
    font-weight: 900;
    letter-spacing: 10px;
    color: #111;
  }
  .title-sub {
    font-size: 14px;
    color: #555;
    margin-top: 6px;
    letter-spacing: 2px;
  }

  /* ========== Section Label ========== */
  .section-label {
    font-size: 12px;
    font-weight: 700;
    color: #555;
    letter-spacing: 2px;
    padding: 6px 0 4px 2px;
    text-transform: uppercase;
  }

  /* ========== Basic Info Table ========== */
  .info-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    border: 1.5px solid #999;
  }
  .info-table td {
    padding: 8px 12px;
    border: 1px solid #ccc;
    font-size: 13px;
    vertical-align: middle;
  }
  .info-table .field-label {
    background: #f4f4f4;
    color: #444;
    font-weight: 700;
    width: 100px;
    white-space: nowrap;
  }
  .info-table .field-value {
    color: #111;
    font-weight: 500;
    min-width: 140px;
  }

  /* ========== Salary / Deduction Table ========== */
  .salary-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    border: 1.5px solid #999;
  }
  .salary-table th {
    background: #2c2c2c;
    color: #fff;
    font-size: 12.5px;
    font-weight: 700;
    letter-spacing: 2px;
    padding: 9px 12px;
    text-align: center;
  }
  .salary-table td {
    padding: 7px 12px;
    border-bottom: 1px solid #e8e8e8;
    font-size: 12.5px;
    vertical-align: middle;
  }
  .salary-table .name-cell {
    color: #333;
    width: 130px;
  }
  .salary-table .amt-cell {
    text-align: right;
    font-weight: 500;
    color: #111;
    width: 110px;
  }
  .salary-table .divider-col {
    width: 1px;
    background: #999;
    padding: 0;
  }
  .salary-table tr:nth-child(even) td {
    background: #fafafa;
  }
  .salary-table .subtotal-row td {
    background: #ebebeb !important;
    font-weight: 700;
    font-size: 13px;
    border-top: 1.5px solid #aaa;
    border-bottom: 1.5px solid #aaa;
    padding: 9px 12px;
  }
  .salary-table .subtotal-row .amt-cell {
    color: #111;
  }

  /* ========== Attendance Table ========== */
  .attend-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    border: 1.5px solid #999;
  }
  .attend-table th {
    background: #2c2c2c;
    color: #fff;
    font-size: 12.5px;
    font-weight: 700;
    letter-spacing: 2px;
    padding: 9px 12px;
    text-align: center;
  }
  .attend-table td {
    padding: 8px 12px;
    border: 1px solid #ddd;
    font-size: 12.5px;
    vertical-align: middle;
  }
  .attend-table .a-label {
    background: #f4f4f4;
    color: #444;
    font-weight: 700;
    width: 140px;
  }
  .attend-table .a-value {
    text-align: right;
    font-weight: 500;
    color: #111;
  }

  /* ========== Pension Row ========== */
  .pension-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    border: 1.5px solid #999;
  }
  .pension-table th {
    background: #2c2c2c;
    color: #fff;
    font-size: 12.5px;
    font-weight: 700;
    letter-spacing: 2px;
    padding: 9px 12px;
    text-align: center;
  }
  .pension-table td {
    padding: 8px 12px;
    border: 1px solid #ddd;
    font-size: 12.5px;
    vertical-align: middle;
  }
  .pension-table .p-label {
    background: #f4f4f4;
    color: #444;
    font-weight: 700;
    width: 140px;
  }
  .pension-table .p-value {
    text-align: right;
    font-weight: 500;
    color: #111;
  }

  /* ========== Net Salary Block ========== */
  .net-block {
    background: #1a237e;
    border-radius: 4px;
    padding: 18px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .net-label {
    font-size: 16px;
    font-weight: 700;
    color: rgba(255,255,255,0.9);
    letter-spacing: 4px;
  }
  .net-amount {
    font-size: 28px;
    font-weight: 900;
    color: #ffffff;
    font-family: "Microsoft JhengHei","Noto Sans TC",sans-serif;
    letter-spacing: 1px;
  }
</style>

<!-- 標題 -->
<div class="title-block">
  <div class="title-main">薪　資　明　細　表</div>
  <div class="title-sub">${monthStr}　薪資</div>
</div>

<!-- 基本資料 -->
<div class="section-label">基本資料</div>
<table class="info-table">
  <tr>
    <td class="field-label">姓　名</td>
    <td class="field-value" style="font-size:15px;font-weight:700;">${emp.name || '—'}</td>
    <td class="field-label">月　份</td>
    <td class="field-value">${monthStr || '—'}</td>
  </tr>
  <tr>
    <td class="field-label">門　市</td>
    <td class="field-value">${emp.store || '—'}</td>
    <td class="field-label">到 職 日</td>
    <td class="field-value">${emp.hireDate || '—'}</td>
  </tr>
  <tr>
    <td class="field-label">發薪日期</td>
    <td class="field-value">${emp.payDate || '—'}</td>
    <td class="field-label"></td>
    <td class="field-value"></td>
  </tr>
</table>

<!-- 薪資項目 ＋ 代扣項目 -->
<div class="section-label">薪資項目 ／ 代扣項目</div>
<table class="salary-table">
  <thead>
    <tr>
      <th colspan="2">薪　資　項　目</th>
      <td class="divider-col"></td>
      <th colspan="2">代　扣　項　目</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="name-cell">本薪</td><td class="amt-cell">${fmt(emp.baseSalary)}</td>
      <td class="divider-col"></td>
      <td class="name-cell">勞保費</td><td class="amt-cell">${fmt(emp.laborInsurance)}</td>
    </tr>
    <tr>
      <td class="name-cell">伙食津貼</td><td class="amt-cell">${fmt(emp.mealAllowance)}</td>
      <td class="divider-col"></td>
      <td class="name-cell">健保費</td><td class="amt-cell">${fmt(emp.healthInsurance)}</td>
    </tr>
    <tr>
      <td class="name-cell">職務津貼</td><td class="amt-cell">${fmt(emp.positionAllowance)}</td>
      <td class="divider-col"></td>
      <td class="name-cell">勞退個人自提</td><td class="amt-cell">${fmt(emp.laborPension)}</td>
    </tr>
    <tr>
      <td class="name-cell">其他津貼</td><td class="amt-cell">${fmt(emp.otherAllowance)}</td>
      <td class="divider-col"></td>
      <td class="name-cell">所得稅</td><td class="amt-cell">${fmt(emp.incomeTax)}</td>
    </tr>
    <tr>
      <td class="name-cell">夜勤津貼</td><td class="amt-cell">${fmt(emp.nightAllowance)}</td>
      <td class="divider-col"></td>
      <td class="name-cell">其他扣款</td><td class="amt-cell">${fmt(emp.otherDeductions)}</td>
    </tr>
    <tr>
      <td class="name-cell">津貼／獎金項目</td><td class="amt-cell">${fmt(emp.bonusItems)}</td>
      <td class="divider-col"></td>
      <td class="name-cell"></td><td class="amt-cell"></td>
    </tr>
    <tr>
      <td class="name-cell">盈餘分紅</td><td class="amt-cell">${fmt(emp.profitSharing)}</td>
      <td class="divider-col"></td>
      <td class="name-cell"></td><td class="amt-cell"></td>
    </tr>
    <tr>
      <td class="name-cell">其他加款</td><td class="amt-cell">${fmt(emp.otherAdditions)}</td>
      <td class="divider-col"></td>
      <td class="name-cell"></td><td class="amt-cell"></td>
    </tr>
    <tr>
      <td class="name-cell">特別假津貼</td><td class="amt-cell">${fmt(emp.specialLeaveAllowance)}</td>
      <td class="divider-col"></td>
      <td class="name-cell"></td><td class="amt-cell"></td>
    </tr>
    <tr>
      <td class="name-cell">平日加班費</td><td class="amt-cell">${fmt(emp.weekdayOT)}</td>
      <td class="divider-col"></td>
      <td class="name-cell"></td><td class="amt-cell"></td>
    </tr>
    <tr>
      <td class="name-cell">休息日加班費</td><td class="amt-cell">${fmt(emp.restDayOT)}</td>
      <td class="divider-col"></td>
      <td class="name-cell"></td><td class="amt-cell"></td>
    </tr>
    <tr>
      <td class="name-cell">國定假日加班費</td><td class="amt-cell">${fmt(emp.holidayOT)}</td>
      <td class="divider-col"></td>
      <td class="name-cell"></td><td class="amt-cell"></td>
    </tr>
    <tr>
      <td class="name-cell">事病假扣款</td><td class="amt-cell">${fmt(emp.sickLeaveDeduction)}</td>
      <td class="divider-col"></td>
      <td class="name-cell"></td><td class="amt-cell"></td>
    </tr>
    <!-- 小計 -->
    <tr class="subtotal-row">
      <td class="name-cell">應　發　薪　資</td>
      <td class="amt-cell" style="font-size:14px;">$ ${(emp.grossSalary ?? 0).toLocaleString('zh-TW')}</td>
      <td class="divider-col"></td>
      <td class="name-cell">代　扣　合　計</td>
      <td class="amt-cell" style="font-size:14px;">$ ${(emp.totalDeductions ?? 0).toLocaleString('zh-TW')}</td>
    </tr>
  </tbody>
</table>

<!-- 考勤記錄 -->
<div class="section-label">考勤記錄</div>
<table class="attend-table">
  <thead>
    <tr><th colspan="4">考　勤　記　錄</th></tr>
  </thead>
  <tbody>
    <tr>
      <td class="a-label">年度剩餘特別假</td>
      <td class="a-value">${fmtD(emp.annualLeaveRemaining)}</td>
      <td class="a-label">結轉特別假</td>
      <td class="a-value">${fmtD(emp.carriedOverLeave)}</td>
    </tr>
  </tbody>
</table>

<!-- 退休金 -->
<div class="section-label">退休金提撥</div>
<table class="pension-table">
  <thead>
    <tr><th colspan="4">退　休　金　提　撥</th></tr>
  </thead>
  <tbody>
    <tr>
      <td class="p-label">公司提撥退休金</td>
      <td class="p-value">${fmt(emp.companyPensionContribution)}</td>
      <td class="p-label">當月提撥退休金</td>
      <td class="p-value">${fmt(emp.monthlyPensionContribution)}</td>
    </tr>
  </tbody>
</table>

<!-- 實發金額 -->
<div class="net-block">
  <div class="net-label">實　發　金　額</div>
  <div class="net-amount">$ ${(emp.netSalary ?? 0).toLocaleString('zh-TW')}</div>
</div>
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

    await new Promise<void>(r => setTimeout(r, 200))

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 794,
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    if (i > 0) doc.addPage()
    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297)
  }

  document.body.removeChild(container)

  const date = new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')
  doc.save(`薪資單_${date}.pdf`)
}
