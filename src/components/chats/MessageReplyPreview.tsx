import type { MessageReplyContext } from "@/types/message";
import { Loader2 } from "lucide-react";
import type { QuotedNavigationState } from "@/utils/quoted-message-navigation";

function getAuthorLabel(replyContext: MessageReplyContext) {
  if (!replyContext || replyContext.status === "unavailable") {
    return "Mensagem original";
  }

  if (replyContext.message.author.name) {
    return replyContext.message.author.name;
  }

  switch (replyContext.message.author.type) {
    case "CUSTOMER":
      return "Cliente";
    case "ASSISTANT":
      return "IA";
    default:
      return "Atendente";
  }
}

export function MessageReplyPreview({
  replyContext,
  onNavigate,
  navigationState,
}: {
  replyContext?: MessageReplyContext;
  onNavigate?: (messageId: string) => void;
  navigationState?: QuotedNavigationState;
}) {
  if (!replyContext) return null;

  const preview =
    replyContext.status === "available"
      ? replyContext.message.preview || "Mensagem"
      : "Mensagem original indisponível";

  const isAvailable = replyContext.status === "available";
  const isLoading = navigationState?.status === "loading";
  const hasError = navigationState?.status === "error";
  const previewContent = (
    <>
      <div className="min-w-0 flex-1 text-left leading-tight">
        <p className="truncate text-xs font-semibold text-muted-foreground">
          {getAuthorLabel(replyContext)}
        </p>
        <p className="truncate text-sm text-muted-foreground">{preview}</p>
      </div>
      {isLoading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" /> : null}
    </>
  );

  return (
    <div className="-mx-3 mt-0.5 mb-2 w-[calc(100%+1.5rem)] min-w-[220px] max-w-[calc(100vw-2rem)] text-foreground">
      {isAvailable && onNavigate ? (
        <button
          type="button"
          className="flex w-full items-center rounded-md border-l-4 border-primary bg-[#f7f7f7] px-2.5 py-1.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-[#202c33]"
          onClick={() => onNavigate(replyContext.message.id)}
          disabled={isLoading}
          aria-label="Ir para a mensagem respondida"
          aria-busy={isLoading}
        >
          {previewContent}
        </button>
      ) : (
        <div className="flex items-center rounded-md border-l-4 border-primary bg-[#f7f7f7] px-2.5 py-1.5 dark:bg-[#202c33]">
          {previewContent}
        </div>
      )}
      {hasError ? (
        <p className="mt-1 text-xs text-destructive" role="status">
          {navigationState?.errorMessage}
        </p>
      ) : null}
    </div>
  );
}
