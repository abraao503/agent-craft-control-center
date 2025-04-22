
import { useState } from 'react';
import { AgentFormData } from '@/types/agent';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AI_MODELS, LANGUAGES, TIME_ZONES } from '@/services/mockData';

interface BasicInformationProps {
  formData: AgentFormData;
  updateFormData: (data: Partial<AgentFormData>) => void;
}

const BasicInformation = ({ formData, updateFormData }: BasicInformationProps) => {
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(formData.avatarUrl);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload this to storage and get a URL back
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      updateFormData({ avatarUrl: previewUrl });
    }
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
        <p className="text-sm text-muted-foreground">This is the name that users will see when interacting with your agent.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="internalName">Internal Name</Label>
        <Input
          id="internalName"
          placeholder="support-agent"
          value={formData.internalName}
          onChange={(e) => updateFormData({ internalName: e.target.value })}
          required
        />
        <p className="text-sm text-muted-foreground">For your reference only. Used in analytics and logs.</p>
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
        <Label htmlFor="avatar">Avatar Image (Optional)</Label>
        <div className="flex items-center space-x-4">
          {avatarPreview && (
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
            </div>
          )}
          
          <Input
            id="avatar"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="max-w-sm"
          />
        </div>
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
            {TIME_ZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="language">Language</Label>
        <Select
          value={formData.language}
          onValueChange={(value) => updateFormData({ language: value })}
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
        <p className="text-sm text-muted-foreground">The first message your agent will send when starting a conversation.</p>
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
            {AI_MODELS.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">Different models have different capabilities and pricing.</p>
      </div>
    </div>
  );
};

export default BasicInformation;
