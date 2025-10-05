import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Edit2, Plus, Save, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DealListItem, DealNote, DealDetails } from "@/types/deal";
import { updateDeal } from "@/services/deal/updateDeal";
import { getDealNotes } from "@/services/deal/getDealNotes";
import { createDealNote } from "@/services/deal/createDealNote";
import { updateDealNote } from "@/services/deal/updateDealNote";
import { deleteDealNote } from "@/services/deal/deleteDealNote";
import { getDealById } from "@/services/deal/getDealById";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DealDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: DealListItem | null;
  workspaceId: string;
  onUpdated?: () => void;
}

export const DealDetailsModal: React.FC<DealDetailsModalProps> = ({
  open,
  onOpenChange,
  deal,
  workspaceId,
  onUpdated,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState("BRL");
  const [customerName, setCustomerName] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState<Date | undefined>(
    undefined
  );

  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");

  const { data: dealDetails, isLoading: dealDetailsLoading } = useQuery({
    queryKey: ["getDealById", deal?.id],
    queryFn: () => getDealById(deal!.id),
    enabled: open && !!deal?.id,
  });

  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["getDealNotes", deal?.id],
    queryFn: () => getDealNotes(deal!.id, { limit: 50, offset: 0 }),
    enabled: open && !!deal?.id,
  });

  useEffect(() => {
    if (dealDetails) {
      setTitle(dealDetails.title || "");
      setDescription(dealDetails.description || "");
      setValue(dealDetails.value?.toString() || "");
      setCurrency(dealDetails.currency || "BRL");
      setCustomerName(dealDetails.customer?.name || "");
      setExpectedCloseDate(
        dealDetails.expectedCloseDate
          ? new Date(dealDetails.expectedCloseDate)
          : undefined
      );
    }
  }, [dealDetails]);

  const updateDealMutation = useMutation({
    mutationFn: async () => {
      if (!deal) return;
      await updateDeal(deal.id, workspaceId, {
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        value: value ? Number(value) : undefined,
        currency: currency || undefined,
        expectedCloseDate: expectedCloseDate?.toISOString(),
        customer: customerName.trim()
          ? { name: customerName.trim() }
          : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getDealById", deal?.id] });
      toast({ title: "Sucesso", description: "Negócio atualizado." });
      onUpdated?.();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar negócio.",
        variant: "destructive",
      });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async () => {
      if (!deal || !newNoteContent.trim()) return;
      await createDealNote({
        dealId: deal.id,
        content: newNoteContent.trim(),
      });
    },
    onSuccess: () => {
      setNewNoteContent("");
      queryClient.invalidateQueries({ queryKey: ["getDealNotes", deal?.id] });
      toast({ title: "Sucesso", description: "Nota adicionada." });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao adicionar nota.",
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      if (!editingNoteContent.trim()) return;
      await updateDealNote(noteId, { content: editingNoteContent.trim() });
    },
    onSuccess: () => {
      setEditingNoteId(null);
      setEditingNoteContent("");
      queryClient.invalidateQueries({ queryKey: ["getDealNotes", deal?.id] });
      toast({ title: "Sucesso", description: "Nota atualizada." });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar nota.",
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await deleteDealNote(noteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getDealNotes", deal?.id] });
      toast({ title: "Sucesso", description: "Nota removida." });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao remover nota.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateDealMutation.mutate();
  };

  const handleAddNote = () => {
    createNoteMutation.mutate();
  };

  const handleEditNote = (note: DealNote) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
  };

  const handleSaveEditNote = () => {
    if (editingNoteId) {
      updateNoteMutation.mutate(editingNoteId);
    }
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditingNoteContent("");
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm("Tem certeza que deseja remover esta nota?")) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  if (!deal) return null;

  const isLoading = dealDetailsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar "{dealDetails?.title || deal.title}"</DialogTitle>
          <DialogDescription>
            Adicionar e editar negócio detalhes, atividades, notas e
            compromisso.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Detalhes do negócio</TabsTrigger>
            <TabsTrigger value="notes">Observações</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 py-4">
            <ScrollArea className="h-[400px] pr-4">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                  <div className="border-t pt-4 mt-4">
                    <Skeleton className="h-6 w-56 mb-3" />
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-36" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-44" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 px-1">
                  <div className="space-y-2">
                    <Label>Nome do contato principal *</Label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nome do cliente"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>E-mail principal</Label>
                      <Input placeholder="Inserir e-mail" disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone principal</Label>
                      <Input
                        value={dealDetails?.customer.phone || ""}
                        disabled
                        placeholder="Telefone"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4 px-1">
                    <h3 className="font-semibold mb-3">Detalhes do negócio</h3>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Nome do negócio *</Label>
                        <Input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Nome do negócio"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Pipeline</Label>
                          <Input disabled value="Pipeline atual" />
                        </div>
                        <div className="space-y-2">
                          <Label>Fase</Label>
                          <Input
                            disabled
                            value={
                              dealDetails?.currentStage?.name || "Fase atual"
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Valor do negócio</Label>
                          <Input
                            type="number"
                            min={0}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder="R$ 0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Moeda</Label>
                          <Input
                            value={currency}
                            onChange={(e) =>
                              setCurrency(e.target.value.toUpperCase())
                            }
                            disabled
                            maxLength={3}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Previsão de Fechamento</Label>
                        <DateTimePicker
                          date={expectedCloseDate}
                          setDate={setExpectedCloseDate}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Descrição do negócio"
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Observações</h3>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Insira uma descrição..."
                  rows={3}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddNote}
                  disabled={
                    !newNoteContent.trim() || createNoteMutation.isPending
                  }
                  size="sm"
                  className="self-end"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-3">
                  {notesLoading && (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      Carregando notas...
                    </div>
                  )}

                  {!notesLoading && notes.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-8 border rounded-md bg-muted/20">
                      Nenhuma observação ainda. Adicione a primeira!
                    </div>
                  )}

                  {notes.map((note) => (
                    <Card key={note.id} className="p-4">
                      {editingNoteId === note.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={editingNoteContent}
                            onChange={(e) =>
                              setEditingNoteContent(e.target.value)
                            }
                            rows={3}
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEditNote}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveEditNote}
                              disabled={
                                !editingNoteContent.trim() ||
                                updateNoteMutation.isPending
                              }
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Salvar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-xs text-muted-foreground">
                              {note.user?.name || "Usuário"} •{" "}
                              {formatDistanceToNow(new Date(note.createdAt), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditNote(note)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteNote(note.id)}
                                disabled={deleteNoteMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">
                            {note.content}
                          </p>
                        </>
                      )}
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateDealMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateDealMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {updateDealMutation.isPending ? "Salvando..." : "Atualizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DealDetailsModal;
