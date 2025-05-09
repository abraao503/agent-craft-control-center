
import { AgentFormData } from '@/types/agent';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PlusCircle, X } from 'lucide-react';

interface PromptContextProps {
  formData: AgentFormData;
  updateFormData: (data: Partial<AgentFormData>) => void;
}

const PromptContext = ({ formData, updateFormData }: PromptContextProps) => {
  const handleAddLink = () => {
    const currentLinks = formData.links || [];
    updateFormData({
      links: [...currentLinks, { name: '', url: '' }]
    });
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = [...(formData.links || [])];
    newLinks.splice(index, 1);
    updateFormData({ links: newLinks });
  };

  const handleLinkChange = (index: number, field: 'name' | 'url', value: string) => {
    const newLinks = [...(formData.links || [])];
    newLinks[index] = { ...newLinks[index], [field]: value };
    updateFormData({ links: newLinks });
  };

  return (
    <div className="form-container space-y-6">
      <div className="space-y-2">
        <Label htmlFor="identity">Identity</Label>
        <Input
          id="identity"
          placeholder="Support Assistant"
          value={formData.identity || ''}
          onChange={(e) => updateFormData({ identity: e.target.value })}
          required
        />
        <p className="text-sm text-muted-foreground">
          The name or identity of your agent
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="function">Function</Label>
        <Textarea
          id="function"
          placeholder="Handles customer support inquiries and provides product information"
          value={formData.function || ''}
          onChange={(e) => updateFormData({ function: e.target.value })}
          required
          className="min-h-[100px]"
        />
        <p className="text-sm text-muted-foreground">
          What is the specific function or role of your agent?
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal">Goal</Label>
        <Textarea
          id="goal"
          placeholder="Help users find the right product for their needs and resolve any issues"
          value={formData.goal || ''}
          onChange={(e) => updateFormData({ goal: e.target.value })}
          required
          className="min-h-[100px]"
        />
        <p className="text-sm text-muted-foreground">
          What should your agent help users accomplish?
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="style">Style</Label>
        <Textarea
          id="style"
          placeholder="Professional and friendly tone, concise responses"
          value={formData.style || ''}
          onChange={(e) => updateFormData({ style: e.target.value })}
          required
          className="min-h-[100px]"
        />
        <p className="text-sm text-muted-foreground">
          Describe the communication style and tone of your agent
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          placeholder="Always be helpful and professional. Provide clear and concise answers..."
          value={formData.instructions || ''}
          onChange={(e) => updateFormData({ instructions: e.target.value })}
          required
          className="min-h-[150px]"
        />
        <p className="text-sm text-muted-foreground">
          Specific instructions for your agent's behavior
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="blacklist">Blacklist</Label>
        <Textarea
          id="blacklist"
          placeholder="List of topics or keywords to avoid discussing"
          value={formData.blacklist || ''}
          onChange={(e) => updateFormData({ blacklist: e.target.value })}
          className="min-h-[100px]"
        />
        <p className="text-sm text-muted-foreground">
          Optional: List of topics or keywords your agent should avoid
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
            Add Link
          </Button>
        </div>
        
        <div className="space-y-3">
          {(formData.links || []).map((link, index) => (
            <div key={index} className="flex gap-3 items-center border p-3 rounded-md">
              <div className="flex-1">
                <Label htmlFor={`link-name-${index}`} className="text-xs mb-1 block">Name</Label>
                <Input
                  id={`link-name-${index}`}
                  placeholder="Documentation"
                  value={link.name}
                  onChange={(e) => handleLinkChange(index, 'name', e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor={`link-url-${index}`} className="text-xs mb-1 block">URL</Label>
                <Input
                  id={`link-url-${index}`}
                  placeholder="https://example.com/docs"
                  value={link.url}
                  onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
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
              No links added. Click "Add Link" to add a reference link for your agent.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptContext;
