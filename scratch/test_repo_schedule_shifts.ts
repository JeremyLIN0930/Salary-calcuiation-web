import { supabaseScheduleRepository } from '../src/repositories/SupabaseScheduleRepository';
import { supabase } from '../src/lib/supabase';

async function testRepository() {
  console.log('=== STARTING REPOSITORY SCHEDULE SHIFTS TEST ===\n');

  // Find or create dummy employee if needed
  const { data: emps } = await supabase
    .from('master_employees')
    .select('id, name')
    .limit(1);

  let employee = emps?.[0];
  if (!employee) {
    console.log('Creating dummy employee...');
    const { data: newEmp } = await supabase
      .from('master_employees')
      .insert([{
        name: '華進測試',
        company_id: '0553618d-1d44-4f24-b6d8-7981fd4c6427',
        is_active: true
      }])
      .select('id, name')
      .single();
    employee = newEmp;
  }

  console.log('👤 Master Employee:', employee.name, '| UUID:', employee.id);

  // Construct a schedule week payload with shifts for this employee
  const schedulePayload = {
    weekStart: '2028-01-03',
    weekEnd: '2028-01-09',
    storeName: '慶東門市',
    storeId: '001',
    remark: '測試備註說明',
    employees: [
      {
        id: employee.id,
        name: employee.name,
        shifts: [
          {
            date: '2028-01-03',
            type: 'work' as const,
            startTime: '08:00',
            endTime: '16:00',
            remark: '上班說明'
          },
          {
            date: '2028-01-04',
            type: 'off' as const,
            remark: '休假說明'
          }
        ]
      }
    ]
  };

  console.log('\n1. Saving schedule via repository.saveSchedule()...');
  const saveResult = await supabaseScheduleRepository.saveSchedule(schedulePayload);
  if (!saveResult.success || !saveResult.data) {
    console.error('❌ Failed to save schedule:', saveResult.error);
    return;
  }
  const savedSchedule = saveResult.data;
  console.log('✅ Save Success! Week ID:', savedSchedule.id);
  console.log('   Saved Employees count:', savedSchedule.employees.length);
  if (savedSchedule.employees[0]) {
    console.log('   Emp name:', savedSchedule.employees[0].name);
    console.log('   Emp shifts:', JSON.stringify(savedSchedule.employees[0].shifts, null, 2));
  }

  console.log('\n2. Retrieving schedule via repository.getSchedule()...');
  const getResult = await supabaseScheduleRepository.getSchedule(savedSchedule.id);
  if (!getResult.success || !getResult.data) {
    console.error('❌ Failed to retrieve schedule:', getResult.error);
    return;
  }
  const retrieved = getResult.data;
  console.log('✅ Load Success! ID:', retrieved.id);
  console.log('   Roster count:', retrieved.employees.length);
  if (retrieved.employees[0]) {
    console.log('   Emp name:', retrieved.employees[0].name);
    console.log('   Emp shifts count:', retrieved.employees[0].shifts.length);
    console.log('   Emp shifts:', JSON.stringify(retrieved.employees[0].shifts, null, 2));
  }

  // Cleanup
  console.log('\n3. Cleaning up test week...');
  const delResult = await supabaseScheduleRepository.deleteSchedule(retrieved.id);
  console.log('✅ Cleanup Success:', delResult.success);
  
  console.log('\n🎉 ALL REPOSITORY STEPS PASSED SUCCESSFULLY!');
}

testRepository().catch(err => console.error(err));
