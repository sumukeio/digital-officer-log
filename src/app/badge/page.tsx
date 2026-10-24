import { getCurrentUser } from '@/app/actions/auth';
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

  return <BadgeClient currentUser={currentUser as any} />;
}
