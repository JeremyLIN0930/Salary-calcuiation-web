import { Employee } from '../types/employee'
import { Schedule } from '../types/schedule'
import { generatePayrollPDF } from '../utils/pdfGenerator'
import { generateSchedulePDF, createSchedulePDFDoc } from '../utils/schedulePdfGenerator'
import { jsPDF } from 'jspdf'

export class PDFService {
  /**
   * Export single or batch payroll PDF
   */
  static async exportPayroll(employees: Employee[]): Promise<void> {
    if (!employees || employees.length === 0) return
    await generatePayrollPDF(employees)
  }

  /**
   * Export weekly schedule PDF directly
   */
  static async exportSchedule(schedule: Schedule): Promise<void> {
    if (!schedule) return
    await generateSchedulePDF(schedule)
  }

  /**
   * Create Schedule PDF Blob and Object URL for live previewing inside iframe
   */
  static async createSchedulePDFBlob(schedule: Schedule): Promise<{ doc: jsPDF; blob: Blob; url: string; fileName: string }> {
    return await createSchedulePDFDoc(schedule)
  }
}
