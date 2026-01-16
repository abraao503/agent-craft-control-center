import { AgentFormData } from "@/types/agent";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PlusCircle, X } from "lucide-react";
import { TipTapEditor } from "@/components/ui/tiptap-mentions";
import { convertTextToHtmlString } from "@/lib/utils";
import { useEffect, useState } from "react";

interface PromptContextProps {
  formData: AgentFormData;
  updateFormData: (data: Partial<AgentFormData>) => void;
}

const PromptContext = ({ formData, updateFormData }: PromptContextProps) => {
  const [editorValue, setEditorValue] = useState<string>("");

  useEffect(() => {
    const initialValue = convertTextToHtmlString(formData.instructions || "");
    setEditorValue(initialValue);
  }, []);

  const handleAddLink = () => {
    const currentLinks = formData.links || [];
    updateFormData({
      links: [...currentLinks, { name: "", url: "" }],
    });
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = [...(formData.links || [])];
    newLinks.splice(index, 1);
    updateFormData({ links: newLinks });
  };

  const handleLinkChange = (
    index: number,
    field: "name" | "url",
    value: string
  ) => {
    const newLinks = [...(formData.links || [])];
    newLinks[index] = { ...newLinks[index], [field]: value };
    updateFormData({ links: newLinks });
  };

  return (
    <div className="form-container space-y-6">
      <div className="space-y-2">
        <Label htmlFor="function">Função</Label>
        <Textarea
          id="function"
          placeholder="Atende solicitações de suporte ao cliente e fornece informações sobre produtos"
          value={formData.function || ""}
          onChange={(e) => updateFormData({ function: e.target.value })}
          required
          className="min-h-[100px]"
        />
        <p className="text-sm text-muted-foreground">
          Qual é a função ou o papel específico do seu agente?
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="style">Estilo</Label>
        <Textarea
          id="style"
          placeholder="Tom profissional e amigável, respostas concisas"
          value={formData.style || ""}
          onChange={(e) => updateFormData({ style: e.target.value })}
          required
          className="min-h-[100px]"
        />
        <p className="text-sm text-muted-foreground">
          Descreva o estilo de comunicação e o tom do seu agente
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Instruções</Label>
        <TipTapEditor
          value={editorValue}
          onChange={(newValue) => {
            setEditorValue(newValue);
            updateFormData({ instructions: newValue });
          }}
          placeholder="Seja sempre prestativo e profissional. Forneça respostas claras e concisas..."
          className="min-h-[150px]"
          mentionItems={formData.customFields.map((field) => ({
            id: field.name,
            label: field.name,
          }))}
        />
        <p className="text-sm text-muted-foreground">
          Instruções específicas para o comportamento do seu agente. Digite
          &quot;&#123;&quot; para inserir variáveis.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="blacklist">Lista de bloqueio</Label>
        <Textarea
          id="blacklist"
          placeholder="Lista de tópicos ou palavras-chave a evitar"
          value={formData.blacklist || ""}
          onChange={(e) => updateFormData({ blacklist: e.target.value })}
          className="min-h-[100px]"
        />
        <p className="text-sm text-muted-foreground">
          Opcional: Lista de tópicos ou palavras-chave que seu agente deve
          evitar
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label>Links</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddLink}
            className="flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            Adicionar link
          </Button>
        </div>

        <div className="space-y-3">
          {(formData.links || []).map((link, index) => (
            <div
              key={index}
              className="flex gap-3 items-center border p-3 rounded-md"
            >
              <div className="flex-1">
                <Label
                  htmlFor={`link-name-${index}`}
                  className="text-xs mb-1 block"
                >
                  Nome
                </Label>
                <Input
                  id={`link-name-${index}`}
                  placeholder="Documentação"
                  value={link.name}
                  onChange={(e) =>
                    handleLinkChange(index, "name", e.target.value)
                  }
                />
              </div>
              <div className="flex-1">
                <Label
                  htmlFor={`link-url-${index}`}
                  className="text-xs mb-1 block"
                >
                  URL
                </Label>
                <Input
                  id={`link-url-${index}`}
                  placeholder="https://example.com/docs"
                  value={link.url}
                  onChange={(e) =>
                    handleLinkChange(index, "url", e.target.value)
                  }
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveLink(index)}
                className="self-end mb-0.5"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {(formData.links || []).length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              Nenhum link adicionado. Clique em "Adicionar link" para adicionar
              um link de referência para o seu agente.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptContext;
