import React, { useState, useMemo, useEffect } from "react";
import {
  Check,
  ChevronsUpDown,
  User as UserIcon,
  Loader2,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "@/types/user";
import { useQuery } from "@tanstack/react-query";
import { listUsers } from "@/services/user/listUsers";
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

interface UserSelectorProps {
  workspaceId: string;
  selectedUserId?: string | null;
  selectedUserName?: string | null;
  onUserSelect: (userId: string | null) => void;
  disabled?: boolean;
}

// Roles that can see company admins in the list
const ROLES_WITH_COMPANY_ADMIN_ACCESS = [
  UserRole.PLATFORM_ADMIN,
  UserRole.COMPANY_OWNER,
  UserRole.COMPANY_ADMIN,
];

export function UserSelector({
  workspaceId,
  selectedUserId,
  selectedUserName,
  onUserSelect,
  disabled = false,
}: UserSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { role } = usePermissions();
  const { userProfile } = useAuth();

  // Debounce search to avoid firing a request on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchValue), 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  const companyId = userProfile?.companyId;

  // Check if current user can see company admins
  const canSeeCompanyAdmins =
    role && ROLES_WITH_COMPANY_ADMIN_ACCESS.includes(role as UserRole);

  // Fetch workspace users with search
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isFetching: isFetchingUsers,
  } = useQuery({
    queryKey: ["listUsers", workspaceId, debouncedSearch],
    queryFn: () =>
      listUsers({
        workspaceId,
        search: debouncedSearch || undefined,
        limit: 50,
        page: 1,
      }),
    enabled: open,
    placeholderData: (prev) => prev,
  });

  // Fetch company admins (only for authorized roles)
  const {
    data: adminsData,
    isLoading: isLoadingAdmins,
    isFetching: isFetchingAdmins,
  } = useQuery({
    queryKey: ["companyAdmins", companyId, debouncedSearch],
    queryFn: () =>
      listCompanyAdmins({
        companyId: companyId!,
        page: 1,
        limit: 50,
      }),
    enabled: open && canSeeCompanyAdmins && !!companyId,
    placeholderData: (prev) => prev,
  });

  // isLoading = sem dados ainda; isFetching = refetch em background (já tem dados)
  const isLoading = isLoadingUsers || (canSeeCompanyAdmins && isLoadingAdmins);
  const isFetching =
    !isLoading &&
    (isFetchingUsers || (canSeeCompanyAdmins ? isFetchingAdmins : false));

  // Merge and deduplicate users, with company admins first
  const users = useMemo(() => {
    const workspaceUsers: ExtendedUser[] = (usersData?.items || []).map(
      (u) => ({
        ...u,
        isCompanyAdmin: false,
      }),
    );

    if (!canSeeCompanyAdmins || !adminsData?.items) {
      return workspaceUsers;
    }

    // Filter company admins by search if needed
    const companyAdmins: ExtendedUser[] = adminsData.items
      .filter((admin) => {
        if (!debouncedSearch) return true;
        const searchLower = debouncedSearch.toLowerCase();
        return (
          admin.name.toLowerCase().includes(searchLower) ||
          admin.email.toLowerCase().includes(searchLower)
        );
      })
      .map((admin) => ({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isCompanyAdmin: true,
      }));

    // Deduplicate: remove workspace users that are also company admins
    const adminIds = new Set(companyAdmins.map((a) => a.id));
    const filteredWorkspaceUsers = workspaceUsers.filter(
      (u) => !adminIds.has(u.id),
    );

    // Company admins first, then workspace users
    return [...companyAdmins, ...filteredWorkspaceUsers];
  }, [usersData, adminsData, canSeeCompanyAdmins, debouncedSearch]);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal",
            !selectedUserId && "text-muted-foreground",
          )}
          disabled={disabled}
        >
          {selectedUserId && (selectedUser || selectedUserName) ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-xs">
                  {getInitials(selectedUser?.name || selectedUserName || "")}
                </AvatarFallback>
              </Avatar>
              <span>{selectedUser?.name || selectedUserName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span>Selecionar usuário...</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar usuário..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          {/* wrapper externo só para o overlay de loading; scroll fica no CommandList */}
          <CommandList className="max-h-64">
            {/* Loading inicial — sem dados ainda */}
            {isLoading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}

            {!isLoading && users.length === 0 && (
              <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
            )}

            {users.length > 0 && (
              /* position relative aqui para o overlay absolute funcionar */
              <div className="relative">
                {/* Overlay de refetch — mantém tamanho e itens visíveis */}
                {isFetching && (
                  <div className="absolute inset-0 z-10 flex items-start justify-center pt-6 bg-white/70 dark:bg-background/70 pointer-events-none">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
                <CommandGroup>
                  {/* Option to clear selection */}
                  {selectedUserId && (
                    <CommandItem
                      value="__clear__"
                      onSelect={() => {
                        onUserSelect(null);
                        setOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2 w-full text-muted-foreground">
                        <UserIcon className="h-4 w-4" />
                        <span className="italic">Remover atribuição</span>
                      </div>
                    </CommandItem>
                  )}
                  {users.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.id}
                      onSelect={() => {
                        onUserSelect(
                          user.id === selectedUserId ? null : user.id,
                        );
                        setOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedUserId === user.id
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium">{user.name}</p>
                            {user.isCompanyAdmin && (
                              <span title="Admin da Empresa">
                                <Shield className="h-3 w-3 text-primary" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
