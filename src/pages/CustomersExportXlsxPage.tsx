import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { DatePicker } from "@/components/ui/date-picker";
import {
  exportCustomersXlsx,
  filterCustomersDtoSchema,
} from "@/services/customer";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

const CustomersExportXlsxPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [filters, setFilters] = useState<
    Omit<z.infer<typeof filterCustomersDtoSchema>, "workspaceId" | "timezone">
  >({
    messageCount: undefined,
    lastInteractionStartDate: undefined,
    lastInteractionEndDate: undefined,
    lastInteractionType: undefined,
    keywords: [],
    chatCreatedAt: undefined,
  });

  const { workspaceId } = useWorkspaceManager({
    queryKeys: ["exportCustomersXlsx"],
    autoRefetch: false,
  });

  const handleExport = async () => {
    if (!workspaceId) {
      toast({
        title: t("customerExport.error"),
        description: t("customerExport.workspaceRequired"),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const exportFilters: z.infer<typeof filterCustomersDtoSchema> = {
        workspaceId,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...filters,
        keywords: keywords,
      };

      const blob = await exportCustomersXlsx(exportFilters);

      // Criar um URL para o blob
      const url = window.URL.createObjectURL(blob);

      // Criar um elemento de link temporário
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `clientes-exportados-${new Date().toISOString().split("T")[0]}.xlsx`
      );

      // Adicionar ao documento e clicar
      document.body.appendChild(link);
      link.click();

      // Limpar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: t("customerExport.success"),
        description: t("customerExport.successDescription"),
      });
    } catch (error) {
      console.error("Erro ao exportar clientes:", error);
      toast({
        title: t("customerExport.error"),
        description: t("customerExport.exportError"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKeyword = () => {
    if (currentKeyword.trim() && !keywords.includes(currentKeyword.trim())) {
      setKeywords([...keywords, currentKeyword.trim()]);
      setCurrentKeyword("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/customers")}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("customerExport.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("customerExport.description")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("customerExport.filters")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="messageCount">
                {t("customerExport.minMessages")}
              </Label>
              <Input
                id="messageCount"
                type="number"
                min="0"
                placeholder={t("customerExport.exampleCount")}
                value={filters.messageCount || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    messageCount: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastInteractionType">
                {t("customerExport.lastInteractionType")}
              </Label>
              <Select
                value={filters.lastInteractionType || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    lastInteractionType:
                      value === "all"
                        ? undefined
                        : (value as
                            | "customer"
                            | "assistant"
                            | "human_assistant"),
                  })
                }
              >
                <SelectTrigger id="lastInteractionType">
                  <SelectValue placeholder={t("customerExport.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("customerExport.all")}</SelectItem>
                  <SelectItem value="customer">{t("customerExport.customer")}</SelectItem>
                  <SelectItem value="assistant">{t("customerExport.assistant")}</SelectItem>
                  <SelectItem value="human_assistant">{t("customerExport.humanAssistant")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>{t("customerExport.interactionStart")}</Label>
              <div className="flex gap-2">
                <DateTimePicker
                  date={filters.lastInteractionStartDate}
                  setDate={(date) =>
                    setFilters({
                      ...filters,
                      lastInteractionStartDate: date,
                    })
                  }
                  placeholder={t("customerExport.selectStart")}
                />
                {filters.lastInteractionStartDate && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setFilters({
                        ...filters,
                        lastInteractionStartDate: undefined,
                      })
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("customerExport.interactionEnd")}</Label>
              <div className="flex gap-2">
                <DateTimePicker
                  date={filters.lastInteractionEndDate}
                  setDate={(date) =>
                    setFilters({
                      ...filters,
                      lastInteractionEndDate: date,
                    })
                  }
                  placeholder={t("customerExport.selectEnd")}
                />
                {filters.lastInteractionEndDate && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setFilters({
                        ...filters,
                        lastInteractionEndDate: undefined,
                      })
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("customerExport.chatCreated")}</Label>
              <div className="flex gap-2">
                <DatePicker
                  date={filters.chatCreatedAt}
                  setDate={(date) =>
                    setFilters({
                      ...filters,
                      chatCreatedAt: date,
                    })
                  }
                  placeholder={t("customerExport.selectChatCreated")}
                />
                {filters.chatCreatedAt && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setFilters({
                        ...filters,
                        chatCreatedAt: undefined,
                      })
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">{t("customerExport.keywords")}</Label>
            <div className="flex">
              <Input
                id="keywords"
                placeholder={t("customerExport.keywordsPlaceholder")}
                value={currentKeyword}
                onChange={(e) => setCurrentKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button type="button" onClick={handleAddKeyword} className="ml-2">
                {t("customerExport.add")}
              </Button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {keywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="outline"
                    className="flex items-center gap-1 bg-primary-foreground text-primary font-medium border-primary/20"
                  >
                    {keyword}
                    <X
                      className="h-3 w-3 cursor-pointer text-primary hover:text-destructive"
                      onClick={() => handleRemoveKeyword(keyword)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleExport}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                {t("customerExport.exporting")}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                {t("customerExport.export")}
              </span>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomersExportXlsxPage;
