import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown, User as UserIcon, Loader2 } from "lucide-react";
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

interface UserSelectorProps {
  workspaceId: string;
  selectedUserId?: string | null;
  selectedUserName?: string | null;
  onUserSelect: (userId: string | null) => void;
  disabled?: boolean;
}

export function UserSelector({
  workspaceId,
  selectedUserId,
  selectedUserName,
  onUserSelect,
  disabled = false,
}: UserSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Fetch users with search
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["listUsers", workspaceId, searchValue],
    queryFn: () =>
      listUsers({
        workspaceId,
        search: searchValue || undefined,
        limit: 50,
        page: 1,
      }),
    enabled: open, // Only fetch when popover is open
  });

  const users = usersData?.items || [];
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal",
            !selectedUserId && "text-muted-foreground"
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
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
            ) : (
              <CommandGroup className="max-h-64 overflow-auto">
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
                      onUserSelect(user.id === selectedUserId ? null : user.id);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedUserId === user.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
