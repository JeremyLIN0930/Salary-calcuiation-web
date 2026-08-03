function formatStoreTitle(sch) {
  if (!sch) return '';
  const name = sch.storeName || '門市';
  const isUuid = (str) => typeof str === 'string' && str.includes('-') && str.length > 20;

  let code = sch.storeCode;
  if (!code && sch.storeId && !isUuid(sch.storeId)) {
    code = sch.storeId;
  }
  if (!code) {
    if (name.includes('慶東')) code = '001';
    else if (name.includes('南醫')) code = '002';
  }

  return code ? `【${code}】${name}` : name;
}

console.log('=== VERIFYING formatStoreTitle OUTPUTS ===\n');

console.log('1. UUID + 慶東門市:', formatStoreTitle({ storeId: 'b357ddf1-7024-4a0a-8aa0-66c62214dbeb', storeName: '慶東門市' }));
console.log('2. UUID + 南醫門市:', formatStoreTitle({ storeId: 'f01fab38-60d9-4e34-99bd-d5b51e580a42', storeName: '南醫門市' }));
console.log('3. storeCode 101 + 慶東門市:', formatStoreTitle({ storeCode: '101', storeName: '慶東門市' }));
console.log('4. storeId 001 + 慶東門市:', formatStoreTitle({ storeId: '001', storeName: '慶東門市' }));

const result1 = formatStoreTitle({ storeId: 'b357ddf1-7024-4a0a-8aa0-66c62214dbeb', storeName: '慶東門市' });
if (result1.includes('b357ddf1')) {
  console.error('\n❌ FAIL: UUID leaked into title!');
  process.exit(1);
} else {
  console.log('\n✅ SUCCESS: No UUID in title output!');
}
