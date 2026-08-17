import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { SmartPagination } from "@/components/common/SmartPagination";

import { Tag } from "@/types/tag";
import { listTagsPaginated } from "@/services/tag/listTagsPaginated";
import { createTag } from "@/services/tag/createTag";
import { updateTag } from "@/services/tag/updateTag";
import { deleteTag } from "@/services/tag/deleteTag";
import { isColorDark } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type TagManagerProps = {
  workspaceId: string;
};

const TAGS_PER_PAGE = 10;

export const TagManager: React.FC<TagManagerProps> = ({ workspaceId }) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState("#000000");
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["tags", workspaceId, currentPage],
    queryFn: () =>
      listTagsPaginated({
        workspaceId,
        page: currentPage + 1,
        limit: TAGS_PER_PAGE,
      }),
    enabled: !!workspaceId,
  });

  const tags = data?.items ?? [];
  const totalPages = data ? Math.ceil(data.total / TAGS_PER_PAGE) : 0;

  const createTagMutation = useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", workspaceId] });
      toast({
        title: t("tags.created"),
        description: t("tags.createdDescription"),
      });
      resetForm();
    },
    onError: () => {
      toast({
        title: t("tags.createError"),
        description: t("tags.createErrorDescription"),
        variant: "destructive",
      });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({
      id,
      params,
    }: {
      id: string;
      params: { name: string; color: string; workspaceId: string };
    }) => updateTag(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", workspaceId] });
      toast({
        title: t("tags.updated"),
        description: t("tags.updatedDescription"),
      });
      resetForm();
    },
    onError: () => {
      toast({
        title: t("tags.updateError"),
        description: t("tags.updateErrorDescription"),
        variant: "destructive",
      });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => deleteTag(id, workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", workspaceId] });
      toast({
        title: t("tags.deleted"),
        description: t("tags.deletedDescription"),
      });
    },
    onError: () => {
      toast({
        title: t("tags.deleteError"),
        description: t("tags.deleteErrorDescription"),
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
        title: t("tags.nameRequired"),
        description: t("tags.nameRequiredDescription"),
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
        <h3 className="text-lg font-medium">{t("tags.managerTitle")}</h3>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="h-4 w-4 mr-2" /> {t("tags.new")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("tags.name")}</TableHead>
            <TableHead>{t("tags.color")}</TableHead>
            <TableHead className="w-[100px]">{t("tags.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: TAGS_PER_PAGE }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : tags.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center py-8 text-muted-foreground"
              >
                {t("tags.empty")}
              </TableCell>
            </TableRow>
          ) : (
            tags.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell>
                  <Badge
                    style={{
                      backgroundColor: tag.color,
                      color: isColorDark(tag.color) ? "white" : "black",
                    }}
                  >
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
            ))
          )}
        </TableBody>
      </Table>

      {!isLoading && totalPages > 1 && (
        <SmartPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          showItemCount
          itemsPerPage={TAGS_PER_PAGE}
          totalItems={data?.total ?? 0}
          itemLabel={t("tags.tags")}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? t("tags.edit") : t("tags.new")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right">
                  {t("tags.name")}
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
                  {t("tags.color")}
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
              <Button type="button" variant="outline" onClick={resetForm}>
                {t("tags.cancel")}
              </Button>
              <Button
                type="submit"
                isLoading={
                  createTagMutation.isPending || updateTagMutation.isPending
                }
              >
                {editingTag ? t("tags.update") : t("tags.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingTag}
        onOpenChange={(open) => !open && setDeletingTag(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("tags.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("tags.deleteDescription", { name: deletingTag?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingTag(null)}>
              {t("tags.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteTagMutation.isPending ? t("tags.deleting") : t("tags.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
