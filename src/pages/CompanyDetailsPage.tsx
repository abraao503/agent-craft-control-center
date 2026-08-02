import { useParams } from "react-router-dom";
import { AdminCompanyManagement } from "@/components/admin/AdminCompanyManagement";

export default function CompanyDetailsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  return companyId ? (
    <AdminCompanyManagement
      companyId={companyId}
      administrationPath="/admin/companies"
    />
  ) : null;
}
