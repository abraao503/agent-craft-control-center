
import React from "react";
import { format } from "date-fns";
import { ConversationMessage as IConversationMessage } from "@/types/conversation";

type Props = {
  message: IConversationMessage;
};

export const ConversationMessage: React.FC<Props> = ({ message }) => {
  const isCustomer = message.sender === "customer";
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "HH:mm");
  };

  return (
    <div
      className={`flex mb-4 ${isCustomer ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isCustomer
            ? "bg-primary text-primary-foreground"
            : message.sender === "human-attendant"
            ? "bg-yellow-100 border border-yellow-300 text-yellow-800"
            : "bg-muted"
        }`}
      >
        <div className="text-sm font-medium">
          {isCustomer
            ? "Cliente"
            : message.sender === "human-attendant"
            ? "Atendente Humano"
            : "Agente IA"}
          <span className="text-xs font-normal ml-2 opacity-75">
            {formatDate(message.timestamp)}
          </span>
        </div>
        <p className="mt-1">{message.content}</p>
      </div>
    </div>
  );
};
