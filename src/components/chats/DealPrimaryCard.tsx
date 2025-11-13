import React from "react";
import { DollarSign, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerDealApiResponse } from "@/services/deal/getCustomerDeals";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DealPrimaryCardProps {
  deal: CustomerDealApiResponse;
}

const DealPrimaryCardComponent: React.FC<DealPrimaryCardProps> = ({ deal }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "WON":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "LOST":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "OPEN":
        return "Em andamento";
      case "WON":
        return "Ganho";
      case "LOST":
        return "Perdido";
      default:
        return status;
    }
  };

  return (
    <Card className="border-primary/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{deal.title}</CardTitle>
            <Badge variant="outline" className="text-xs">
              Principal
            </Badge>
          </div>
          <CardDescription className="text-xs">
            {deal.pipeline?.name || "Pipeline"}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        {deal.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {deal.description}
          </p>
        )}

        {/* Stage */}
        {deal.currentStage && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "#3b82f6" }}
              />
              <span className="font-medium">{deal.currentStage.name}</span>
            </div>
          </div>
        )}

        {/* Value */}
        {deal.value !== null && deal.value !== undefined && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-green-600">
              {formatCurrency(deal.value)}
            </span>
          </div>
        )}

        {/* Expected Close Date */}
        {/* {deal.expectedCloseDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Previsão:{" "}
              {format(new Date(deal.expectedCloseDate), "dd/MM/yyyy", {
                locale: ptBR,
              })}
            </span>
          </div>
        )} */}

        {/* Assigned To */}
        {deal.assignedUser && (
          <div className="text-xs text-muted-foreground">
            Responsável: {deal.assignedUser.name}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const DealPrimaryCard = React.memo(DealPrimaryCardComponent);
