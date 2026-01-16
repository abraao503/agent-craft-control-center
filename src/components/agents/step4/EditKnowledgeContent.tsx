import { useState, useEffect } from "react";
import { AgentFormData, AssistantContent } from "@/types/agent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { X, Upload, FileText } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Content, CreateContentRequest } from "@/types/content";
import { api } from "@/services/api";
import { UploadDocumentResponse } from "@/types/file";
import { useQuery } from "@tanstack/react-query";
import { listContent } from "@/services/content/listContent";
import { createContent } from "@/services/content/createContent";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";

interface EditKnowledgeContentProps {
  formData: AgentFormData;
  updateFormData: (data: Partial<AgentFormData>) => void;
  setContentsToUpdate: React.Dispatch<React.SetStateAction<AssistantContent[]>>;
}

type AgentContent = AgentFormData["contents"][0];

const EditKnowledgeContent = ({
  formData,
  updateFormData,
  setContentsToUpdate,
}: EditKnowledgeContentProps) => {
  const [newContentName, setNewContentName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localContents, setLocalContents] = useState<Content[]>([]);
  const { toast } = useToast();

  const { workspaceId } = useWorkspaceManager();

  // Fetch available contents using React Query
  const {
    isLoading,
    data: contentData,
    error,
  } = useQuery({
    queryKey: ["listContent", workspaceId],
    queryFn: () => listContent(workspaceId || ""),
  });

  // Atualizar a lista local quando os dados da API forem carregados
  useEffect(() => {
    if (contentData?.contents) {
      setLocalContents(contentData.contents);
    }
  }, [contentData]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading content",
        description: "Failed to load available content",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleContentSelect = (content: Content) => {
    const contentAlreadySelected = formData.contents.find(
      (c) => c.id === content.id
    );

    if (contentAlreadySelected) {
      removeContent({
        id: content.id,
        name: content.name,
      });
    } else {
      addContent({
        id: content.id,
        name: content.name,
      });
    }
  };

  const removeContent = (content: AgentContent) => {
    const updatedContents = formData.contents.filter(
      (c) => c.id !== content.id
    );

    setContentsToUpdate((prev) => {
      const contentIndex = prev.findIndex((c) => c.contentId === content.id);

      if (contentIndex !== -1) {
        const newArray = [...prev];
        newArray[contentIndex] = {
          action: "delete",
          contentId: content.id,
        };
        return newArray;
      } else {
        return [...prev, { contentId: content.id, action: "delete" }];
      }
    });

    updateFormData({ contents: updatedContents });
  };

  const addContent = (content: AgentContent) => {
    const updatedContents = [...formData.contents, content];

    setContentsToUpdate((prev) => {
      const contentIndex = prev.findIndex((c) => c.contentId === content.id);

      if (contentIndex !== -1) {
        const newArray = [...prev];
        newArray[contentIndex] = {
          action: "create",
          contentId: content.id,
        };
        return newArray;
      } else {
        return [...prev, { contentId: content.id, action: "create" }];
      }
    });

    updateFormData({ contents: updatedContents });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.name.toLowerCase();
    if (!fileType.endsWith(".pdf") && !fileType.endsWith(".txt")) {
      toast({
        title: "Invalid file type",
        description: "Only PDF and TXT files are supported",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "File required",
        description: "Please select a file to upload",
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

    if (newContentName.trim().length < 3) {
      toast({
        title: "Content name too short",
        description: "Content name must be at least 3 characters long.",
        variant: "destructive",
      });

      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload file
      const formData = new FormData();
      formData.append("file", selectedFile);

      const { data: fileData } = await api.post<UploadDocumentResponse>(
        "file/document/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // 2. Create content with uploaded file
      const contentRequest: CreateContentRequest = {
        name: newContentName,
        type: "file",
        fileId: fileData.id,
      };

      // Use the createContent service
      const newContent = await createContent(contentRequest);

      // Adicionar o novo conteúdo à lista local
      setLocalContents((prev) => [...prev, newContent]);

      // 3. Add the newly created content to selected contents and mark it for creation
      const simplifiedContent = {
        id: newContent.id,
        name: newContent.name,
      };

      addContent(simplifiedContent);

      // Reset form
      setNewContentName("");
      setSelectedFile(null);
      if (document.getElementById("edit-upload") instanceof HTMLInputElement) {
        (document.getElementById("edit-upload") as HTMLInputElement).value = "";
      }

      toast({
        title: "Content uploaded successfully",
        description: `${newContentName} has been added to your knowledge base.`,
      });
    } catch (error) {
      console.error("Error uploading content:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your content.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Filtrar conteúdos disponíveis para mostrar apenas os que não estão selecionados
  const availableContents = localContents.filter(
    (content) => !formData.contents.some((c) => c.id === content.id)
  );

  return (
    <div className="form-container">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Conteúdo de conhecimento</h3>
        <p className="text-sm text-muted-foreground">
          Selecione conteúdo existente ou envie novos arquivos para o seu agente
          usar como fontes de conhecimento.
        </p>
      </div>

      <div className="space-y-6">
        <Card className="p-4">
          <Label className="block mb-4">Enviar novo conteúdo</Label>
          <div className="space-y-4">
            <Input
              placeholder="Nome do conteúdo"
              value={newContentName}
              onChange={(e) => setNewContentName(e.target.value)}
            />
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-muted-foreground">
                Envie arquivos PDF ou TXT (máx. 10MB)
              </p>
              <Input
                id="edit-upload"
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("edit-upload")?.click()}
                className="mt-4"
                disabled={isUploading}
              >
                Selecionar arquivo
              </Button>
              {selectedFile && (
                <div className="mt-4">
                  <p className="text-sm font-medium">
                    Arquivo selecionado: {selectedFile.name}
                  </p>
                  <Button
                    onClick={handleFileUpload}
                    className="mt-2"
                    disabled={isUploading}
                    isLoading={isUploading}
                  >
                    Enviar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <Label className="block mb-4">Conteúdo disponível</Label>
          <div className="space-y-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Carregando conteúdo disponível...
              </p>
            ) : availableContents.length > 0 ? (
              availableContents.map((content) => (
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
                        {format(new Date(content.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    Selecionar
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum conteúdo disponível. Envie seu primeiro arquivo acima.
              </p>
            )}
          </div>
        </Card>

        <div className="mt-4">
          <Label className="block mb-2">
            Conteúdo selecionado ({formData.contents.length})
          </Label>
          {formData.contents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
              Nenhum conteúdo selecionado ainda
            </p>
          ) : (
            <div className="border rounded-md p-4 space-y-2">
              {formData.contents.map((content) => {
                const fullContent = localContents.find(
                  (c) => c.id === content.id
                );
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
                      {fullContent && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {fullContent.type.toUpperCase()}
                        </span>
                      )}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeContent(content)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remover</span>
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

export default EditKnowledgeContent;
