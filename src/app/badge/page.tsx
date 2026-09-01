import { getCurrentUser } from '@/app/actions/auth';
import { prisma } from '@/lib/prisma';
import BadgeClient from './badge-client';

export const dynamic = 'force-dynamic';

export default async function BadgePage() {
  const user = await getCurrentUser();

  const currentUser = user || {
    id: 'dev-officer-id',
    name: '数字官',
    workId: 'DO-001',
    roles: [{ id: 'r1', name: 'admin' }],
  };

  let systemUsers: Array<{
    id: string;
    name: string | null;
    workId: string;
    assignedAreas?: string | null;
  }> = [];

  try {
    systemUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        workId: true,
        assignedAreas: true,
      },
      orderBy: { workId: 'asc' },
    });
  } catch (e) {
    console.error('获取系统用户列表失败 (使用空列表):', e);
  }

  return <BadgeClient currentUser={currentUser as any} systemUsers={systemUsers} />;
}
