import React from "react";
import {
  DollarSign,
  User,
  ExternalLink,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Conversation } from "@/types/conversation";
import { DealListItem } from "@/types/deal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

type DealsPanelProps = {
  conversation: Conversation;
};

export const DealsPanel: React.FC<DealsPanelProps> = ({ conversation }) => {
  const navigate = useNavigate();

  // Mock data for deals - will be replaced with real API call
  const mockDeals: DealListItem[] = [
    {
      id: "1",
      stageId: "stage-1",
      title: "Proposta Comercial",
      description: "Proposta para implementação do sistema",
      value: 15000,
      currency: "BRL",
      createdAt: new Date("2025-01-15"),
      updatedAt: new Date("2025-01-20"),
      customer: {
        id: conversation.customer.id,
        name: conversation.customer.identifier || conversation.customer.phone,
      },
      assignedUser: {
        id: "user-1",
        name: "João Silva",
      },
    },
    {
      id: "2",
      stageId: "stage-2",
      title: "Renovação Anual",
      description: "Renovação do contrato anual",
      value: 8500,
      currency: "BRL",
      createdAt: new Date("2025-02-01"),
      updatedAt: new Date("2025-02-05"),
      customer: {
        id: conversation.customer.id,
        name: conversation.customer.identifier || conversation.customer.phone,
      },
    },
  ];

  const formatCurrency = (value: number, currency: string = "BRL") => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency,
    }).format(value);
  };

  const handleDealClick = (dealId: string) => {
    // Navigate to deal details - adjust route as needed
    navigate(`/deals/${dealId}`);
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        {mockDeals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum deal associado
          </p>
        ) : (
          mockDeals.map((deal) => (
            <div
              key={deal.id}
              className="border rounded-lg p-3 hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => handleDealClick(deal.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold truncate">
                    {deal.title}
                  </h4>
                  {deal.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {deal.description}
                    </p>
                  )}
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              </div>

              {deal.value && (
                <div className="mt-2 flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(deal.value, deal.currency)}
                  </span>
                </div>
              )}

              {deal.assignedUser && (
                <div className="mt-2 flex items-center gap-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {deal.assignedUser.name}
                  </span>
                </div>
              )}

              <div className="mt-2 text-xs text-muted-foreground">
                Criado em{" "}
                {format(new Date(deal.createdAt), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
};
