import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { listUsers } from "@/services/user/listUsers";
import { Users, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User } from "@/types/user";
import {
  listCompanyAdmins,
  UserRole,
} from "@/services/company/listCompanyAdmins";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/auth/hooks";

// Extended User type to include role info for display
interface ExtendedUser extends User {
  isCompanyAdmin?: boolean;
}

interface UserFilterProps {
  workspaceId: string;
  selectedUserId?: string;
  onSelectUser: (userId: string | undefined) => void;
}

// Roles that can see company admins in the list
const ROLES_WITH_COMPANY_ADMIN_ACCESS = [
  UserRole.PLATFORM_ADMIN,
  UserRole.COMPANY_OWNER,
  UserRole.COMPANY_ADMIN,
];

const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const UserAvatar: React.FC<{
  user: ExtendedUser;
  isSelected: boolean;
  isCurrentUser: boolean;
  onClick: () => void;
}> = ({ user, isSelected, isCurrentUser, onClick }) => {
  const title = [
    user.name,
    user.isCompanyAdmin && "(Admin da Empresa)",
    isCurrentUser && "(você)",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative group transition-all rounded-full",
        isSelected && "ring-2 ring-primary"
      )}
      title={title}
    >
      <Avatar className="h-8 w-8 border-2 border-background cursor-pointer">
        <AvatarFallback
          className={cn(
            "text-xs font-medium transition-colors",
            isSelected
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground hover:bg-muted/80"
          )}
        >
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      {user.isCompanyAdmin && (
        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-primary rounded-full flex items-center justify-center">
          <Shield className="h-2 w-2 text-primary-foreground" />
        </span>
      )}
    </button>
  );
};

export const UserFilter: React.FC<UserFilterProps> = ({
  workspaceId,
  selectedUserId,
  onSelectUser,
}) => {
  const [showAllUsers, setShowAllUsers] = useState(false);
  const maxVisibleUsers = 6;
  const { role } = usePermissions();
  const { userProfile } = useAuth();

  const companyId = userProfile?.companyId;

  // Check if current user can see company admins
  const canSeeCompanyAdmins =
    role && ROLES_WITH_COMPANY_ADMIN_ACCESS.includes(role as UserRole);

  // Fetch workspace users
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
  } = useQuery({
    queryKey: ["users", workspaceId],
    queryFn: () => listUsers({ workspaceId, limit: 100 }),
    enabled: !!workspaceId,
  });

  // Fetch company admins (only for authorized roles)
  const { data: adminsData, isLoading: isLoadingAdmins } = useQuery({
    queryKey: ["companyAdminsFilter", companyId],
    queryFn: () =>
      listCompanyAdmins({
        companyId: companyId!,
        page: 1,
        limit: 100,
      }),
    enabled: canSeeCompanyAdmins && !!companyId,
  });

  const isLoading = isLoadingUsers || (canSeeCompanyAdmins && isLoadingAdmins);
  const isError = isErrorUsers;

  // Merge and deduplicate users, with company admins first
  const users = useMemo(() => {
    const workspaceUsers: ExtendedUser[] = (usersData?.items || []).map(
      (u) => ({
        ...u,
        isCompanyAdmin: false,
      })
    );

    if (!canSeeCompanyAdmins || !adminsData?.items) {
      return workspaceUsers;
    }

    const companyAdmins: ExtendedUser[] = adminsData.items.map((admin) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isCompanyAdmin: true,
    }));

    // Deduplicate: remove workspace users that are also company admins
    const adminIds = new Set(companyAdmins.map((a) => a.id));
    const filteredWorkspaceUsers = workspaceUsers.filter(
      (u) => !adminIds.has(u.id)
    );

    // Company admins first, then workspace users
    return [...companyAdmins, ...filteredWorkspaceUsers];
  }, [usersData, adminsData, canSeeCompanyAdmins]);

  const visibleUsers = users.slice(0, maxVisibleUsers);
  const remainingUsers = users.slice(maxVisibleUsers);
  const hasMoreUsers = remainingUsers.length > 0;

  const handleUserClick = (userId: string | undefined) => {
    if (selectedUserId === userId) {
      onSelectUser(undefined);
    } else {
      onSelectUser(userId);
    }
    setShowAllUsers(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-1">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  // Se houve erro ou não há usuários, não mostra o filtro
  if (isError || users.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {/* "Não atribuído" option */}
        <button
          onClick={() => handleUserClick(undefined)}
          className={cn(
            "relative group transition-all rounded-full",
            !selectedUserId && "ring-2 ring-primary"
          )}
          title="Todos os usuários"
        >
          <Avatar className="h-8 w-8 border-2 border-background cursor-pointer">
            <AvatarFallback
              className={cn(
                "text-xs font-medium transition-colors",
                !selectedUserId
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Users className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </button>

        {/* Visible users */}
        {visibleUsers.map((user) => (
          <UserAvatar
            key={user.id}
            user={user}
            isSelected={selectedUserId === user.id}
            isCurrentUser={user.id === userProfile?.id}
            onClick={() => handleUserClick(user.id)}
          />
        ))}

        {/* "+N" button to show more users */}
        {hasMoreUsers && (
          <button
            onClick={() => setShowAllUsers(true)}
            className="relative group transition-all hover:scale-105 rounded-full"
            title={`Mostrar mais ${remainingUsers.length} usuários`}
          >
            <Avatar className="h-8 w-8 border-2 border-background cursor-pointer">
              <AvatarFallback className="text-xs font-semibold bg-muted text-foreground hover:bg-muted/80 transition-colors">
                +{remainingUsers.length}
              </AvatarFallback>
            </Avatar>
          </button>
        )}
      </div>

      {/* Modal to show all users */}
      <Dialog open={showAllUsers} onOpenChange={setShowAllUsers}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filtrar por usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {/* "Não atribuído" option */}
            <button
              onClick={() => handleUserClick(undefined)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border transition-all hover:bg-accent",
                !selectedUserId
                  ? "bg-primary/10 border-primary"
                  : "bg-background border-border"
              )}
            >
              <Avatar className="h-9 w-9 border border-border/50">
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <Users className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">Todos os usuários</div>
              </div>
              {!selectedUserId && (
                <div className="h-2 w-2 rounded-full bg-primary" />
              )}
            </button>

            {/* All users */}
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserClick(user.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border transition-all hover:bg-accent",
                  selectedUserId === user.id
                    ? "bg-primary/10 border-primary"
                    : "bg-background border-border"
                )}
              >
                <div className="relative">
                  <Avatar className="h-9 w-9 border border-border/50">
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  {user.isCompanyAdmin && (
                    <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-primary rounded-full flex items-center justify-center">
                      <Shield className="h-2 w-2 text-primary-foreground" />
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm">{user.name}</span>
                    {user.id === userProfile?.id && (
                      <span className="text-xs text-primary font-medium">
                        (você)
                      </span>
                    )}
                    {user.isCompanyAdmin && (
                      <span className="text-xs text-muted-foreground">
                        (Admin)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user.email}
                  </div>
                </div>
                {selectedUserId === user.id && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
