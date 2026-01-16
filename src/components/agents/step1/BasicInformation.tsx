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
import { X, Plus } from "lucide-react";
import { BRAZILIAN_TIMEZONES } from "@/constants/timezones";
import { LANGUAGES } from "@/constants/languages";
import { listIaModels } from "@/services/iaModel/listIaModel";
import { IaModel } from "@/types/iaModel";
import { useQuery } from "@tanstack/react-query";

interface BasicInformationProps {
  formData: AgentFormData;
  updateFormData: (data: Partial<AgentFormData>) => void;
}

const BasicInformation = ({
  formData,
  updateFormData,
}: BasicInformationProps) => {
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
    formData.avatarUrl
  );
  const [iaModels, setIaModel] = useState<IaModel[]>([]);
  const [newSkipMessage, setNewSkipMessage] = useState<string>("");

  const {
    isLoading,
    data: iaModelData,
    error,
  } = useQuery({
    queryKey: ["listIaModels"],
    queryFn: listIaModels,
  });

  useEffect(() => {
    if (iaModelData) {
      setIaModel(iaModelData.iaModels);
    }
  }, [iaModelData]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload this to storage and get a URL back
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      updateFormData({ avatarUrl: previewUrl });
    }
  };

  const handleUpdateLanguage = (value: AgentLanguage) => {
    updateFormData({ language: value });
  };

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
    <div className="form-container">
      <div className="space-y-2">
        <Label htmlFor="name">Nome público</Label>
        <Input
          id="name"
          placeholder="Agente de Suporte ao Cliente"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          required
        />
        <p className="text-sm text-muted-foreground">
          Este é o nome que os usuários verão ao interagir com seu agente.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Um agente prestativo que ajuda clientes com suas dúvidas..."
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          required
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeZone">Fuso horário</Label>
        <Select
          value={formData.timeZone}
          onValueChange={(value) => updateFormData({ timeZone: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um fuso horário" />
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

      <div className="space-y-2">
        <Label htmlFor="language">Idioma</Label>
        <Select
          value={formData.language}
          onValueChange={(value: AgentLanguage) => handleUpdateLanguage(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um idioma" />
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
        <Label htmlFor="iaModelId">Modelo de IA</Label>
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
        <p className="text-sm text-muted-foreground">
          Modelos diferentes possuem capacidades e preços diferentes.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="iaProviderApiKey">API Key do Provedor</Label>
        <Input
          id="iaProviderApiKey"
          type="password"
          placeholder="sk-..."
          value={formData.iaProviderApiKey}
          onChange={(e) => updateFormData({ iaProviderApiKey: e.target.value })}
          required
        />
        <p className="text-sm text-muted-foreground">
          Chave de API do provedor do modelo de IA selecionado.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="skipMessages">Mensagens a Ignorar</Label>
        <div className="flex gap-2">
          <Input
            id="skipMessages"
            placeholder="Digite uma mensagem a ser ignorada"
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
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData.skipMessages.length > 0 && (
          <div className="border rounded-md mt-2 divide-y">
            {formData.skipMessages.map((message, index) => (
              <div
                key={index}
                className="p-2 flex justify-between items-center gap-2 bg-muted/30"
              >
                <div className="text-sm break-all">{message}</div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSkipMessage(index)}
                  className="h-8 w-8 p-0 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Mensagens que o agente deve ignorar quando recebidas de um humano,
          evitando que o agente se desative.
        </p>
      </div>
    </div>
  );
};

export default BasicInformation;
