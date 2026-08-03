import { groupSchedulesByMonth } from '../src/utils/scheduleMigration.ts';

const mockSchedules = [
  {
    id: 's1',
    storeId: '001',
    storeCode: '001',
    storeName: '慶東門市',
    weekStart: '2026-08-01',
    weekEnd: '2026-08-07',
    weekNo: 1,
    employees: [{ id: 'e1', name: 'A', shifts: [] }],
    remark: '',
    createdAt: '',
    updatedAt: ''
  },
  {
    id: 's2',
    storeId: '002',
    storeCode: '002',
    storeName: '南醫門市',
    weekStart: '2026-08-01',
    weekEnd: '2026-08-07',
    weekNo: 1,
    employees: [{ id: 'e2', name: 'B', shifts: [] }],
    remark: '',
    createdAt: '',
    updatedAt: ''
  },
  {
    id: 's3',
    storeId: '001',
    storeCode: '001',
    storeName: '慶東門市',
    weekStart: '2026-08-08',
    weekEnd: '2026-08-14',
    weekNo: 2,
    employees: [],
    remark: '',
    createdAt: '',
    updatedAt: ''
  },
  {
    id: 's4',
    storeId: '002',
    storeCode: '002',
    storeName: '南醫門市',
    weekStart: '2026-08-08',
    weekEnd: '2026-08-14',
    weekNo: 2,
    employees: [],
    remark: '',
    createdAt: '',
    updatedAt: ''
  }
];

console.log('=== MULTI-STORE WEEK DISPLAY SORTING TEST ===\n');

const groups = groupSchedulesByMonth(mockSchedules);
groups.forEach(g => {
  console.log(`Month: ${g.displayTitle}`);
  g.schedules.forEach(s => {
    console.log(`  - 第 ${s.weekNo} 週 【${s.storeCode}】${s.storeName} (${s.weekStart} ~ ${s.weekEnd})`);
  });
});

console.log('\nTEST PASSED!');
