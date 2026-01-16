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

const CustomersExportXlsxPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
        title: "Erro",
        description:
          "Workspace não selecionado. Por favor, selecione um workspace.",
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
        title: "Sucesso",
        description: "Clientes exportados com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao exportar clientes:", error);
      toast({
        title: "Erro",
        description: "Falha ao exportar clientes. Por favor, tente novamente.",
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
            Exportar Clientes
          </h1>
          <p className="text-muted-foreground">
            Exporte seus clientes em formato XLSX com filtros personalizados
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Exportação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="messageCount">
                Quantidade Mínima de Mensagens
              </Label>
              <Input
                id="messageCount"
                type="number"
                min="0"
                placeholder="Ex: 5"
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
                Tipo da Última Interação
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
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="customer">Cliente</SelectItem>
                  <SelectItem value="assistant">Agente</SelectItem>
                  <SelectItem value="human_assistant">Agente Humano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Data e Hora da Última Interação (Início)</Label>
              <div className="flex gap-2">
                <DateTimePicker
                  date={filters.lastInteractionStartDate}
                  setDate={(date) =>
                    setFilters({
                      ...filters,
                      lastInteractionStartDate: date,
                    })
                  }
                  placeholder="Selecione a data e hora inicial"
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
              <Label>Data e Hora da Última Interação (Fim)</Label>
              <div className="flex gap-2">
                <DateTimePicker
                  date={filters.lastInteractionEndDate}
                  setDate={(date) =>
                    setFilters({
                      ...filters,
                      lastInteractionEndDate: date,
                    })
                  }
                  placeholder="Selecione a data e hora final"
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
              <Label>Data de Criação do Chat</Label>
              <div className="flex gap-2">
                <DatePicker
                  date={filters.chatCreatedAt}
                  setDate={(date) =>
                    setFilters({
                      ...filters,
                      chatCreatedAt: date,
                    })
                  }
                  placeholder="Selecione a data de criação do chat"
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
            <Label htmlFor="keywords">Palavras-chave</Label>
            <div className="flex">
              <Input
                id="keywords"
                placeholder="Digite palavras-chave e pressione Enter"
                value={currentKeyword}
                onChange={(e) => setCurrentKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button type="button" onClick={handleAddKeyword} className="ml-2">
                Adicionar
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
                Exportando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar XLSX
              </span>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomersExportXlsxPage;
