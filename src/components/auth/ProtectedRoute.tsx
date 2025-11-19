import { Permission } from "@/types/auth";
import { usePermissions } from "@/hooks/usePermissions";

interface ProtectedRouteProps {
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAll?: boolean;
  component: React.ComponentType;
  fallback?: React.ComponentType;
}

function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
        <p className="text-gray-600 mb-4">
          Você não tem permissão para acessar este recurso.
        </p>
        <p className="text-sm text-gray-500">
          Entre em contato com seu administrador se achar que isso é um erro.
        </p>
      </div>
    </div>
  );
}

export function ProtectedRoute({
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  component: Component,
  fallback: Fallback = AccessDenied,
}: ProtectedRouteProps) {
  const { has, hasAny, hasAll } = usePermissions();

  let hasAccess = true;

  if (requiredPermission) {
    hasAccess = has(requiredPermission);
  } else if (requiredPermissions) {
    hasAccess = requireAll
      ? hasAll(requiredPermissions)
      : hasAny(requiredPermissions);
  }

  return hasAccess ? <Component /> : <Fallback />;
}
