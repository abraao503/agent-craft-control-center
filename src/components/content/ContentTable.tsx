import { useState } from "react";
import { format } from "date-fns";
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
import { Button } from "@/components/ui/button";
import { FilePen, Loader, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Content } from "@/types/content";
import { deleteContent } from "@/services/content/deleteContent";
import RowTableSkeleton from "./RowTableSkeleton";
import { useMutation } from "@tanstack/react-query";

interface ContentTableProps {
  onEdit: (id: string) => void;
  contents: Content[];
  onDeleted: (id: string) => void;
  isLoading: boolean;
}

const ContentTable = ({
  onEdit,
  contents,
  onDeleted,
  isLoading,
}: ContentTableProps) => {
  const [deletingContent, setDeletingContent] = useState<Content | null>(null);
  const { toast } = useToast();

  const { mutateAsync: deleteContentMutation, isPending: isDeleting } =
    useMutation({
      mutationFn: deleteContent,
      onSuccess: () => {
        toast({
          title: "Content deleted",
          description: `${deletingContent?.name} has been deleted successfully`,
        });
        onDeleted(deletingContent?.id || "");
        setDeletingContent(null);
      },
      onError: (error) => {
        console.error("Error deleting content:", error);
        toast({
          title: "Error deleting content",
          description: `Failed to delete ${deletingContent?.name}`,
          variant: "destructive",
        });
      },
    });

  const handleDelete = async () => {
    if (!deletingContent) return;

    await deleteContentMutation(deletingContent.id);
  };

  if (contents.length === 0 && !isLoading) {
    return (
      <div className="text-center py-6 bg-muted/10 rounded-lg">
        <p className="text-muted-foreground">No content available</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date Added</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <RowTableSkeleton />
          ) : (
            contents.map((content) => (
              <TableRow key={content.id}>
                <TableCell>{content.name}</TableCell>
                <TableCell className="uppercase">{content.type}</TableCell>
                <TableCell>
                  {format(content.createdAt, "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(content.id)}
                    >
                      <FilePen className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeletingContent(content)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AlertDialog open={!!deletingContent}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete
              {deletingContent && ` "${deletingContent.name}" `}
              and remove it from any agents using it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingContent(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ContentTable;
