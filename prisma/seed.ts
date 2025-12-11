// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

// 直接实例化，不依赖 src/lib/prisma，避免路径解析麻烦
const prisma = new PrismaClient()

const INITIAL_QUESTIONS = [
  { order: 1, category: "一、生产与质量", type: "number", label: "1、生产头条开卡几条？内容是否按规范填写、评论是否完整全面" },
  { order: 2, category: "一、生产与质量", type: "number", label: "2、生产头条关卡几条？" },
  { order: 3, category: "一、生产与质量", type: "number", label: "3、QC头条开卡几条？内容是否按规范填写、评论是否完整全面" },
  { order: 4, category: "一、生产与质量", type: "boolean", label: "4、QC头条是否正常关卡？" },
  { order: 5, category: "一、生产与质量", type: "number", label: "5、OKR开卡几条？内容是否按规范填写、评论是否完整全面" },
  { order: 6, category: "一、生产与质量", type: "boolean", label: "6、OKR是否正常关卡？" },
  { order: 7, category: "一、生产与质量", type: "number", label: "7、精益提报几条？" },
  { order: 8, category: "一、生产与质量", type: "number", label: "8、精益实地验证几条？奖励是否落实" },
  { order: 9, category: "一、生产与质量", type: "number", label: "9、IPQC点检开卡几条？" },
  { order: 10, category: "二、现场与设备", type: "boolean", label: "1、新随拍全部打卡了吗？" },
  { order: 11, category: "二、现场与设备", type: "boolean", label: "2、激励是否用起来了？" },
  { order: 12, category: "二、现场与设备", type: "boolean", label: "3、当日开机设备是否都已点检" },
  { order: 13, category: "二、现场与设备", type: "boolean", label: "4、每日上下岗打卡都做了吗？哪些人没打卡？哪些人选错班次？" },
  { order: 14, category: "三、嘟嘟卡与效率", type: "boolean", label: "1、必应是否都已消除艾特？内容是否按规范填写、评论是否完整全面" },
  { order: 15, category: "三、嘟嘟卡与效率", type: "boolean", label: "2、嘟嘟卡计划在下班前就上传了吗？八点准时开线吗？" },
  { order: 16, category: "三、嘟嘟卡与效率", type: "boolean", label: "3、嘟嘟卡机时、人时、绩效是否正常？" },
  { order: 17, category: "三、嘟嘟卡与效率", type: "boolean", label: "4、嘟嘟卡UPH是否合理，有没有异常产量？产量是否有较大起伏？" },
  { order: 18, category: "三、嘟嘟卡与效率", type: "boolean", label: "5、车间检查时，嘟嘟卡线上开线产品与实际生产产品是否一致" },
  { order: 19, category: "三、嘟嘟卡与效率", type: "boolean", label: "6、车间检查时，嘟嘟卡上线产品生产完是否及时上下线" },
  { order: 20, category: "三、嘟嘟卡与效率", type: "boolean", label: "7、三方核对时，嘟嘟卡产出与数采产量与实际产量是否一致" },
  // { order: 21, category: "四、总结", type: "text", label: "21、今天还做了什么？可以总结在这里。" },
];

async function main() {
  console.log('🌱 开始初始化数据...');

  // 1. 创建角色
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: '系统管理员' },
  })
  const officerRole = await prisma.role.upsert({
    where: { name: 'officer' },
    update: {},
    create: { name: 'officer', description: '数字官' },
  })

  // 2. 创建初始超级管理员 (工号 88888)
  // 如果数据库里已经有这个工号，upsert 会只做更新(空操作)，不会报错
  await prisma.user.upsert({
    where: { workId: '88888' },
    update: {},
    create: {
      workId: '88888',
      password: '123456',
      name: '超级管理员',
      assignedAreas: '全厂区域',
      roles: { connect: [{ id: adminRole.id }, { id: officerRole.id }] }
    },
  })

  // 3. 初始题目入库
  for (const q of INITIAL_QUESTIONS) {
    const exist = await prisma.question.findFirst({ where: { label: q.label } });
    if (!exist) {
      await prisma.question.create({ data: q });
    }
  }

  console.log('✅ 数据库初始化完成');
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })