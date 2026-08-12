import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTag } from "@/services/tag/createTag";
import { useToast } from "@/hooks/use-toast";
import { Tag } from "@/types/tag";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

// Predefined modern colors for tags
const TAG_COLORS = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#eab308", // Yellow
  "#84cc16", // Lime
  "#22c55e", // Green
  "#10b981", // Emerald
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#0ea5e9", // Sky
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#a855f7", // Purple
  "#d946ef", // Fuchsia
  "#ec4899", // Pink
  "#f43f5e", // Rose
];

export interface CreateTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  initialName?: string;
  onSuccess?: (tag: Tag) => void;
}

export const CreateTagDialog: React.FC<CreateTagDialogProps> = ({
  open,
  onOpenChange,
  workspaceId,
  initialName = "",
  onSuccess,
}) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(TAG_COLORS[10]); // Default to blue

  // Reset form when opened with new initialName
  useEffect(() => {
    if (open) {
      setName(initialName);
      // Randomize initial color selection to keep tags varied
      if (!initialName) {
         setColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]);
      }
    }
  }, [open, initialName]);

  const createTagMutation = useMutation({
    mutationFn: async () => {
      return createTag({
        name: name.trim(),
        color,
        workspaceId,
      });
    },
    onSuccess: (newTag) => {
      // Invalidate queries so lists update
      queryClient.invalidateQueries({ queryKey: ["tags", workspaceId] });
      toast({
        title: t("common.success"),
        description: `${t("tags.createdDescription")} ${newTag.name}`,
      });
      onSuccess?.(newTag);
      onOpenChange(false);
      setName("");
    },
    onError: () => {
      toast({
        title: t("tags.createError"),
        description: t("tags.createErrorDescription"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createTagMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("tags.createDialogTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="tag-name">{t("tags.nameLabel")}</Label>
            <Input
              id="tag-name"
              placeholder={t("tags.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label>{t("tags.colorLabel")}</Label>
            <div className="flex flex-wrap gap-2 pt-2">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                >
                  {color === c && <Check className="w-4 h-4 text-white" />}
                  <span className="sr-only">{t("tags.selectColor")} {c}</span>
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createTagMutation.isPending}
            >
              {t("tags.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || createTagMutation.isPending}
            >
              {createTagMutation.isPending
                ? t("tags.creating")
                : t("tags.createButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
