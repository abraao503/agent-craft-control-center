import type { WhatsappMessageReactionSummary } from "@/types/message";

interface MessageReactionsProps {
  reactions?: WhatsappMessageReactionSummary[];
  align: "start" | "end";
}

export function MessageReactions({ reactions, align }: MessageReactionsProps) {
  const visibleReactions = reactions?.filter(
    (reaction) => reaction.emoji.trim().length > 0 && reaction.count > 0,
  );

  if (!visibleReactions?.length) return null;

  return (
    <div
      className={`relative z-10 -mt-3 flex flex-wrap gap-1 ${align === "end" ? "justify-end" : "justify-start"}`}
      role="list"
      aria-label="Reações à mensagem"
    >
      {visibleReactions.map((reaction) => (
        <span
          key={reaction.emoji}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs text-foreground shadow-sm"
          role="listitem"
          aria-label={`${reaction.count} ${reaction.count === 1 ? "reação" : "reações"} ${reaction.emoji}`}
        >
          <span aria-hidden="true">{reaction.emoji}</span>
          {reaction.count > 1 ? (
            <span className="tabular-nums">{reaction.count}</span>
          ) : null}
        </span>
      ))}
    </div>
  );
}
