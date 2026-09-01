import { ArrowRight, Inbox, Menu, MessageSquare, Settings2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import OperationAttendanceDetailPage from "./OperationAttendanceDetailPage";
import OperationAttendancesPage from "./OperationAttendancesPage";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

export default function OperationAttendanceStationPage() {
  const { attendanceId } = useParams<{ attendanceId?: string }>();
  const { currentWorkspace } = useWorkspaceContext();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-slate-50/70 dark:bg-background">
      <header className="flex shrink-0 items-center justify-between border-b bg-card px-4 py-3 lg:px-5">
        <div className="flex min-w-0 items-center gap-3">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="-ml-2 h-9 w-9 shrink-0"
              onClick={() => setOpenMobile(true)}
              aria-label="Abrir navegação"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Inbox className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              Central de atendimentos
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {currentWorkspace?.name || "Workspace operacional"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Operação online
          </span>
          <Link
            to="/operation"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}
          >
            <Settings2 className="h-4 w-4" />
            <span className="hidden md:inline">Configurar</span>
            <ArrowRight className="hidden h-3.5 w-3.5 md:inline" />
          </Link>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]">
        <div className={cn(
          "min-h-0 min-w-0 overflow-hidden bg-card",
          attendanceId ? "hidden lg:block" : "block",
        )}>
          <OperationAttendancesPage
            embedded
            realtimeEnabled={!attendanceId}
          />
        </div>

        <div className={cn(
          "min-h-0 min-w-0 overflow-hidden bg-background",
          attendanceId ? "block" : "hidden lg:block",
        )}>
          {attendanceId ? (
            <OperationAttendanceDetailPage realtimeEnabled embedded />
          ) : (
            <EmptyStationDetail />
          )}
        </div>
      </div>
    </section>
  );
}

function EmptyStationDetail() {
  return (
    <Card className="h-full min-h-[32rem] rounded-none border-0 shadow-none">
      <CardContent className="flex h-full min-h-[32rem] flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.08),transparent_42%)] p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
          <MessageSquare className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Tudo pronto para atender</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            Selecione uma conversa na fila para abrir mensagens, ações e o contexto
            completo do atendimento.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
