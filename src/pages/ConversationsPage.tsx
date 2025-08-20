import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Loader2,
  Search,
  Tag as TagIcon,
  Calendar as CalendarIcon,
  UserCog,
  Bot,
  X,
  Check,
  Plus,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { updateConversationHandler } from "@/services/conversation/updateConversationHandler";
import { Conversation, ConversationsFilters } from "@/types/conversation";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { listAgent } from "@/services/agent/listAgent";
import { TagManager } from "@/components/tags/TagManager";
import { listTags } from "@/services/tag/listTags";
import { linkTagToChat } from "@/services/tag/linkTagToChat";
import { isColorDark } from "@/lib/utils";
import { Tag, TagLinkRequest } from "@/types/tag";
import { MultiSelect } from "@/components/ui/multi-select";
import { updateMultipleConversations } from "@/services/conversation/updateMultipleConversations";

// Function to calculate page numbers for pagination
const getPageNumbers = (currentPage: number, totalPages: number) => {
  // Maximum number of page links to show
  const maxPageLinks = 5;

  if (totalPages <= maxPageLinks) {
    // If we have 5 or fewer pages, show all of them
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  } else if (currentPage <= 3) {
    // If we're on pages 1-3, show pages 1-5
    return Array.from({ length: maxPageLinks }, (_, i) => i + 1);
  } else if (currentPage >= totalPages - 2) {
    // If we're on the last 3 pages, show the last 5 pages
    return Array.from(
      { length: maxPageLinks },
      (_, i) => totalPages - maxPageLinks + i + 1
    );
  } else {
    // Otherwise show current page with 2 pages before and after
    return Array.from({ length: maxPageLinks }, (_, i) => currentPage - 2 + i);
  }
};

const ConversationsPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversations, setSelectedConversations] = useState<string[]>(
    []
  );
  const [selectAll, setSelectAll] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [removeSelectedTags, setRemoveSelectedTags] = useState<string[]>([]);
  const [selectedHandler, setSelectedHandler] = useState<
    "assistant" | "human" | undefined
  >(undefined);
  const [filters, setFilters] = useState<ConversationsFilters>({
    page: 1,
    limit: 30,
    search: "",
    agentId: undefined,
    tagId: undefined,
    tagIds: [],
    initialDate: null,
    finalDate: null,
    sortBy: "createdAt",
    sortOrder: "desc",
    handledBy: undefined,
  });

  // Tipo para as opções de tag no MultiSelect
  type TagOption = {
    value: string;
    label: string;
    color: string;
  };

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

  // Query client for mutations
  const queryClient = useQueryClient();

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

  // Query to fetch agents
  const { data: agentsData } = useQuery({
    queryKey: ["agents", workspaceId],
    queryFn: () => listAgent(workspaceId),
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
  const handleTagChange = (selected: string[]) => {
    setFilters((prev) => ({
      ...prev,
      tagIds: selected,
      tagId: undefined, // Limpa o filtro antigo de tag única
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

  // Handle handledBy filter change
  const handleHandledByChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      handledBy: value === "all" ? undefined : (value as "assistant" | "human"),
      page: 1,
    }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Handle limit change
  const handleLimitChange = (limit: string) => {
    setFilters((prev) => ({ ...prev, limit: parseInt(limit), page: 1 }));
  };

  // Handle row click to open the modal
  const handleRowClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  // A lógica de seleção de checkbox foi movida diretamente para o componente Checkbox

  // Handle select all checkbox
  const handleSelectAllChange = () => {
    if (selectAll) {
      setSelectedConversations([]);
    } else {
      setSelectedConversations(conversations.map((c) => c.id));
    }
    setSelectAll(!selectAll);
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedConversations([]);
    setSelectAll(false);
  };

  // Handle modal close
  const handleModalClose = () => {
    setSelectedConversation(null);
    refetch(); // Refresh data in case handler was changed
  };

  // Mutation for bulk update (handler and/or tags)
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({
      chatIds,
      tagIds,
      removeTagIds,
      handledBy,
    }: {
      chatIds: string[];
      tagIds?: string[];
      removeTagIds?: string[];
      handledBy?: "assistant" | "human";
    }) => {
      return updateMultipleConversations({
        chatIds,
        tagIds: tagIds && tagIds.length > 0 ? tagIds : undefined,
        removeTagIds:
          removeTagIds && removeTagIds.length > 0 ? removeTagIds : undefined,
        handledBy,
        workspaceId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setSelectedConversations([]);
      setSelectAll(false);
      setSelectedTags([]);
      setRemoveSelectedTags([]);
      setSelectedHandler(undefined);
    },
  });

  // Handle bulk action
  const handleBulkAction = () => {
    if (selectedConversations.length > 0) {
      const hasTagsSelected = selectedTags.length > 0;
      const hasRemoveTagsSelected = removeSelectedTags.length > 0;
      const hasHandlerSelected = selectedHandler !== undefined;

      if (hasTagsSelected || hasRemoveTagsSelected || hasHandlerSelected) {
        bulkUpdateMutation.mutate({
          chatIds: selectedConversations,
          tagIds: hasTagsSelected ? selectedTags : undefined,
          removeTagIds: hasRemoveTagsSelected ? removeSelectedTags : undefined,
          handledBy: selectedHandler,
        });
      }
    }
  };

  useEffect(() => {
    if (data) {
      setConversations(data.items);

      // Reset selections when data changes
      setSelectedConversations([]);
      setSelectAll(false);
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
            <div className="mb-6 space-y-4">
              <div className="w-full">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar conversas..."
                    className="pl-8 w-full"
                    value={filters.search}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {/* Filtros de agentes */}
                <div className="w-full sm:w-auto min-w-[150px] lg:flex-1">
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
                      {agentsData?.agents &&
                        agentsData.agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Select de tags */}
                <div className="w-full sm:w-auto min-w-[150px] lg:flex-1">
                  <MultiSelect
                    options={tags.map((tag) => ({
                      value: tag.id,
                      label: tag.name,
                      color: tag.color,
                    }))}
                    placeholder="Filtrar por tags"
                    selected={filters.tagIds || []}
                    onChange={handleTagChange}
                    renderOption={(option) => (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: option.color }}
                        />
                        {option.label}
                      </div>
                    )}
                    renderSelection={(selected) => (
                      <div className="flex flex-wrap gap-1">
                        {selected.length === 0 ? (
                          <span className="text-muted-foreground">
                            Todas as tags
                          </span>
                        ) : (
                          selected.map((option) => {
                            const tag = tags.find((t) => t.id === option.value);
                            if (!tag) return null;

                            return (
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
                            );
                          })
                        )}
                      </div>
                    )}
                  />
                </div>

                {/* Filtro de atendimento (IA ou Humano) */}
                <div className="w-full sm:w-auto min-w-[150px] lg:flex-1">
                  <Select
                    value={filters.handledBy || "all"}
                    onValueChange={handleHandledByChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de atendimento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os atendimentos</SelectItem>
                      <SelectItem value="assistant">
                        Em atendimento por IA
                      </SelectItem>
                      <SelectItem value="human">
                        Em atendimento por Humano
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Seletores de data e botão de gerenciamento de tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {/* Data inicial */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal min-w-[140px]"
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

                {/* Data final */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal min-w-[140px]"
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

                {/* Botão de gerenciar tags */}
                <Button
                  variant="outline"
                  className="flex items-center gap-2 w-full"
                  onClick={() => setShowTagManager(!showTagManager)}
                >
                  <TagIcon className="h-4 w-4" />
                  {showTagManager ? "Ocultar gerenciador" : "Gerenciar tags"}
                </Button>
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

                {/* Bulk Actions Panel */}
                {selectedConversations.length > 0 && (
                  <div className="bg-muted/30 p-4 rounded-lg flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">
                        {selectedConversations.length} conversa(s)
                        selecionada(s)
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedConversations([]);
                          setSelectAll(false);
                          setSelectedTags([]);
                          setRemoveSelectedTags([]);
                          setSelectedHandler(undefined);
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Limpar seleção
                      </Button>
                    </div>

                    {/* Handler Management Section */}
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="text-sm font-medium">
                        Transferir para:
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={
                            selectedHandler === "assistant"
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            setSelectedHandler(
                              selectedHandler === "assistant"
                                ? undefined
                                : "assistant"
                            )
                          }
                          className="h-8"
                        >
                          <Bot className="h-4 w-4 mr-1" />
                          IA
                        </Button>
                        <Button
                          variant={
                            selectedHandler === "human" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            setSelectedHandler(
                              selectedHandler === "human" ? undefined : "human"
                            )
                          }
                          className="h-8"
                        >
                          <UserCog className="h-4 w-4 mr-1" />
                          Humano
                        </Button>
                      </div>
                    </div>

                    {/* Tag Management Section - Add Tags */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 border-t pt-4 border-muted-foreground/20">
                      <div className="text-sm font-medium">Adicionar tags:</div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <MultiSelect
                          options={tags.map((tag) => ({
                            value: tag.id,
                            label: tag.name,
                            color: tag.color,
                          }))}
                          placeholder="Selecionar tags"
                          selected={selectedTags}
                          onChange={setSelectedTags}
                          renderOption={(option) => (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: option.color }}
                              />
                              {option.label}
                            </div>
                          )}
                          renderSelection={(selected) => (
                            <div className="flex flex-wrap gap-1">
                              {selected.length === 0 ? (
                                <span className="text-muted-foreground">
                                  Selecionar tags
                                </span>
                              ) : (
                                selected.map((option) => {
                                  const tag = tags.find(
                                    (t) => t.id === option.value
                                  );
                                  if (!tag) return null;

                                  return (
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
                                  );
                                })
                              )}
                            </div>
                          )}
                        />
                      </div>
                    </div>

                    {/* Tag Management Section - Remove Tags */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 border-t pt-4 border-muted-foreground/20">
                      <div className="text-sm font-medium">Remover tags:</div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <MultiSelect
                          options={tags.map((tag) => ({
                            value: tag.id,
                            label: tag.name,
                            color: tag.color,
                          }))}
                          placeholder="Selecionar tags"
                          selected={removeSelectedTags}
                          onChange={setRemoveSelectedTags}
                          renderOption={(option) => (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: option.color }}
                              />
                              {option.label}
                            </div>
                          )}
                          renderSelection={(selected) => (
                            <div className="flex flex-wrap gap-1">
                              {selected.length === 0 ? (
                                <span className="text-muted-foreground">
                                  Selecionar tags
                                </span>
                              ) : (
                                selected.map((option) => {
                                  const tag = tags.find(
                                    (t) => t.id === option.value
                                  );
                                  if (!tag) return null;

                                  return (
                                    <Badge
                                      key={tag.id}
                                      variant="outline"
                                      style={{
                                        borderColor: tag.color,
                                        color: tag.color,
                                      }}
                                      className="text-xs"
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      {tag.name}
                                    </Badge>
                                  );
                                })
                              )}
                            </div>
                          )}
                        />
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end mt-2 border-t pt-4 border-muted-foreground/20">
                      <Button
                        onClick={handleBulkAction}
                        disabled={
                          selectedConversations.length === 0 ||
                          (selectedTags.length === 0 &&
                            removeSelectedTags.length === 0 &&
                            selectedHandler === undefined) ||
                          bulkUpdateMutation.isPending
                        }
                        className="w-full sm:w-auto"
                      >
                        {bulkUpdateMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : bulkUpdateMutation.isSuccess ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Concluído
                          </>
                        ) : (
                          <>Aplicar alterações</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectAll}
                            onCheckedChange={handleSelectAllChange}
                            aria-label="Selecionar todas as conversas"
                          />
                        </TableHead>
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
                            onClick={(e) => handleRowClick(conversation)}
                            className={`cursor-pointer hover:bg-muted/50 ${
                              selectedConversations.includes(conversation.id)
                                ? "bg-muted/70"
                                : ""
                            }`}
                          >
                            <TableCell
                              className="w-[50px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={selectedConversations.includes(
                                  conversation.id
                                )}
                                onCheckedChange={() => {
                                  const newSelected =
                                    selectedConversations.includes(
                                      conversation.id
                                    )
                                      ? selectedConversations.filter(
                                          (id) => id !== conversation.id
                                        )
                                      : [
                                          ...selectedConversations,
                                          conversation.id,
                                        ];
                                  setSelectedConversations(newSelected);
                                }}
                                aria-label={`Selecionar conversa ${conversation.id}`}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </TableCell>
                            <TableCell>
                              {conversation.lastInteraction
                                ? format(
                                    new Date(conversation.lastInteraction),
                                    "dd/MM/yyyy HH:mm"
                                  )
                                : "Sem interações"}
                            </TableCell>
                            <TableCell>{conversation.agent.name}</TableCell>
                            <TableCell>
                              {conversation.customer.identifier ? (
                                <div>
                                  <div className="font-medium">
                                    {conversation.customer.identifier}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {conversation.customer.phone}
                                  </div>
                                </div>
                              ) : (
                                conversation.customer.phone
                              )}
                            </TableCell>
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

                {/* Pagination and Results per page */}
                {data.total > 0 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Resultados por página:
                      </span>
                      <Select
                        value={String(filters.limit)}
                        onValueChange={handleLimitChange}
                      >
                        <SelectTrigger className="w-[80px]">
                          <SelectValue placeholder="10" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="200">200</SelectItem>
                          <SelectItem value="500">500</SelectItem>
                          <SelectItem value="750">750</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Pagination>
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

                        {/* Show first page and ellipsis if not already showing */}
                        {data.totalPages > 5 &&
                          !getPageNumbers(
                            filters.page,
                            data.totalPages
                          ).includes(1) && (
                            <>
                              <PaginationItem key={1}>
                                <PaginationLink
                                  onClick={() => handlePageChange(1)}
                                >
                                  1
                                </PaginationLink>
                              </PaginationItem>
                              <PaginationItem>
                                <span className="px-2">...</span>
                              </PaginationItem>
                            </>
                          )}

                        {/* Show current page range */}
                        {getPageNumbers(filters.page, data.totalPages).map(
                          (page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                isActive={page === filters.page}
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        )}

                        {/* Show ellipsis and last page if not already showing */}
                        {data.totalPages > 5 &&
                          !getPageNumbers(
                            filters.page,
                            data.totalPages
                          ).includes(data.totalPages) && (
                            <>
                              <PaginationItem>
                                <span className="px-2">...</span>
                              </PaginationItem>
                              <PaginationItem key={data.totalPages}>
                                <PaginationLink
                                  onClick={() =>
                                    handlePageChange(data.totalPages)
                                  }
                                >
                                  {data.totalPages}
                                </PaginationLink>
                              </PaginationItem>
                            </>
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
                  </div>
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
