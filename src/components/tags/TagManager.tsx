import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

import { Tag } from "@/types/tag";
import { listTags } from "@/services/tag/listTags";
import { createTag } from "@/services/tag/createTag";
import { updateTag } from "@/services/tag/updateTag";
import { deleteTag } from "@/services/tag/deleteTag";
import { isColorDark } from "@/lib/utils";

type TagManagerProps = {
  workspaceId: string;
};

export const TagManager: React.FC<TagManagerProps> = ({ workspaceId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState("#000000");
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["tags", workspaceId],
    queryFn: () => listTags(workspaceId),
    enabled: !!workspaceId,
  });

  const createTagMutation = useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", workspaceId] });
      toast({
        title: "Tag criada",
        description: "A tag foi criada com sucesso.",
      });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro ao criar tag",
        description: "Não foi possível criar a tag. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ id, params }: { id: string; params: { name: string; color: string; workspaceId: string } }) =>
      updateTag(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", workspaceId] });
      toast({
        title: "Tag atualizada",
        description: "A tag foi atualizada com sucesso.",
      });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar tag",
        description: "Não foi possível atualizar a tag. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => deleteTag(id, workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", workspaceId] });
      toast({
        title: "Tag excluída",
        description: "A tag foi excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir tag",
        description: "Não foi possível excluir a tag. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (editingTag) {
      setTagName(editingTag.name);
      setTagColor(editingTag.color);
    } else {
      setTagName("");
      setTagColor("#000000");
    }
  }, [editingTag]);

  const resetForm = () => {
    setIsDialogOpen(false);
    setEditingTag(null);
    setTagName("");
    setTagColor("#000000");
  };

  const handleOpenDialog = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tagName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome da tag é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (editingTag) {
      updateTagMutation.mutate({
        id: editingTag.id,
        params: {
          name: tagName,
          color: tagColor,
          workspaceId,
        },
      });
    } else {
      createTagMutation.mutate({
        name: tagName,
        color: tagColor,
        workspaceId,
      });
    }
  };

  const handleDeleteTag = (tag: Tag) => {
    setDeletingTag(tag);
  };

  const confirmDelete = () => {
    if (deletingTag) {
      deleteTagMutation.mutate(deletingTag.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Gerenciamento de Tags</h3>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="h-4 w-4 mr-2" /> Nova Tag
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-4">Carregando tags...</div>
      ) : tags.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          Nenhuma tag encontrada. Crie uma nova tag para começar.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell>
                  <Badge style={{ 
                    backgroundColor: tag.color,
                    color: isColorDark(tag.color) ? "white" : "black"
                  }}>
                    {tag.name}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.color}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(tag)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTag(tag)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTag ? "Editar Tag" : "Nova Tag"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right">
                  Nome
                </label>
                <Input
                  id="name"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="color" className="text-right">
                  Cor
                </label>
                <div className="col-span-3 flex items-center gap-2">
                  <input
                    type="color"
                    id="color"
                    value={tagColor}
                    onChange={(e) => setTagColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={tagColor}
                    onChange={(e) => setTagColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={createTagMutation.isPending || updateTagMutation.isPending}
              >
                {editingTag ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingTag} onOpenChange={(open) => !open && setDeletingTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente
              {deletingTag && ` "${deletingTag.name}" `}
              e a removerá de todos os agentes que a utilizam.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingTag(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteTagMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
