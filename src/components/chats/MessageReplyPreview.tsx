import type { MessageReplyContext } from "@/types/message";

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
}: {
  replyContext?: MessageReplyContext;
}) {
  if (!replyContext) return null;

  const preview =
    replyContext.status === "available"
      ? replyContext.message.preview || "Mensagem"
      : "Mensagem original indisponível";

  return (
    <div className="-mx-3 mt-0.5 mb-2 flex w-[calc(100%+1.5rem)] min-w-[220px] max-w-[calc(100vw-2rem)] items-center rounded-md border-l-4 border-primary bg-[#f7f7f7] px-2.5 py-1.5 text-foreground dark:bg-[#202c33]">
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-xs font-semibold text-muted-foreground">
          {getAuthorLabel(replyContext)}
        </p>
        <p className="truncate text-sm text-muted-foreground">{preview}</p>
      </div>
    </div>
  );
}
