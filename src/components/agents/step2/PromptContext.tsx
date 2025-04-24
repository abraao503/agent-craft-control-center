
import { AgentFormData } from '@/types/agent';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';

interface PromptContextProps {
  formData: AgentFormData;
  updateFormData: (data: Partial<AgentFormData>) => void;
}

const PromptContext = ({ formData, updateFormData }: PromptContextProps) => {
  const { t } = useLanguage();

  return (
    <div className="form-container">
      <div className="space-y-2">
        <Label htmlFor="promptDescription">{t('agents.promptDescription')}</Label>
        <Textarea
          id="promptDescription"
          placeholder={t('agents.promptDescriptionPlaceholder')}
          value={formData.promptDescription}
          onChange={(e) => updateFormData({ promptDescription: e.target.value })}
          required
          className="min-h-[100px]"
        />
        <p className="text-sm text-muted-foreground">
          {t('agents.promptDescriptionHelp')}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal">{t('agents.goal')}</Label>
        <Textarea
          id="goal"
          placeholder={t('agents.goalPlaceholder')}
          value={formData.goal}
          onChange={(e) => updateFormData({ goal: e.target.value })}
          required
        />
        <p className="text-sm text-muted-foreground">
          {t('agents.goalHelp')}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="habilities">{t('agents.skills')}</Label>
        <Textarea
          id="habilities"
          placeholder={t('agents.skillsPlaceholder')}
          value={formData.habilities}
          onChange={(e) => updateFormData({ habilities: e.target.value })}
          required
        />
        <p className="text-sm text-muted-foreground">
          {t('agents.skillsHelp')}
        </p>
      </div>

      <div className="py-2 my-4 border-t border-b">
        <h3 className="text-lg font-medium mb-2">{t('agents.companyInfo')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('agents.companyInfoDescription')}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyName">{t('agents.companyName')}</Label>
        <Input
          id="companyName"
          placeholder={t('agents.companyNamePlaceholder')}
          value={formData.companyName}
          onChange={(e) => updateFormData({ companyName: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companySite">{t('agents.companyWebsite')}</Label>
        <Input
          id="companySite"
          placeholder={t('agents.companyWebsitePlaceholder')}
          value={formData.companySite}
          onChange={(e) => updateFormData({ companySite: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyDescription">{t('agents.companyDescription')}</Label>
        <Textarea
          id="companyDescription"
          placeholder={t('agents.companyDescriptionPlaceholder')}
          value={formData.companyDescription}
          onChange={(e) => updateFormData({ companyDescription: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companySector">{t('agents.companySector')}</Label>
        <Input
          id="companySector"
          placeholder={t('agents.companySectorPlaceholder')}
          value={formData.companySector}
          onChange={(e) => updateFormData({ companySector: e.target.value })}
          required
        />
      </div>
    </div>
  );
};

export default PromptContext;
