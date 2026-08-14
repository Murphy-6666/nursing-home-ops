---
name: "nursing-home-ops"
description: "Nursing home daily operations AI workflow toolkit covering care records, family notifications, scheduling, medication, health monitoring, dining, activities, and finance. Invoke when user needs to automate or digitize elderly care facility operations."
---

# 养老院日常运营 AI 工作流

## 适用场景

本技能适用于养老院、养护院、老年公寓、护理中心等 elderly care facility 的日常运营管理。当用户需要以下场景时触发：

- 护理记录数字化与自动化归档
- 家属状态通知与周报生成
- 护理员排班管理
- 老人用药提醒与跟踪
- 健康数据监测与异常预警
- 餐饮营养管理
- 文娱活动规划
- 财务费用管理

## 落地工具栈

| 工具 | 用途 |
|------|------|
| 飞书多维表格 (Base) | 数据存储、表单录入、自动化触发 |
| 飞书文档 (Docx) | 周报、月报、活动方案生成 |
| 飞书IM | 消息推送、家属通知、内部沟通 |
| 飞书日历 | 排班同步、用药提醒、活动安排 |
| 飞书审批 | 费用审批、请假流程 |
| AI 语音转文字 | 护理记录语音录入 |
| AI 视频生成 | 培训视频、活动宣传 |

## 工作流索引

### 第一优先级：马上能做（无需额外设备）

| 模块 | 文件 | 核心价值 |
|------|------|----------|
| 护理记录自动化 | [workflows/care-records.md](workflows/care-records.md) | 语音录入，效率翻倍 |
| 家属沟通自动化 | [workflows/family-notify.md](workflows/family-notify.md) | 减少电话，家属安心 |
| 排班管理 | [workflows/scheduling.md](workflows/scheduling.md) | 智能排班，冲突检测 |
| 用药提醒 | [workflows/medication.md](workflows/medication.md) | 定时推送，杜绝漏服 |

### 第二优先级：配置后可用（1-2天搭建）

| 模块 | 文件 | 核心价值 |
|------|------|----------|
| 健康档案与预警 | [workflows/health-archive.md](workflows/health-archive.md) | 数据驱动，提前干预 |
| 餐饮管理 | [workflows/dining.md](workflows/dining.md) | 营养配餐，禁忌管理 |
| 活动管理 | [workflows/activities.md](workflows/activities.md) | 方案生成，效果追踪 |
| 财务管理 | [workflows/finance.md](workflows/finance.md) | 自动账单，收支报表 |

## 推进路线图

```
第1周：搭建飞书多维表格基础（老人档案 + 护理记录 + 排班表）
第2周：接入语音转文字 + 家属自动推送
第3周：用药提醒 + 健康预警
第4周：餐饮管理 + 活动管理 + 财务报表
后续：  根据预算引入智能设备（摄像头、手环、传感器）
```

## 多维表格基础架构

详见 [templates/base-schema.md](templates/base-schema.md)，包含 7 张核心表的字段定义：

- 老人基本信息表
- 护理记录表
- 用药方案表
- 排班表
- 健康数据表
- 费用台账表
- 活动记录表

## 使用示例

### 示例1：语音录入护理记录

用户：「帮我记录一下，张奶奶今天早上血压135/85，吃了降压药，精神状态不错，中午吃了半碗饭」

AI 处理流程：
1. 语音转文字
2. 提取关键信息：老人姓名、时间、血压值、用药情况、饮食情况、精神状态
3. 写入飞书多维表格「护理记录表」
4. 血压值与正常范围比对，无异常则静默入库
5. 汇总到当日护理摘要，待晚推送家属

### 示例2：生成家属周报

用户：「帮我生成本周张奶奶的状态周报，发给家属」

AI 处理流程：
1. 从多维表格查询本周护理记录
2. 汇总饮食、睡眠、用药、活动、体征数据
3. 生成结构化周报（使用 templates/weekly-report.md 模板）
4. 通过飞书IM发送给家属

### 示例3：用药提醒

用户：「设置李爷爷的用药提醒，降压药每天早上8点，降糖药每天三餐前」

AI 处理流程：
1. 在用药方案表中录入用药信息
2. 创建飞书日历定时事件
3. 到点触发飞书IM消息推送给当班护理员
4. 护理员确认服药后记录入库

## 注意事项

1. **隐私保护**：老人健康数据属于个人隐私，多维表格需设置访问权限，仅授权人员可查看
2. **数据备份**：定期导出多维表格数据，防止数据丢失
3. **渐进推进**：不要一次性全部上线，按路线图分步实施，让护理团队逐步适应
4. **培训先行**：每个模块上线前，对护理员进行15分钟操作培训
5. **设备兼容**：确保老年护理员能简单上手，界面要大字、简洁