import { useEffect, useState } from "react";
import { AgentFormData, AgentLanguage } from "@/types/agent";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  X,
  Plus,
  User,
  Globe,
  Clock,
  MessageSquare,
  Brain,
  Key,
  Ban,
} from "lucide-react";
import { BRAZILIAN_TIMEZONES } from "@/constants/timezones";
import { LANGUAGES } from "@/constants/languages";
import { listIaModels } from "@/services/iaModel/listIaModel";
import { IaModel } from "@/types/iaModel";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface BasicInformationCardProps {
  formData: AgentFormData;
  updateFormData: (data: Partial<AgentFormData>) => void;
}

export const BasicInformationCard = ({
  formData,
  updateFormData,
}: BasicInformationCardProps) => {
  const [iaModels, setIaModel] = useState<IaModel[]>([]);
  const [newSkipMessage, setNewSkipMessage] = useState<string>("");
  const [initialApiKey] = useState(formData.iaProviderApiKey); // Store initial value
  const [apiKeyReadOnly, setApiKeyReadOnly] = useState(true); // Start as readonly to prevent autofill

  const { data: iaModelData } = useQuery({
    queryKey: ["listIaModels"],
    queryFn: listIaModels,
  });

  useEffect(() => {
    if (iaModelData) {
      setIaModel(iaModelData.iaModels);
    }
  }, [iaModelData]);

  // Prevent autocomplete from filling the API key field
  useEffect(() => {
    const timer = setTimeout(() => {
      // If the field was empty initially and now has a value, it was autocompleted
      if (!initialApiKey && formData.iaProviderApiKey) {
        updateFormData({ iaProviderApiKey: "" });
      }
    }, 500); // Wait for browser autocomplete to trigger

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const addSkipMessage = () => {
    if (newSkipMessage.trim() !== "") {
      const updatedSkipMessages = [
        ...formData.skipMessages,
        newSkipMessage.trim(),
      ];
      updateFormData({ skipMessages: updatedSkipMessages });
      setNewSkipMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkipMessage();
    }
  };

  const removeSkipMessage = (index: number) => {
    const updatedSkipMessages = [...formData.skipMessages];
    updatedSkipMessages.splice(index, 1);
    updateFormData({ skipMessages: updatedSkipMessages });
  };

  return (
    <div className="space-y-6">
      {/* Identificação */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Identificação do Agente</CardTitle>
              <CardDescription>
                Informações básicas que identificam o agente
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Agente</Label>
            <Input
              id="name"
              placeholder="Ex: Assistente de Vendas, Suporte Técnico..."
              value={formData.name}
              onChange={(e) => updateFormData({ name: e.target.value })}
              required
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              Nome que identifica o agente internamente no sistema
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva brevemente o propósito e função deste agente..."
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              required
              className="min-h-[80px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Descrição interna para facilitar a identificação do agente
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Regionalização */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Regionalização</CardTitle>
              <CardDescription>
                Configurações de idioma e fuso horário
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="language" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Idioma
            </Label>
            <Select
              value={formData.language}
              onValueChange={(value: AgentLanguage) =>
                updateFormData({ language: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o idioma" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeZone" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Fuso Horário
            </Label>
            <Select
              value={formData.timeZone}
              onValueChange={(value) => updateFormData({ timeZone: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o fuso" />
              </SelectTrigger>
              <SelectContent>
                {BRAZILIAN_TIMEZONES.map((tz) => (
                  <SelectItem key={tz.timezone} value={tz.timezone}>
                    {tz.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mensagem Inicial */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Mensagem Inicial</CardTitle>
              <CardDescription>
                Primeira mensagem enviada ao iniciar uma conversa
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            id="initialMessage"
            placeholder="Ex: Olá! Sou o assistente virtual. Como posso ajudar você hoje?"
            value={formData.initialMessage}
            onChange={(e) => updateFormData({ initialMessage: e.target.value })}
            required
            className="min-h-[100px] resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Use uma saudação amigável e profissional que convide à interação
          </p>
        </CardContent>
      </Card>

      {/* Modelo de IA */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Modelo de Inteligência Artificial</CardTitle>
              <CardDescription>
                Escolha o motor de IA que processará as conversas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="iaModelId">Modelo</Label>
            <Select
              value={formData.iaModelId}
              onValueChange={(value) => updateFormData({ iaModelId: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um modelo de IA" />
              </SelectTrigger>
              <SelectContent>
                {iaModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Modelos diferentes possuem capacidades e custos variados
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="iaProviderApiKey"
              className="flex items-center gap-2"
            >
              <Key className="h-4 w-4" />
              Chave de API
            </Label>
            {/* Hidden honeypot field to confuse autofill */}
            <input
              type="password"
              autoComplete="current-password"
              style={{ display: "none" }}
              tabIndex={-1}
            />
            <Input
              id="iaProviderApiKey"
              type="text"
              placeholder="sk-..."
              value={formData.iaProviderApiKey}
              onChange={(e) =>
                updateFormData({ iaProviderApiKey: e.target.value })
              }
              onFocus={() => setApiKeyReadOnly(false)}
              readOnly={apiKeyReadOnly}
              required
              className="font-mono text-sm"
              autoComplete="new-password"
              data-lpignore="true"
              data-form-type="other"
              data-1p-ignore="true"
            />
            <p className="text-xs text-muted-foreground">
              Chave de autenticação do provedor do modelo selecionado
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Mensagens a Ignorar */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Mensagens a Ignorar</CardTitle>
              <CardDescription>
                Mensagens que o agente deve desconsiderar ao recebê-las
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                id="skipMessages"
                placeholder='Ex: "ok", "obrigado", "valeu"...'
                value={newSkipMessage}
                onChange={(e) => setNewSkipMessage(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addSkipMessage}
                className="flex-shrink-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Evita que o agente se desative ao receber mensagens curtas ou
              específicas
            </p>
          </div>

          {formData.skipMessages.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">
                Mensagens configuradas ({formData.skipMessages.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {formData.skipMessages.map((message, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="px-3 py-1.5 text-sm group hover:bg-destructive/10"
                  >
                    <span className="mr-2">{message}</span>
                    <button
                      type="button"
                      onClick={() => removeSkipMessage(index)}
                      className="opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
