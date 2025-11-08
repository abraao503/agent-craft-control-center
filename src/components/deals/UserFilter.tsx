import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { listUsers } from "@/services/user/listUsers";
import { Loader2, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User } from "@/types/user";

interface UserFilterProps {
  workspaceId: string;
  selectedUserId?: string;
  onSelectUser: (userId: string | undefined) => void;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const UserAvatar: React.FC<{
  user: User;
  isSelected: boolean;
  onClick: () => void;
}> = ({ user, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative group transition-all rounded-full",
        isSelected && "ring-2 ring-primary"
      )}
      title={user.name}
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

  const { data, isLoading } = useQuery({
    queryKey: ["users", workspaceId],
    queryFn: () => listUsers({ workspaceId, limit: 100 }),
    enabled: !!workspaceId,
  });

  const users = data?.users || [];
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
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Carregando usuários...
        </span>
      </div>
    );
  }

  if (users.length === 0) {
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
                <Avatar className="h-9 w-9 border border-border/50">
                  <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{user.name}</div>
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
