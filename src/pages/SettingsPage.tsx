import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth/hooks";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

const SettingsPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const { toast } = useToast();

  const handleSaveProfile = () => {
    toast({
      title: t("settings.profileUpdated"),
      description: t("settings.profileUpdatedDescription"),
    });
  };

  return (
    <div>
      <div className="space-y-6">
        <div>
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
              <LanguageSwitcher />
            </div>
            <p className="text-muted-foreground">
            {t("settings.description")}
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.profile")}</CardTitle>
              <CardDescription>
                {t("settings.profileDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("auth.fullName")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveProfile}>{t("common.saveChanges")}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("settings.apiKeys")}</CardTitle>
              <CardDescription>
                {t("settings.apiKeysDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t("settings.apiKeysComingSoon")}
              </p>
              <Button disabled>{t("settings.addApiKey")}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("settings.billing")}</CardTitle>
              <CardDescription>
                {t("settings.billingDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t("settings.billingComingSoon")}
              </p>
              <Button disabled>{t("settings.viewBilling")}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
