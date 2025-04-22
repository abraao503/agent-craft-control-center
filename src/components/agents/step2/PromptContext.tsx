
import { AgentFormData } from '@/types/agent';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PromptContextProps {
  formData: AgentFormData;
  updateFormData: (data: Partial<AgentFormData>) => void;
}

const PromptContext = ({ formData, updateFormData }: PromptContextProps) => {
  return (
    <div className="form-container">
      <div className="space-y-2">
        <Label htmlFor="promptDescription">Prompt Description</Label>
        <Textarea
          id="promptDescription"
          placeholder="A helpful customer support agent that assists users with product inquiries..."
          value={formData.promptDescription}
          onChange={(e) => updateFormData({ promptDescription: e.target.value })}
          required
          className="min-h-[100px]"
        />
        <p className="text-sm text-muted-foreground">
          Describe your agent's personality and general purpose.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal">Main Goal</Label>
        <Textarea
          id="goal"
          placeholder="Help users find the right product for their needs and resolve any issues..."
          value={formData.goal}
          onChange={(e) => updateFormData({ goal: e.target.value })}
          required
        />
        <p className="text-sm text-muted-foreground">
          What should your agent help users accomplish?
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="habilities">Skills</Label>
        <Textarea
          id="habilities"
          placeholder="Product knowledge, troubleshooting, empathy, clear communication..."
          value={formData.habilities}
          onChange={(e) => updateFormData({ habilities: e.target.value })}
          required
        />
        <p className="text-sm text-muted-foreground">
          List the skills and abilities your agent should demonstrate.
        </p>
      </div>

      <div className="py-2 my-4 border-t border-b">
        <h3 className="text-lg font-medium mb-2">Company Information</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Provide details about your company to help your agent represent your brand accurately.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          placeholder="Acme Inc."
          value={formData.companyName}
          onChange={(e) => updateFormData({ companyName: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companySite">Company Website</Label>
        <Input
          id="companySite"
          placeholder="https://www.example.com"
          value={formData.companySite}
          onChange={(e) => updateFormData({ companySite: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyDescription">Company Description</Label>
        <Textarea
          id="companyDescription"
          placeholder="Acme Inc. is a leading provider of innovative solutions for..."
          value={formData.companyDescription}
          onChange={(e) => updateFormData({ companyDescription: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companySector">Company Sector</Label>
        <Input
          id="companySector"
          placeholder="Technology, Healthcare, Education, etc."
          value={formData.companySector}
          onChange={(e) => updateFormData({ companySector: e.target.value })}
          required
        />
      </div>
    </div>
  );
};

export default PromptContext;
