import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth/hooks";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormErrorTracker } from "@/components/ui/form-error-tracker";
import { HighlightService } from "@/lib/highlight";
import { signupCompany } from "@/services/company/signupCompany";
import { AxiosError } from "axios";
import { translateAuthError } from "@/utils/authErrorTranslations";
import { useTranslation } from "react-i18next";

// Esquema de validação para o formulário de cadastro
const signupSchema = z
  .object({
    ownerName: z.string().min(1, "Nome é obrigatório"),
    ownerEmail: z.string().email("Email inválido"),
    ownerPassword: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
    confirmPassword: z.string(),
    companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  })
  .refine((data) => data.ownerPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

const SignupForm = () => {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      ownerName: "",
      ownerEmail: "",
      ownerPassword: "",
      confirmPassword: "",
      companyName: "",
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);
    setError("");

    try {
      // Cria a empresa e o usuário owner
      const response = await signupCompany({
        ownerName: data.ownerName,
        ownerEmail: data.ownerEmail,
        ownerPassword: data.ownerPassword,
        companyName: data.companyName,
      });

      // Salva o token no localStorage
      localStorage.setItem("token", response.token);

      // Faz login automático após signup
      await login(data.ownerEmail, data.ownerPassword);

      navigate("/");
    } catch (error) {
      console.error("Signup error:", error);

      // Traduz mensagens de erro do backend
      let errorMessage: string = t("auth.signupFailed");

      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = translateAuthError(
          error.response.data.message,
          t("auth.signupFailed")
        );
      } else if (error instanceof Error) {
        errorMessage = t("auth.genericError");
      }

      setError(errorMessage);

      // Report signup error to Highlight
      if (error instanceof Error) {
        HighlightService.reportError(error, "Signup failed", {
          email: data.ownerEmail,
          companyName: data.companyName,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          {t("auth.createAccount")}
        </CardTitle>
        <CardDescription className="text-center">
          {t("auth.signupDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormErrorTracker
          form={form}
          formId="signup-form"
          formName="User Registration Form"
          contextInfo={{
            pageType: "auth",
            formType: "signup",
          }}
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.companyName")}</FormLabel>
                    <FormControl>
                      <Input placeholder="Minha Empresa Ltda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.fullName")}</FormLabel>
                    <FormControl>
                      <Input placeholder="João Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.password")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.confirmPassword")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t("auth.creatingAccount") : t("auth.createAccount")}
              </Button>
            </form>
          </Form>
        </FormErrorTracker>

        <div className="mt-4 text-center text-sm">
          {t("auth.alreadyHaveAccount")} {" "}
          <Link to="/login" className="text-primary hover:underline">
            {t("auth.loginLink")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignupForm;
