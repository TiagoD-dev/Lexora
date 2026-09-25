import { PortalManagement } from '@/components/portal-management';
import { useAuth } from '@/providers/auth-provider';

export default function ClientPortalPage() {
  const { user } = useAuth();
  return user ? <PortalManagement key={user.id} /> : null;
}
