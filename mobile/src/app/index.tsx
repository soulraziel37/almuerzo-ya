import { Redirect } from 'expo-router';

import { useSession } from '@/store/session';

export default function Index() {
  const role = useSession((s) => s.session?.user.role);
  if (!role) return <Redirect href="/login" />;
  return <Redirect href={role === 'student' ? '/menu' : '/escanear'} />;
}
