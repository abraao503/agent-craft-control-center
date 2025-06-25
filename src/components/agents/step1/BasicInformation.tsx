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

  return (
    <div className="form-container">
      <div className="space-y-2">
        <Label htmlFor="name">Public Name</Label>
        <Input
          id="name"
          placeholder="Customer Support Agent"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          required
        />
        <p className="text-sm text-muted-foreground">
          This is the name that users will see when interacting with your agent.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="A helpful agent that assists customers with their inquiries..."
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          required
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeZone">Time Zone</Label>
        <Select
          value={formData.timeZone}
          onValueChange={(value) => updateFormData({ timeZone: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a time zone" />
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
        <Label htmlFor="language">Language</Label>
        <Select
          value={formData.language}
          onValueChange={(value: AgentLanguage) => handleUpdateLanguage(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a language" />
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
        <Label htmlFor="initialMessage">Initial Message</Label>
        <Textarea
          id="initialMessage"
          placeholder="Hello! How can I assist you today?"
          value={formData.initialMessage}
          onChange={(e) => updateFormData({ initialMessage: e.target.value })}
          required
        />
        <p className="text-sm text-muted-foreground">
          The first message your agent will send when starting a conversation.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="iaModelId">AI Model</Label>
        <Select
          value={formData.iaModelId}
          onValueChange={(value) => updateFormData({ iaModelId: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an AI model" />
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
          Different models have different capabilities and pricing.
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
    </div>
  );
};

export default BasicInformation;
