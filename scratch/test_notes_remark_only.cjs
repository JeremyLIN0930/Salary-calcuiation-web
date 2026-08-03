function modelToWeekDbRow(model) {
  const now = new Date().toISOString()
  const startDate = model.weekStart || new Date().toISOString().slice(0, 10)
  const endDate   = model.weekEnd   || new Date().toISOString().slice(0, 10)

  const dayOfMonth = parseInt(startDate.slice(8, 10), 10) || 1
  const weekNo = Math.min(Math.ceil(dayOfMonth / 7), 5)

  // notes should only store schedule.remark or null
  const remarkClean = model.remark && typeof model.remark === 'string' && model.remark.trim() !== ''
    ? model.remark.trim()
    : null

  const row = {
    week_no: weekNo,
    start_date: startDate,
    end_date: endDate,
    notes: remarkClean,
    updated_at: model.updatedAt || now,
  }

  return row
}

console.log('=== VERIFYING schedule_weeks.notes REMARK ONLY ===\n');

// Test Case 1: With remark "測試"
const schedule1 = {
  storeId: '101',
  storeName: '慶東門市',
  weekStart: '2026-08-03',
  weekEnd: '2026-08-09',
  employees: [{ id: 'emp-1', name: '張偉強', shifts: [] }],
  remark: '測試'
};

const row1 = modelToWeekDbRow(schedule1);
console.log('Test 1 (remark = "測試"):');
console.log('notes value:', JSON.stringify(row1.notes));
console.log('Full Row:', JSON.stringify(row1, null, 2));

// Test Case 2: Without remark (empty)
const schedule2 = {
  storeId: '101',
  storeName: '慶東門市',
  weekStart: '2026-08-03',
  weekEnd: '2026-08-09',
  employees: [{ id: 'emp-1', name: '張偉強', shifts: [] }],
  remark: ''
};

const row2 = modelToWeekDbRow(schedule2);
console.log('\nTest 2 (remark = ""):');
console.log('notes value:', row2.notes);
console.log('Full Row:', JSON.stringify(row2, null, 2));
