// 演示数据生成脚本 —— 向已建好的 15 张表写入真实感的示例数据
// 用法：npm run seed
// 需要先运行 npm start 完成建表，并生成 table-id-mapping.json

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BASE_URL = 'https://open.feishu.cn/open-apis/bitable/v1';

async function getAccessToken() {
  const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: process.env.APP_ID, app_secret: process.env.APP_SECRET }),
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(`获取令牌失败: ${data.msg}`);
  return data.tenant_access_token;
}

// 批量写入记录（每批最多 500 条）
async function batchInsert(token, appToken, tableId, records) {
  const res = await fetch(`${BASE_URL}/apps/${appToken}/tables/${tableId}/records/batch_create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ records }),
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(`写入失败: ${data.msg}`);
  return data.data.records;
}

// 查询表中所有记录（用于获取关联字段的 record_id）
async function listRecords(token, appToken, tableId) {
  const all = [];
  let pageToken = null;
  do {
    const url = `${BASE_URL}/apps/${appToken}/tables/${tableId}/records?page_size=500${pageToken ? `&page_token=${pageToken}` : ''}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.code !== 0) throw new Error(`查询失败: ${data.msg}`);
    all.push(...(data.data.items || []));
    pageToken = data.data.page_token;
  } while (pageToken);
  return all;
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

// ===== 演示数据 =====

const DEMO_EMPLOYEES = [
  { 姓名: '王秀兰', 岗位: '院长', 职级: '主管', 飞书ID: '', 手机号: '13800001001', 入职日期: 1711929600000, 状态: '在职' },
  { 姓名: '李美珍', 岗位: '护士', 职级: '高级', 飞书ID: '', 手机号: '13800001002', 入职日期: 1720627200000, 状态: '在职' },
  { 姓名: '张小红', 岗位: '护理员', 职级: '中级', 飞书ID: '', 手机号: '13800001003', 入职日期: 1725148800000, 状态: '在职' },
  { 姓名: '刘桂芳', 岗位: '护理员', 职级: '初级', 飞书ID: '', 手机号: '13800001004', 入职日期: 1730284800000, 状态: '在职' },
  { 姓名: '陈师傅', 岗位: '厨师', 职级: '中级', 飞书ID: '', 手机号: '13800001005', 入职日期: 1714521600000, 状态: '在职' },
  { 姓名: '赵阿姨', 岗位: '保洁', 职级: '初级', 飞书ID: '', 手机号: '13800001006', 入职日期: 1727740800000, 状态: '在职' },
];

const DEMO_RESIDENTS = [
  { 姓名: '张桂芳', 性别: '女', 出生年月: 631152000000, 入住日期: 1704067200000, 房间号: 'A-301', 床位号: '1', 护理等级: '半护理', 饮食类型: '软食', 饮食禁忌: ['低盐', '低脂'], 过敏食物: [], 主要疾病: '高血压、轻度认知障碍', 紧急联系人: '张明(子) 13900001001', 状态: '在住', 备注: '喜欢听老歌' },
  { 姓名: '李德福', 性别: '男', 出生年月: 567964800000, 入住日期: 1696118400000, 房间号: 'A-302', 床位号: '1', 护理等级: '全护理', 饮食类型: '半流食', 饮食禁忌: ['糖尿病饮食'], 过敏食物: ['鸡蛋'], 主要疾病: '糖尿病、脑梗后遗症', 紧急联系人: '李红(女) 13900001002', 状态: '在住', 备注: '需协助进食' },
  { 姓名: '王秀英', 性别: '女', 出生年月: 694224000000, 入住日期: 1711929600000, 房间号: 'B-201', 床位号: '1', 护理等级: '自理', 饮食类型: '普食', 饮食禁忌: [], 过敏食物: ['海鲜'], 主要疾病: '骨质疏松', 紧急联系人: '王强(子) 13900001003', 状态: '在住', 备注: '积极参与活动' },
  { 姓名: '赵国栋', 性别: '男', 出生年月: 588672000000, 入住日期: 1709251200000, 房间号: 'B-202', 床位号: '1', 护理等级: '特护', 饮食类型: '流食', 饮食禁忌: ['低盐', '低嘌呤'], 过敏食物: ['牛奶'], 主要疾病: '帕金森、冠心病', 紧急联系人: '赵丽(女) 13900001004', 状态: '在住', 备注: '鼻饲' },
  { 姓名: '孙玉兰', 性别: '女', 出生年月: 654979200000, 入住日期: 1725148800000, 房间号: 'A-303', 床位号: '1', 护理等级: '半护理', 饮食类型: '软食', 饮食禁忌: ['低糖'], 过敏食物: [], 主要疾病: '关节炎', 紧急联系人: '孙伟(子) 13900001005', 状态: '在住', 备注: '' },
];

const DEMO_ACTIVITY_PLANS = [
  { 活动名称: '手指保健操', 活动类型: '运动', 适合能力等级: ['自理', '半护理', '全护理'], '时长(分钟)': 20, 所需物资: '无', 所需人手: 1, 活动描述: '热身搓手转腕→逐指弯曲→按摩放松→手指游戏', 难度等级: '简单' },
  { 活动名称: '老歌大家唱', 活动类型: '音乐', 适合能力等级: ['自理', '半护理', '全护理'], '时长(分钟)': 45, 所需物资: '歌本;音响', 所需人手: 1, 活动描述: '选经典老歌10首逐首跟唱，中间穿插歌词接龙', 难度等级: '简单' },
  { 活动名称: '剪纸窗花', 活动类型: '手工', 适合能力等级: ['自理', '半护理'], '时长(分钟)': 60, 所需物资: '彩纸;剪刀;胶水', 所需人手: 2, 活动描述: '示范基础折法→剪出窗花→展示交流', 难度等级: '中等' },
  { 活动名称: '记忆棋盘游戏', 活动类型: '认知', 适合能力等级: ['自理', '半护理', '认知障碍'], '时长(分钟)': 30, 所需物资: '记忆棋', 所需人手: 1, 活动描述: '翻牌配对游戏，锻炼记忆力', 难度等级: '中等' },
];

const DEMO_FEE_STANDARDS = [
  { 费用类别: '床位费', 费用明细: '双人间', 护理等级: '半护理', '月收费标准(元)': 2500, '日收费标准(元)': 83, 生效日期: 1704067200000 },
  { 费用类别: '床位费', 费用明细: '单人间', 护理等级: '全护理', '月收费标准(元)': 4000, '日收费标准(元)': 133, 生效日期: 1704067200000 },
  { 费用类别: '护理费', 费用明细: '半护理', 护理等级: '半护理', '月收费标准(元)': 1800, '日收费标准(元)': 60, 生效日期: 1704067200000 },
  { 费用类别: '护理费', 费用明细: '全护理', 护理等级: '全护理', '月收费标准(元)': 3500, '日收费标准(元)': 117, 生效日期: 1704067200000 },
  { 费用类别: '餐费', 费用明细: '标准餐', 护理等级: '自理', '月收费标准(元)': 1200, '日收费标准(元)': 40, 生效日期: 1704067200000 },
  { 费用类别: '餐费', 费用明细: '软食餐', 护理等级: '半护理', '月收费标准(元)': 1500, '日收费标准(元)': 50, 生效日期: 1704067200000 },
];

const DEMO_MEDICATION_PLANS = [
  { 老人姓名_idx: 0, 药品名称: '硝苯地平缓释片', 药品通用名: '硝苯地平', 剂量: '10mg/1片', 服药频率: '每日2次', 服药时间: '08:00;20:00', 服药方式: '餐后', 开始日期: 1704067200000, 状态: '服用中', 备注: '降压药' },
  { 老人姓名_idx: 1, 药品名称: '二甲双胍片', 药品通用名: '盐酸二甲双胍', 剂量: '0.5g/1片', 服药频率: '每日3次', 服药时间: '07:00;12:00;18:00', 服药方式: '餐前', 开始日期: 1696118400000, 状态: '服用中', 备注: '降糖药' },
  { 老人姓名_idx: 1, 药品名称: '阿司匹林肠溶片', 药品通用名: '阿司匹林', 剂量: '100mg/1片', 服药频率: '每日1次', 服药时间: '08:00', 服药方式: '空腹', 开始日期: 1696118400000, 状态: '服用中', 备注: '抗血小板' },
  { 老人姓名_idx: 3, 药品名称: '美多芭片', 药品通用名: '多巴丝肼', 剂量: '125mg/1片', 服药频率: '每日3次', 服药时间: '07:00;12:00;17:00', 服药方式: '餐前', 开始日期: 1709251200000, 状态: '服用中', 备注: '帕金森用药' },
];

const DEMO_MEDICATION_INVENTORY = [
  { 药品名称: '硝苯地平缓释片', 药品通用名: '硝苯地平', '当前库存(盒)': 8, '单盒用量(片)': 14, '日均消耗(片)': 2, '预警阈值(盒)': 5, 备注: '' },
  { 药品名称: '二甲双胍片', 药品通用名: '盐酸二甲双胍', '当前库存(盒)': 3, '单盒用量(片)': 20, '日均消耗(片)': 3, '预警阈值(盒)': 5, 备注: '库存偏低' },
  { 药品名称: '阿司匹林肠溶片', 药品通用名: '阿司匹林', '当前库存(盒)': 12, '单盒用量(片)': 30, '日均消耗(片)': 1, '预警阈值(盒)': 4, 备注: '' },
  { 药品名称: '美多芭片', 药品通用名: '多巴丝肼', '当前库存(盒)': 6, '单盒用量(片)': 40, '日均消耗(片)': 3, '预警阈值(盒)': 5, 备注: '' },
];

const DEMO_DINING_MENU = [
  { 日期: 1723766400000, 餐次: '早餐', 菜品名称: '小米南瓜粥', 食材清单: '小米;南瓜', 营养标签: ['低盐', '高纤维'], 适合饮食类型: ['普食', '软食', '半流食'], '热量(千卡)': 180 },
  { 日期: 1723766400000, 餐次: '早餐', 菜品名称: '蒸蛋羹', 食材清单: '鸡蛋', 营养标签: ['高蛋白'], 适合饮食类型: ['普食', '软食', '半流食'], '热量(千卡)': 120 },
  { 日期: 1723766400000, 餐次: '午餐', 菜品名称: '清蒸鲈鱼', 食材清单: '鲈鱼;姜;葱', 营养标签: ['低脂', '高蛋白'], 适合饮食类型: ['普食', '软食'], '热量(千卡)': 220 },
  { 日期: 1723766400000, 餐次: '午餐', 菜品名称: '番茄豆腐汤', 食材清单: '番茄;豆腐', 营养标签: ['低盐', '低脂'], 适合饮食类型: ['普食', '软食', '半流食'], '热量(千卡)': 90 },
  { 日期: 1723766400000, 餐次: '晚餐', 菜品名称: '蔬菜瘦肉粥', 食材清单: '大米;瘦肉;青菜', 营养标签: ['低盐', '高纤维'], 适合饮食类型: ['普食', '软食', '半流食', '流食'], '热量(千卡)': 150 },
];

// 生成最近7天的护理记录
function generateCareRecords(residentIds, employeeIds) {
  const records = [];
  const now = Date.now();
  const dayMs = 86400000;

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = now - dayOffset * dayMs;
    for (let i = 0; i < DEMO_RESIDENTS.length; i++) {
      const resident = DEMO_RESIDENTS[i];
      // 根据老人特点生成体征数据
      const tempBase = 36.3 + Math.random() * 0.8;
      const sbpBase = resident.护理等级 === '全护理' || resident.护理等级 === '特护' ? 135 + Math.random() * 15 : 120 + Math.random() * 15;
      const dbpBase = 75 + Math.random() * 10;
      const hrBase = 68 + Math.random() * 12;
      const glucoseBase = resident.主要疾病.includes('糖尿病') ? 6.5 + Math.random() * 2 : 4.5 + Math.random() * 1.5;

      records.push({
        fields: {
          记录日期: date,
          记录时间: '08:30',
          老人姓名: [residentIds[i]],
          班次: '白班',
          体温: Math.round(tempBase * 10) / 10,
          收缩压: Math.round(sbpBase),
          舒张压: Math.round(dbpBase),
          心率: Math.round(hrBase),
          血糖: Math.round(glucoseBase * 10) / 10,
          血糖类型: '空腹',
          用药情况: '已按方案服药',
          饮食情况: '正常进食',
          睡眠情况: '夜间睡眠尚可',
          精神状态: Math.random() > 0.7 ? '一般' : '良好',
          排泄情况: '正常',
          皮肤状况: '完整无破损',
          护理内容: '晨间护理、测量体征、协助用药',
          记录人: [employeeIds[2]],
        },
      });
    }
  }
  return records;
}

// 生成排班数据
function generateSchedule(employeeIds) {
  const records = [];
  const now = Date.now();
  const dayMs = 86400000;
  const shifts = ['白班(08-16)', '中班(16-24)', '夜班(00-08)'];
  const areas = ['A区', 'B区', 'C区'];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = now - dayOffset * dayMs;
    for (let shiftIdx = 0; shiftIdx < 3; shiftIdx++) {
      for (let areaIdx = 0; areaIdx < 3; areaIdx++) {
        const empIdx = (shiftIdx * 3 + areaIdx) % 4 + 2; // 护理员从索引2开始
        records.push({
          fields: {
            日期: date,
            班次: shifts[shiftIdx],
            护理员: [employeeIds[empIdx]],
            负责区域: areas[areaIdx],
            状态: '正常',
            排班人: [employeeIds[0]],
          },
        });
      }
    }
  }
  return records;
}

// 生成费用数据
function generateFinance(residentIds) {
  const records = [];
  const now = Date.now();
  const monthStr = new Date(now).toISOString().slice(0, 7);

  for (let i = 0; i < DEMO_RESIDENTS.length; i++) {
    const r = DEMO_RESIDENTS[i];
    const baseFee = r.护理等级 === '特护' ? 7500 : r.护理等级 === '全护理' ? 6000 : r.护理等级 === '半护理' ? 4300 : 3700;
    records.push({
      fields: {
        记账日期: now,
        老人姓名: [residentIds[i]],
        费用类别: '床位费',
        费用明细: `${r.房间号} ${r.护理等级}`,
        金额: baseFee,
        计费周期: '月结',
        数量: 1,
        状态: '未结算',
        账单月份: monthStr,
      },
    });
    records.push({
      fields: {
        记账日期: now,
        老人姓名: [residentIds[i]],
        费用类别: '护理费',
        费用明细: `${r.护理等级}等级护理`,
        金额: Math.round(baseFee * 0.4),
        计费周期: '月结',
        数量: 1,
        状态: '未结算',
        账单月份: monthStr,
      },
    });
  }
  return records;
}

async function main() {
  const appToken = process.env.APP_TOKEN;
  if (!appToken) {
    console.error('请在 .env 文件中设置 APP_TOKEN');
    process.exit(1);
  }

  // 读取建表时生成的映射文件
  const mappingPath = path.join(__dirname, 'table-id-mapping.json');
  if (!fs.existsSync(mappingPath)) {
    console.error('未找到 table-id-mapping.json，请先运行 npm start 完成建表');
    process.exit(1);
  }

  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
  const token = await getAccessToken();
  console.log('=== 开始写入演示数据 ===\n');

  // 1. 写入员工表
  console.log('[1/15] 员工表...');
  const empRecords = DEMO_EMPLOYEES.map(e => ({ fields: e }));
  const empResult = await batchInsert(token, appToken, mapping['员工表'], empRecords);
  const empIds = empResult.map(r => r.record_id);
  console.log(`  写入 ${empIds.length} 条\n`);

  // 2. 写入老人基本信息表
  console.log('[2/15] 老人基本信息表...');
  const resRecords = DEMO_RESIDENTS.map(r => ({ fields: r }));
  const resResult = await batchInsert(token, appToken, mapping['老人基本信息表'], resRecords);
  const resIds = resResult.map(r => r.record_id);
  console.log(`  写入 ${resIds.length} 条\n`);

  // 3. 写入活动方案表
  console.log('[3/15] 活动方案表...');
  const planRecords = DEMO_ACTIVITY_PLANS.map(p => ({ fields: p }));
  const planResult = await batchInsert(token, appToken, mapping['活动方案表'], planRecords);
  const planIds = planResult.map(r => r.record_id);
  console.log(`  写入 ${planIds.length} 条\n`);

  // 4. 写入收费标准表
  console.log('[4/15] 收费标准表...');
  const feeStdRecords = DEMO_FEE_STANDARDS.map(f => ({ fields: f }));
  await batchInsert(token, appToken, mapping['收费标准表'], feeStdRecords);
  console.log(`  写入 ${feeStdRecords.length} 条\n`);

  // 5. 写入家属联系表
  console.log('[5/15] 家属联系表...');
  const familyRecords = [
    { 家属姓名: '张明', 关系: '子女', 联系方式: '13900001001', 对应老人: [resIds[0]], 推送频率: '每日', 推送时间: '20:00' },
    { 家属姓名: '李红', 关系: '子女', 联系方式: '13900001002', 对应老人: [resIds[1]], 推送频率: '每日', 推送时间: '20:00' },
    { 家属姓名: '王强', 关系: '子女', 联系方式: '13900001003', 对应老人: [resIds[2]], 推送频率: '每周', 推送时间: '20:00' },
    { 家属姓名: '赵丽', 关系: '子女', 联系方式: '13900001004', 对应老人: [resIds[3]], 推送频率: '每日', 推送时间: '20:00' },
  ];
  await batchInsert(token, appToken, mapping['家属联系表'], familyRecords.map(r => ({ fields: r })));
  console.log(`  写入 ${familyRecords.length} 条\n`);

  // 6. 写入护理记录表
  console.log('[6/15] 护理记录表（最近7天）...');
  const careRecords = generateCareRecords(resIds, empIds);
  await batchInsert(token, appToken, mapping['护理记录表'], careRecords);
  console.log(`  写入 ${careRecords.length} 条\n`);

  // 7. 写入用药方案表
  console.log('[7/15] 用药方案表...');
  const medPlanRecords = DEMO_MEDICATION_PLANS.map(m => {
    const { 老人姓名_idx, ...rest } = m;
    return { fields: { ...rest, 老人姓名: [resIds[老人姓名_idx]] } };
  });
  await batchInsert(token, appToken, mapping['用药方案表'], medPlanRecords);
  console.log(`  写入 ${medPlanRecords.length} 条\n`);

  // 8. 写入药品库存表
  console.log('[8/15] 药品库存表...');
  const invRecords = DEMO_MEDICATION_INVENTORY.map(m => ({ fields: m }));
  await batchInsert(token, appToken, mapping['药品库存表'], invRecords);
  console.log(`  写入 ${invRecords.length} 条\n`);

  // 9. 写入排班表
  console.log('[9/15] 排班表（最近7天）...');
  const scheduleRecords = generateSchedule(empIds);
  await batchInsert(token, appToken, mapping['排班表'], scheduleRecords);
  console.log(`  写入 ${scheduleRecords.length} 条\n`);

  // 10. 写入健康数据表
  console.log('[10/15] 健康数据表（最近7天）...');
  const healthRecords = generateCareRecords(resIds, empIds).map(r => ({
    fields: {
      记录日期: r.fields.记录日期,
      老人姓名: r.fields.老人姓名,
      体温: r.fields.体温,
      收缩压: r.fields.收缩压,
      舒张压: r.fields.舒张压,
      心率: r.fields.心率,
      血氧饱和度: 95 + Math.round(Math.random() * 4),
      血糖: r.fields.血糖,
      血糖类型: r.fields.血糖类型,
      记录人: r.fields.记录人,
    },
  }));
  await batchInsert(token, appToken, mapping['健康数据表'], healthRecords);
  console.log(`  写入 ${healthRecords.length} 条\n`);

  // 11. 写入费用台账表
  console.log('[11/15] 费用台账表...');
  const financeRecords = generateFinance(resIds);
  await batchInsert(token, appToken, mapping['费用台账表'], financeRecords);
  console.log(`  写入 ${financeRecords.length} 条\n`);

  // 12. 写入餐饮菜单表
  console.log('[12/15] 餐饮菜单表...');
  const menuRecords = DEMO_DINING_MENU.map(m => ({ fields: m }));
  await batchInsert(token, appToken, mapping['餐饮菜单表'], menuRecords);
  console.log(`  写入 ${menuRecords.length} 条\n`);

  // 13. 写入活动记录表
  console.log('[13/15] 活动记录表...');
  const actRecords = [
    { 活动日期: 1723766400000, 活动名称: [planIds[0]], 开始时间: '09:30', 结束时间: '09:50', 活动类型: '运动', 应参加人数: 5, 实参加人数: 4, 参与度: '高', 老人反馈: '积极', 带领人: [empIds[2]] },
    { 活动日期: 1723766400000, 活动名称: [planIds[1]], 开始时间: '14:00', 结束时间: '14:45', 活动类型: '音乐', 应参加人数: 5, 实参加人数: 5, 参与度: '高', 老人反馈: '积极', 带领人: [empIds[3]] },
    { 活动日期: 1723852800000, 活动名称: [planIds[2]], 开始时间: '10:00', 结束时间: '11:00', 活动类型: '手工', 应参加人数: 3, 实参加人数: 2, 参与度: '中', 老人反馈: '积极', 带领人: [empIds[2]] },
  ];
  await batchInsert(token, appToken, mapping['活动记录表'], actRecords.map(r => ({ fields: r })));
  console.log(`  写入 ${actRecords.length} 条\n`);

  // 14. 写入服药记录表
  console.log('[14/15] 服药记录表...');
  const medRecordData = [];
  const now = Date.now();
  for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
    const date = now - dayOffset * 86400000;
    for (const plan of DEMO_MEDICATION_PLANS) {
      const times = plan.服药时间.split(';');
      for (const time of times) {
        medRecordData.push({
          fields: {
            日期: date,
            老人姓名: [resIds[plan.老人姓名_idx]],
            药品名称: plan.药品名称,
            应服时间: time,
            实际服药时间: Math.random() > 0.1 ? time : '',
            服药状态: Math.random() > 0.1 ? '已服' : '漏服',
            操作人: [empIds[2]],
          },
        });
      }
    }
  }
  await batchInsert(token, appToken, mapping['服药记录表'], medRecordData);
  console.log(`  写入 ${medRecordData.length} 条\n`);

  // 15. 写入餐饮反馈表
  console.log('[15/15] 餐饮反馈表...');
  const feedbackData = [];
  for (let i = 0; i < DEMO_RESIDENTS.length; i++) {
    feedbackData.push({
      fields: {
        日期: 1723766400000,
        餐次: '早餐',
        菜品名称: '小米南瓜粥',
        进食量: DEMO_RESIDENTS[i].护理等级 === '特护' ? '少量' : '全部吃完',
        反馈: '喜欢',
        记录人: [empIds[3]],
      },
    });
    feedbackData.push({
      fields: {
        日期: 1723766400000,
        餐次: '午餐',
        菜品名称: '清蒸鲈鱼',
        进食量: DEMO_RESIDENTS[i].饮食类型 === '流食' ? '少量' : '大半',
        反馈: '一般',
        记录人: [empIds[3]],
      },
    });
  }
  await batchInsert(token, appToken, mapping['餐饮反馈表'], feedbackData.map(r => ({ fields: r })));
  console.log(`  写入 ${feedbackData.length} 条\n`);

  console.log('=== 演示数据写入完成 ===');
  console.log('现在打开飞书多维表格，可以看到完整的运营数据。');
  console.log('清理演示数据：在飞书多维表格中全选删除即可。');
}

main().catch(err => {
  console.error('运行出错:', err.message);
  process.exit(1);
});
