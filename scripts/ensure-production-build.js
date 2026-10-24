/**
 * 生产启动前门禁：确认存在 Next.js 生产构建产物。
 * 避免 PM2 在未 build 时反复重启刷屏。
 */
const fs = require('fs');
const path = require('path');

const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID');

if (!fs.existsSync(buildIdPath)) {
  console.error('');
  console.error('❌ 未找到生产构建产物：.next/BUILD_ID');
  console.error('   next start / start:bt 必须先完成 npm run build。');
  console.error('');
  console.error('在服务器项目根目录按序执行：');
  console.error('  cd /www/wwwroot/digital-officer-log');
  console.error('  npm run build');
  console.error('  # 确认存在：ls .next/BUILD_ID');
  console.error('  pm2 restart digital-officer-log');
  console.error('  # 或首次：PORT=3002 pm2 start npm --name digital-officer-log -- run start:bt');
  console.error('');
  process.exit(1);
}

const id = fs.readFileSync(buildIdPath, 'utf8').trim();
if (!id) {
  console.error('❌ .next/BUILD_ID 为空，请重新执行 npm run build');
  process.exit(1);
}
