import { Employee } from '../types/employee'
import { Schedule } from '../types/schedule'
import { generatePayrollPDF } from '../utils/pdfGenerator'
import { generateSchedulePDF } from '../utils/schedulePdfGenerator'

export class PDFService {
  /**
   * Export single or batch payroll PDF
   */
  static async exportPayroll(employees: Employee[]): Promise<void> {
    if (!employees || employees.length === 0) return
    await generatePayrollPDF(employees)
  }

  /**
   * Export weekly schedule PDF
   */
  static async exportSchedule(schedule: Schedule): Promise<void> {
    if (!schedule) return
    await generateSchedulePDF(schedule)
  }
}
