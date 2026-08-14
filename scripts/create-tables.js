const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { TABLES } = require('./table-definitions');

const BASE_URL = 'https://open.feishu.cn/open-apis/bitable/v1';

// 获取飞书应用访问令牌
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
  if (data.code !== 0) {
    throw new Error(`获取令牌失败: ${data.msg}`);
  }
  return data.tenant_access_token;
}

// 创建数据表
async function createTable(token, appToken, tableName) {
  const res = await fetch(`${BASE_URL}/apps/${appToken}/tables`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ table: { name: tableName } }),
  });
  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`创建表「${tableName}」失败: ${data.msg}`);
  }
  console.log(`  [OK] 创建表: ${tableName} (table_id: ${data.data.table_id})`);
  return data.data.table_id;
}

// 创建字段
async function createField(token, appToken, tableId, field) {
  const res = await fetch(`${BASE_URL}/apps/${appToken}/tables/${tableId}/fields`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(field),
  });
  const data = await res.json();
  if (data.code !== 0) {
    console.log(`  [WARN] 字段「${field.field_name}」创建失败: ${data.msg}`);
    return null;
  }
  return data.data.field_id;
}

// 主流程：先建基础表，再建关联表
async function main() {
  const appToken = process.env.APP_TOKEN;
  if (!appToken) {
    console.error('请在 .env 文件中设置 APP_TOKEN（飞书多维表格的 app_token）');
    process.exit(1);
  }

  console.log('=== 养老院多维表格自动建表 ===\n');

  const token = await getAccessToken();
  console.log('获取访问令牌成功\n');

  const tableIds = {};

  // 先创建老人基本信息表和员工表（其他表需要关联它们）
  const priorityOrder = ['老人基本信息表', '员工表'];
  const remainingTables = TABLES.filter(t => !priorityOrder.includes(t.name));

  for (const tableName of priorityOrder) {
    const tableDef = TABLES.find(t => t.name === tableName);
    tableIds[tableName] = await createTable(token, appToken, tableName);

    for (const field of tableDef.fields) {
      await createField(token, appToken, tableIds[tableName], field);
    }
    console.log(`  字段创建完成\n`);
  }

  // 再创建其余表，关联字段指向已创建的表
  for (const tableDef of remainingTables) {
    tableIds[tableDef.name] = await createTable(token, appToken, tableDef.name);

    for (const field of tableDef.fields) {
      let fieldConfig = { ...field };
      // 替换关联表 ID 占位符为实际的 table_id
      if (field.type === 11 && field.property?.table_id) {
        const placeholder = field.property.table_id;
        if (placeholder === '__RESIDENTS_TABLE_ID__') {
          fieldConfig.property.table_id = tableIds['老人基本信息表'];
        } else if (placeholder === '__EMPLOYEES_TABLE_ID__') {
          fieldConfig.property.table_id = tableIds['员工表'];
        }
      }
      await createField(token, appToken, tableIds[tableDef.name], fieldConfig);
    }
    console.log(`  字段创建完成\n`);
  }

  // 保存 table_id 映射
  const mappingPath = path.join(__dirname, 'table-id-mapping.json');
  fs.writeFileSync(mappingPath, JSON.stringify(tableIds, null, 2));
  console.log('=== 全部完成 ===');
  console.log(`表 ID 映射已保存到: ${mappingPath}`);
}

main().catch(err => {
  console.error('运行出错:', err.message);
  process.exit(1);
});
