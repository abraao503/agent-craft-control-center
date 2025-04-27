import { useState } from "react";
import { AgentFormData, AssistantContent } from "@/types/agent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { X, Upload, FileText } from "lucide-react";
import { CONTENTS, addContent } from "@/services/mockData";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

interface KnowledgeContentProps {
  formData: AgentFormData;
  updateFormData: (data: Partial<AgentFormData>) => void;
  setContentsToUpdate: React.Dispatch<React.SetStateAction<AssistantContent[]>>;
}

type Content = AgentFormData["contents"][0];

const KnowledgeContent = ({
  formData,
  updateFormData,
  setContentsToUpdate,
}: KnowledgeContentProps) => {
  const [newContentName, setNewContentName] = useState("");
  const { toast } = useToast();

  const handleContentSelect = (content: Content) => {
    const contentAlreadySelected = formData.contents.find(
      (c) => c.id === content.id
    );

    if (contentAlreadySelected) {
      removeContent(content);
    } else {
      addContent(content);
    }
  };

  const removeContent = (content: Content) => {
    const updatedContents = formData.contents.filter(
      (content) => content.id !== content.id
    );

    setContentsToUpdate((prev) => {
      const contentIndex = prev.findIndex((c) => c.contentId === content.id);

      if (contentIndex !== -1) {
        prev[contentIndex] = {
          action: "delete",
          contentId: content.id,
        };

        return prev;
      } else {
        return [...prev, { contentId: content.id, action: "delete" }];
      }
    });

    updateFormData({ contents: updatedContents });
  };

  const addContent = (content: Content) => {
    const updatedContents = [...formData.contents, content];

    setContentsToUpdate((prev) => {
      const contentIndex = prev.findIndex((c) => c.contentId === content.id);

      if (contentIndex !== -1) {
        prev[contentIndex] = {
          action: "create",
          contentId: content.id,
        };

        return prev;
      } else {
        return [...prev, { contentId: content.id, action: "create" }];
      }
    });

    updateFormData({ contents: updatedContents });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "txt";
    if (fileType !== "pdf" && fileType !== "txt") {
      toast({
        title: "Invalid file type",
        description: "Only PDF and TXT files are supported.",
        variant: "destructive",
      });
      return;
    }

    if (!newContentName.trim()) {
      toast({
        title: "Content name required",
        description: "Please provide a name for the content before uploading.",
        variant: "destructive",
      });
      return;
    }

    // Mock file upload - in real app this would upload to storage
    //const newContent = addContent(
    //newContentName.trim(),
    //`file-${file.name}`,
    //fileType
    //);

    // Add the new content ID to the agent's contents
    //const updatedContents = [...formData.contentsIds, newContent.id];
    //updateFormData({ contents: updatedContents });

    // Reset form
    setNewContentName("");
    e.target.value = "";

    toast({
      title: "Content uploaded successfully",
      description: ` has been added to your knowledge base.`,
    });
  };

  return (
    <div className="form-container">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Knowledge Content</h3>
        <p className="text-sm text-muted-foreground">
          Select existing content or upload new files for your agent to use as
          knowledge sources.
        </p>
      </div>

      <div className="space-y-6">
        <Card className="p-4">
          <Label className="block mb-4">Upload New Content</Label>
          <div className="space-y-4">
            <Input
              placeholder="Content name"
              value={newContentName}
              onChange={(e) => setNewContentName(e.target.value)}
            />
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-muted-foreground">
                Upload PDF or TXT files (max 10MB)
              </p>
              <Input
                id="upload"
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("upload")?.click()}
                className="mt-4"
              >
                Select File
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <Label className="block mb-4">Available Content</Label>
          <div className="space-y-2">
            {CONTENTS.map((content) => (
              <div
                key={content.id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer"
                onClick={() => handleContentSelect(content)}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{content.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {content.type.toUpperCase()} •{" "}
                      {format(content.createdAt, "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    formData.contents
                      .map((content) => content.id)
                      .includes(content.id)
                      ? "default"
                      : "outline"
                  }
                  className="ml-2"
                >
                  {formData.contents
                    .map((content) => content.id)
                    .includes(content.id)
                    ? "Selected"
                    : "Select"}
                </Badge>
              </div>
            ))}
            {CONTENTS.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No content available. Upload your first file above.
              </p>
            )}
          </div>
        </Card>

        <div className="mt-4">
          <Label className="block mb-2">
            Selected Content ({formData.contents.length})
          </Label>
          {formData.contents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
              No content selected yet
            </p>
          ) : (
            <div className="border rounded-md p-4 space-y-2">
              {formData.contents.map((content) => {
                return (
                  <div
                    key={content.id}
                    className="flex justify-between items-center"
                  >
                    <Badge
                      variant="secondary"
                      className="flex-grow mr-2 px-3 py-1 h-auto text-left font-normal"
                    >
                      {content.name}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeContent(content)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeContent;
