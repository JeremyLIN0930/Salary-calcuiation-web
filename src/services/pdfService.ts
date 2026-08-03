import { Employee } from '../types/employee'
import { Schedule } from '../types/schedule'
import { generatePayrollPDF } from '../utils/pdfGenerator'
import { generateSchedulePDF, createSchedulePDFDoc } from '../utils/schedulePdfGenerator'
import { getPayrollFileName, getScheduleFileName } from '../utils/pdfFileNameHelper'
import { jsPDF } from 'jspdf'

export class PDFService {
  /**
   * Export payroll PDF with precise custom Taiwan naming:
   * - single: 薪資單_YYYY年MM月_員工姓名_門市.pdf
   * - multi:  薪資單_YYYY年MM月_多人.pdf
   * - month:  薪資單_YYYY年MM月.pdf
   * - all:    薪資單_全部月份.pdf
   */
  static async exportPayroll(
    employees: Employee[],
    type: 'single' | 'multi' | 'month' | 'all' = 'month',
    targetMonthKey?: string
  ): Promise<void> {
    if (!employees || employees.length === 0) return
    const fileName = getPayrollFileName(employees, type, targetMonthKey)
    await generatePayrollPDF(employees, fileName)
  }

  /**
   * Export weekly schedule PDF directly with precise custom Taiwan naming:
   * - single: 排班表_YYYY年MM月_第X週_門市.pdf
   * - month:  排班表_YYYY年MM月_門市.pdf
   * - multi:  排班表_YYYY年MM月_多週.pdf
   * - all:    排班表_全部月份.pdf
   */
  static async exportSchedule(
    schedule: Schedule,
    type: 'single' | 'month' | 'multi' | 'all' = 'single',
    weekIndex?: number
  ): Promise<void> {
    if (!schedule) return
    const fileName = getScheduleFileName(schedule, type, weekIndex)
    await generateSchedulePDF(schedule, fileName, weekIndex)
  }

  /**
   * Create Schedule PDF Blob and Object URL for live previewing inside iframe
   */
  static async createSchedulePDFBlob(
    schedule: Schedule,
    type: 'single' | 'month' | 'multi' | 'all' = 'single',
    weekIndex?: number
  ): Promise<{ doc: jsPDF; blob: Blob; url: string; fileName: string }> {
    const fileName = getScheduleFileName(schedule, type, weekIndex)
    return await createSchedulePDFDoc(schedule, fileName, weekIndex)
  }
}
