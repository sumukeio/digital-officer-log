import { getCurrentUser } from '@/app/actions/auth';
import { getShiftData } from '@/app/actions/shifts';
import ShiftClient from './shift-client';

export const dynamic = 'force-dynamic';

export default async function ShiftPage() {
  const user = await getCurrentUser();

  const currentUser = user || {
    id: 'dev-officer-id',
    name: '数字官',
    workId: 'DO-001',
    roles: [{ id: 'r1', name: 'admin' }],
  };

  const { config, workers, scheduleResult } = await getShiftData();

  return (
    <ShiftClient
      currentUser={currentUser as any}
      initialConfig={config}
      initialWorkers={workers}
      initialScheduleResult={scheduleResult}
    />
  );
}
