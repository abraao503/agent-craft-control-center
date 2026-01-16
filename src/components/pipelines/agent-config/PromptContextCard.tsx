import { AgentFormData } from "@/types/agent";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PlusCircle,
  X,
  User,
  Palette,
  FileText,
  Shield,
  Link2,
} from "lucide-react";
import { TipTapEditor } from "@/components/ui/tiptap-mentions";
import { convertTextToHtmlString } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

interface PromptContextCardProps {
  formData: AgentFormData;
  updateFormData: (data: Partial<AgentFormData>) => void;
}

export const PromptContextCard = ({
  formData,
  updateFormData,
}: PromptContextCardProps) => {
  const [editorValue, setEditorValue] = useState<string>("");
  const isInitialized = useRef(false);

  // Inicializar apenas uma vez quando o componente monta ou quando formData.instructions vem vazio e depois recebe valor
  useEffect(() => {
    if (!isInitialized.current || (!editorValue && formData.instructions)) {
      const initialValue = convertTextToHtmlString(formData.instructions || "");
      setEditorValue(initialValue);
      isInitialized.current = true;
    }
  }, [formData.instructions, editorValue]);

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
    <div className="space-y-6">
      {/* Função */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Função</CardTitle>
              <CardDescription>
                Defina qual o papel principal do agente
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              id="function"
              placeholder="Ex: Atender clientes, qualificar leads, fornecer suporte técnico, processar pedidos..."
              value={formData.function || ""}
              onChange={(e) => updateFormData({ function: e.target.value })}
              required
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Descreva as responsabilidades e atividades principais do agente
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Estilo de Comunicação */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Estilo de Comunicação</CardTitle>
              <CardDescription>
                Tom, linguagem e personalidade nas respostas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            id="style"
            placeholder="Ex: Profissional e cordial, use emojis moderadamente, seja direto e objetivo, linguagem informal e amigável..."
            value={formData.style || ""}
            onChange={(e) => updateFormData({ style: e.target.value })}
            required
            className="min-h-[100px] resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Como o agente deve se comunicar e interagir com os usuários
          </p>
        </CardContent>
      </Card>

      {/* Instruções Detalhadas */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Instruções Detalhadas</CardTitle>
              <CardDescription>
                Diretrizes específicas e regras de comportamento
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <TipTapEditor
            value={editorValue}
            onChange={(newValue) => {
              setEditorValue(newValue);
              updateFormData({ instructions: newValue });
            }}
            placeholder="Digite instruções específicas... 
Ex:
• Sempre confirme informações importantes
• Nunca prometa o que não pode cumprir
• Encaminhe para humano em casos complexos"
            className="min-h-[200px]"
            mentionItems={formData.customFields.map((field) => ({
              id: field.name,
              label: field.name,
            }))}
          />
          <p className="text-xs text-muted-foreground">
            Instruções detalhadas, regras e diretrizes
          </p>
        </CardContent>
      </Card>

      {/* Restrições */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Restrições e Limites</CardTitle>
              <CardDescription>
                Tópicos, palavras ou temas que devem ser evitados
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            id="blacklist"
            placeholder="Ex: Não discuta política, religião ou temas polêmicos. Não forneça informações de outros clientes. Não faça diagnósticos médicos..."
            value={formData.blacklist || ""}
            onChange={(e) => updateFormData({ blacklist: e.target.value })}
            className="min-h-[100px] resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Opcional: Assuntos ou comportamentos que o agente deve evitar
          </p>
        </CardContent>
      </Card>

      {/* Links de Referência */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Links de Referência</CardTitle>
                <CardDescription>
                  URLs úteis que o agente pode consultar ou compartilhar
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddLink}
              className="flex items-center gap-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(formData.links || []).length > 0 ? (
            <div className="space-y-3">
              {(formData.links || []).map((link, index) => (
                <div
                  key={index}
                  className="flex gap-3 items-end p-4 rounded-lg border bg-muted/30"
                >
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`link-name-${index}`}
                        className="text-xs font-medium"
                      >
                        Nome do Link
                      </Label>
                      <Input
                        id={`link-name-${index}`}
                        placeholder="Ex: Documentação, FAQ, Política de Privacidade"
                        value={link.name}
                        onChange={(e) =>
                          handleLinkChange(index, "name", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`link-url-${index}`}
                        className="text-xs font-medium"
                      >
                        URL
                      </Label>
                      <Input
                        id={`link-url-${index}`}
                        placeholder="https://exemplo.com/docs"
                        value={link.url}
                        onChange={(e) =>
                          handleLinkChange(index, "url", e.target.value)
                        }
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveLink(index)}
                    className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum link adicionado</p>
              <p className="text-xs mt-1">
                Adicione links úteis para o agente compartilhar com os usuários
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
