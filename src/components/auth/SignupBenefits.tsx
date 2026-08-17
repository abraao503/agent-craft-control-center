import { Building2, Users, Zap, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SignupBenefits() {
  const { t } = useTranslation();
  const benefits = [
    {
      icon: Building2,
      title: t("auth.companyBenefitTitle"),
      description: t("auth.companyBenefitDescription"),
    },
    {
      icon: Users,
      title: t("auth.teamBenefitTitle"),
      description: t("auth.teamBenefitDescription"),
    },
    {
      icon: Zap,
      title: t("auth.automationBenefitTitle"),
      description: t("auth.automationBenefitDescription"),
    },
    {
      icon: Shield,
      title: t("auth.secureBenefitTitle"),
      description: t("auth.secureBenefitDescription"),
    },
  ];

  return (
    <div className="mt-8 w-full max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benefits.map((benefit, index) => (
          <div
            key={index}
            className="flex items-start space-x-3 p-4 rounded-lg bg-white border border-gray-200"
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <benefit.icon className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">
                {benefit.title}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                {benefit.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
