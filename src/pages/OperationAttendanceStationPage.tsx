import {
  Inbox,
  LayoutGrid,
  List,
  Menu,
  MessageSquare,
  Settings2,
} from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import OperationAttendanceDetailPage from "./OperationAttendanceDetailPage";
import OperationAttendancesPage from "./OperationAttendancesPage";
import OperationAttendanceKanbanPage from "./OperationAttendanceKanbanPage";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

export default function OperationAttendanceStationPage() {
  const { attendanceId } = useParams<{ attendanceId?: string }>();
  const [searchParams] = useSearchParams();
  const { currentWorkspace } = useWorkspaceContext();
  const { isMobile, setOpenMobile } = useSidebar();
  const isKanbanView = !attendanceId && searchParams.get("view") === "kanban";

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
          <Inbox className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              Atendimentos
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {currentWorkspace?.name || "Workspace operacional"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border bg-muted/30 p-1">
            <Link
              to="/operation/attendances"
              aria-label="Abrir caixa de entrada de atendimentos"
              aria-current={!isKanbanView ? "page" : undefined}
              className={cn(
                buttonVariants({
                  variant: !isKanbanView ? "secondary" : "ghost",
                  size: "sm",
                }),
                "h-8 gap-2 px-2.5",
              )}
            >
              <List className="h-4 w-4" />
              <span className="hidden md:inline">Caixa de entrada</span>
            </Link>
            <Link
              to="/operation/attendances?view=kanban"
              aria-label="Abrir quadro (Kanban) de atendimentos"
              aria-current={isKanbanView ? "page" : undefined}
              className={cn(
                buttonVariants({
                  variant: isKanbanView ? "secondary" : "ghost",
                  size: "sm",
                }),
                "h-8 gap-2 px-2.5",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden md:inline">Quadro</span>
            </Link>
          </div>
          <Link
            to="/operation"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}
          >
            <Settings2 className="h-4 w-4" />
            <span className="hidden md:inline">Configurações</span>
          </Link>
        </div>
      </header>

      {isKanbanView ? (
        <OperationAttendanceKanbanPage />
      ) : (
        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(22rem,27rem)_minmax(0,1fr)]">
          <div
            className={cn(
              "min-h-0 min-w-0 overflow-hidden bg-card",
              attendanceId ? "hidden lg:block" : "block",
            )}
          >
            <OperationAttendancesPage
              embedded
              realtimeEnabled={!attendanceId}
            />
          </div>

          <div
            className={cn(
              "min-h-0 min-w-0 overflow-hidden bg-background",
              attendanceId ? "block" : "hidden lg:block",
            )}
          >
            {attendanceId ? (
              <OperationAttendanceDetailPage realtimeEnabled embedded />
            ) : (
              <EmptyStationDetail />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function EmptyStationDetail() {
  return (
    <Card className="h-full min-h-[32rem] rounded-none border-0 shadow-none">
      <CardContent className="flex h-full min-h-[32rem] items-center justify-center bg-muted/10 p-8">
        <div className="max-w-md rounded-lg border bg-card p-6 shadow-sm">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h2 className="mt-4 text-lg font-semibold">Escolha um atendimento</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Use os estados da fila para encontrar o próximo contato. Ao abrir uma
            conversa, as ações disponíveis aparecem junto ao cabeçalho.
          </p>
          <ol className="mt-5 space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="font-semibold text-primary">1</span>
              <span>Priorize mensagens novas e atendimentos sem responsável.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-primary">2</span>
              <span>Abra a conversa para consultar o histórico e responder.</span>
            </li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
