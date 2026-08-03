import { ScheduleMapper } from '../src/mappers/ScheduleMapper.js';

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

const row1 = ScheduleMapper.modelToWeekDbRow(schedule1);
console.log('Test 1 (remark = "測試"):');
console.log('Row notes:', row1.notes);
console.log('Payload JSON:', JSON.stringify(row1, null, 2));

// Test Case 2: Without remark (empty)
const schedule2 = {
  storeId: '101',
  storeName: '慶東門市',
  weekStart: '2026-08-03',
  weekEnd: '2026-08-09',
  employees: [{ id: 'emp-1', name: '張偉強', shifts: [] }],
  remark: ''
};

const row2 = ScheduleMapper.modelToWeekDbRow(schedule2);
console.log('\nTest 2 (remark = ""):');
console.log('Row notes:', row2.notes);
console.log('Payload JSON:', JSON.stringify(row2, null, 2));
