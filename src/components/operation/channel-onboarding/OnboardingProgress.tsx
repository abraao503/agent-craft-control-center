import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type OnboardingStage = "channel" | "destination" | "connection";

const STAGES: Array<{
  key: OnboardingStage;
  label: string;
  description: string;
}> = [
  { key: "channel", label: "Canal", description: "Provedor e identificação" },
  { key: "destination", label: "Destino", description: "Encaminhamento" },
  { key: "connection", label: "Conexão", description: "Ativação e conclusão" },
];

export function OnboardingProgress({ stage }: { stage: OnboardingStage }) {
  const currentIndex = STAGES.findIndex((item) => item.key === stage);

  return (
    <ol className="grid grid-cols-3 rounded-lg border bg-muted/20 p-1" aria-label="Progresso da configuração">
      {STAGES.map((item, index) => {
        const complete = index < currentIndex;
        const current = index === currentIndex;
        return (
          <li
            key={item.key}
            aria-current={current ? "step" : undefined}
            className={cn(
              "flex min-w-0 items-center gap-2 rounded-md px-2 py-2 sm:px-3",
              current && "bg-background shadow-sm",
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                complete && "border-emerald-500 bg-emerald-500 text-white",
                current && "border-primary bg-primary text-primary-foreground",
                !complete && !current && "text-muted-foreground",
              )}
            >
              {complete ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span className="min-w-0">
              <span className={cn("block truncate text-xs font-medium", !current && !complete && "text-muted-foreground")}>
                {item.label}
              </span>
              <span className="hidden truncate text-[11px] text-muted-foreground sm:block">
                {item.description}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
