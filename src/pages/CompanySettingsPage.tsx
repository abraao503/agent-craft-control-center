import { useAuth } from "@/contexts/auth/hooks";
import { AdminCompanyManagement } from "@/components/admin/AdminCompanyManagement";

export default function CompanySettingsPage() {
  const { user } = useAuth();
  return user?.companyId ? <AdminCompanyManagement companyId={user.companyId} /> : null;
}
