const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { TABLES, CREATION_ORDER } = require('./table-definitions');

const BASE_URL = 'https://open.feishu.cn/open-apis/bitable/v1';

async function getAccessToken() {
  const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: process.env.APP_ID,
      app_secret: process.env.APP_SECRET,
    }),
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(`获取令牌失败: ${data.msg}`);
  return data.tenant_access_token;
}

// 获取多维表格中的所有数据表
async function listTables(token, appToken) {
  const res = await fetch(`${BASE_URL}/apps/${appToken}/tables?page_size=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(`获取表列表失败: ${data.msg}`);
  return data.data.items || [];
}

// 获取表中所有字段
async function listFields(token, appToken, tableId) {
  const res = await fetch(`${BASE_URL}/apps/${appToken}/tables/${tableId}/fields?page_size=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(`获取字段失败: ${data.msg}`);
  return data.data.items || [];
}

async function main() {
  const appToken = process.env.APP_TOKEN;
  if (!appToken) {
    console.error('请在 .env 文件中设置 APP_TOKEN');
    process.exit(1);
  }

  console.log('=== 养老院系统搭建验证 ===\n');

  const token = await getAccessToken();
  const feishuTables = await listTables(token, appToken);

  // 检查是否有映射文件
  const mappingPath = path.join(__dirname, 'table-id-mapping.json');
  let mapping = {};
  if (fs.existsSync(mappingPath)) {
    mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
  }

  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  for (const expectedName of CREATION_ORDER) {
    const tableDef = TABLES.find(t => t.name === expectedName);
    if (!tableDef) continue;

    // 查找飞书中的对应表
    const feishuTable = feishuTables.find(t => t.name === expectedName);

    if (!feishuTable) {
      console.log(`[FAIL] ${expectedName} - 表不存在`);
      failCount++;
      continue;
    }

    // 获取该表的所有字段
    const feishuFields = await listFields(token, appToken, feishuTable.table_id);
    const fieldNames = feishuFields.map(f => f.field_name);

    // 检查每个预期字段是否存在
    const missingFields = tableDef.fields.filter(
      f => !fieldNames.includes(f.field_name)
    );

    if (missingFields.length === 0) {
      console.log(`[OK]   ${expectedName} - ${tableDef.fields.length} 个字段全部就绪`);
      passCount++;
    } else {
      const missingNames = missingFields.map(f => f.field_name).join(', ');
      console.log(`[WARN] ${expectedName} - 缺少 ${missingFields.length} 个字段: ${missingNames}`);
      warnCount++;
    }
  }

  // 汇总
  console.log('\n=== 验证结果 ===');
  console.log(`通过: ${passCount}/${CREATION_ORDER.length}`);
  console.log(`警告: ${warnCount}（字段缺失）`);
  console.log(`失败: ${failCount}（表缺失）`);

  if (failCount > 0) {
    console.log('\n有表未创建，请运行 npm start 创建表格');
  } else if (warnCount > 0) {
    console.log('\n部分字段缺失，通常是公式字段需要手动添加');
    console.log('公式字段请在飞书多维表格中手动创建，参考 SETUP.md 中的公式');
  } else {
    console.log('\n全部检查通过！系统已就绪');
  }
}

main().catch(err => {
  console.error('验证出错:', err.message);
  process.exit(1);
});
