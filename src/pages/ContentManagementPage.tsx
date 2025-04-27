import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import ContentForm from "@/components/content/ContentForm";
import ContentTable from "@/components/content/ContentTable";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Content } from "@/types/content";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { listContent } from "@/services/content/listContent";

const ContentManagementPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const { toast } = useToast();

  const { isLoading, data, error } = useQuery({
    queryKey: ["listContent"],
    queryFn: listContent,
  });

  useEffect(() => {
    if (data) {
      setContents(data.contents);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading content",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const updateContentList = (newContent: Content) => {
    const existingContentIndex = contents.findIndex(
      (content) => content.id === newContent.id
    );

    if (existingContentIndex !== -1) {
      const updatedContents = [...contents];
      updatedContents[existingContentIndex] = newContent;
      setContents(updatedContents);
    } else {
      setContents((prev) => [...prev, newContent]);
    }
  };

  const handleEditComplete = (newContent: Content) => {
    setIsDialogOpen(false);
    setEditingContentId(null);

    updateContentList(newContent);
  };

  const onDeletedContent = (id: string) => {
    setContents((prev) => prev.filter((content) => content.id !== id));
    setEditingContentId(null);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Content Management
            </h1>
            <p className="text-muted-foreground">
              Manage knowledge content for your AI agents
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Content
          </Button>
        </div>

        <ContentTable
          onEdit={(id) => {
            setEditingContentId(id);
            setIsDialogOpen(true);
          }}
          contents={contents}
          onDeleted={onDeletedContent}
          isLoading={isLoading}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingContentId ? "Edit Content" : "Add New Content"}
              </DialogTitle>
            </DialogHeader>
            <ContentForm
              contentId={editingContentId}
              onComplete={handleEditComplete}
            />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default ContentManagementPage;
