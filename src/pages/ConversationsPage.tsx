import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Loader2,
  Search,
  Tag as TagIcon,
  Calendar as CalendarIcon,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ConversationModal } from "@/components/conversations/ConversationModal";

import { listConversations } from "@/services/conversation/listConversations";
import { Conversation, ConversationsFilters } from "@/types/conversation";
import { AGENTS } from "@/services/mockData";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { TagManager } from "@/components/tags/TagManager";
import { listTags } from "@/services/tag/listTags";
import { isColorDark } from "@/lib/utils";

const ConversationsPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filters, setFilters] = useState<ConversationsFilters>({
    page: 1,
    limit: 10,
    search: "",
    agentId: undefined,
    tagId: undefined,
    initialDate: null,
    finalDate: null,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [showTagManager, setShowTagManager] = useState(false);

  // Usar o hook de gerenciamento de workspace
  const { workspaceId, isChangingWorkspace } = useWorkspaceManager({
    queryKeys: ["conversations"],
    autoRefetch: true,
    trackLoadingState: true,
  });

  // Selected conversation for the modal
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  // Query to fetch conversations
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["conversations", filters, workspaceId],
    queryFn: () => listConversations(filters, workspaceId),
  });

  // Query to fetch tags
  const { data: tags = [] } = useQuery({
    queryKey: ["tags", workspaceId],
    queryFn: () => listTags(workspaceId),
    enabled: !!workspaceId,
  });

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }));
  };

  // Handle agent filter change
  const handleAgentChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      agentId: value === "all_agents" ? undefined : value,
      page: 1,
    }));
  };

  // Handle tag filter change
  const handleTagChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      tagId: value === "all_tags" ? undefined : value,
      page: 1,
    }));
  };

  // Handle start date change
  const handleStartDateChange = (date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, initialDate: date || null, page: 1 }));
  };

  // Handle end date change
  const handleEndDateChange = (date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, finalDate: date || null, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Handle row click to open the modal
  const handleRowClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  // Handle modal close
  const handleModalClose = () => {
    setSelectedConversation(null);
    refetch(); // Refresh data in case handler was changed
  };

  useEffect(() => {
    if (data) {
      setConversations(data.items);
    }
  }, [data]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm");
  };

  const updateConversation = (conversation: Conversation) => {
    setConversations((prev) => {
      const updatedConversations = [...prev];

      const index = updatedConversations.findIndex(
        (c) => c.id === conversation.id
      );

      if (index !== -1) {
        updatedConversations[index] = {
          ...updatedConversations[index],
          ...conversation,
        };
      }

      return updatedConversations;
    });
  };

  return (
    <div>
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Conversas</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar conversas..."
                    className="pl-8"
                    value={filters.search}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="w-full md:w-[180px]">
                  <Select
                    value={filters.agentId || "all_agents"}
                    onValueChange={handleAgentChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os agentes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_agents">
                        Todos os agentes
                      </SelectItem>
                      {AGENTS.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:w-[180px]">
                  <Select
                    value={filters.tagId || "all_tags"}
                    onValueChange={handleTagChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as tags" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_tags">Todas as tags</SelectItem>
                      {tags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal md:w-[180px]"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.initialDate ? (
                          format(filters.initialDate, "dd/MM/yyyy")
                        ) : (
                          <span>Data inicial</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.initialDate || undefined}
                        onSelect={handleStartDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal md:w-[180px]"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.finalDate ? (
                          format(filters.finalDate, "dd/MM/yyyy")
                        ) : (
                          <span>Data final</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.finalDate || undefined}
                        onSelect={handleEndDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => setShowTagManager(!showTagManager)}
                  >
                    <TagIcon className="h-4 w-4" />
                    {showTagManager ? "Ocultar gerenciador" : "Gerenciar tags"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Loading state */}
            {(isLoading || isChangingWorkspace) && (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Error state */}
            {isError && (
              <Alert variant="destructive" className="my-4">
                <AlertDescription>
                  Ocorreu um erro ao carregar as conversas. Por favor, tente
                  novamente.
                </AlertDescription>
              </Alert>
            )}

            {/* Table */}
            {!isLoading && !isError && data && (
              <>
                {showTagManager && (
                  <div className="mb-6 p-4 border rounded-md">
                    <TagManager workspaceId={workspaceId} />
                  </div>
                )}

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data e Hora</TableHead>
                        <TableHead>Agente</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Interações</TableHead>
                        <TableHead>Atendimento</TableHead>
                        <TableHead>Tags</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {conversations.length > 0 ? (
                        conversations.map((conversation) => (
                          <TableRow
                            key={conversation.id}
                            onClick={() => handleRowClick(conversation)}
                            className="cursor-pointer hover:bg-muted/50"
                          >
                            <TableCell>
                              {conversation.lastInteraction
                                ? format(
                                    new Date(conversation.lastInteraction),
                                    "dd/MM/yyyy HH:mm"
                                  )
                                : "Sem interações"}
                            </TableCell>
                            <TableCell>{conversation.agent.name}</TableCell>
                            <TableCell>{conversation.customer.phone}</TableCell>
                            <TableCell>{conversation.totalMessages}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  conversation.handledBy === "ai"
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {conversation.handledBy === "ai"
                                  ? "IA"
                                  : "Humano"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {conversation.tags?.map((tag) => (
                                  <Badge
                                    key={tag.id}
                                    style={{
                                      backgroundColor: tag.color,
                                      color: isColorDark(tag.color)
                                        ? "white"
                                        : "black",
                                    }}
                                    className="text-xs"
                                  >
                                    {tag.name}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            Nenhuma conversa encontrada.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {data.total > 0 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            filters.page > 1 &&
                            handlePageChange(filters.page - 1)
                          }
                          className={
                            filters.page <= 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.min(data.totalPages, 5) }).map(
                        (_, i) => {
                          const page =
                            data.totalPages <= 5
                              ? i + 1
                              : filters.page <= 3
                              ? i + 1
                              : filters.page >= data.totalPages - 2
                              ? data.totalPages - 4 + i
                              : filters.page - 2 + i;

                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                isActive={page === filters.page}
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            filters.page < data.totalPages &&
                            handlePageChange(filters.page + 1)
                          }
                          className={
                            filters.page >= data.totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversation Modal */}
      {selectedConversation && (
        <ConversationModal
          conversation={selectedConversation}
          updateConversation={updateConversation}
          onClose={handleModalClose}
          isOpen={!!selectedConversation}
        />
      )}
    </div>
  );
};

export default ConversationsPage;
