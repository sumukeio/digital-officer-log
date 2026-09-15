import { getCurrentUser } from '@/app/actions/auth';
import { getDefaultWeekRange } from '@/lib/weekly-report/date-helper';
import QcWorkshopClient from './qc-workshop-client';

export const dynamic = 'force-dynamic';

export default async function QcWorkshopPage() {
  const user = await getCurrentUser();

  const currentUser = user || {
    id: 'dev-officer-id',
    name: '数字官',
    workId: 'DO-001',
    roles: [{ id: 'r1', name: 'admin' }],
  };

  const defaultRange = getDefaultWeekRange(new Date());

  return (
    <QcWorkshopClient currentUser={currentUser as any} initialDateRange={defaultRange} />
  );
}
