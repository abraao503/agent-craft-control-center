import { Inbox, MessageSquare } from "lucide-react";
import { useParams } from "react-router-dom";
import OperationAttendanceDetailPage from "./OperationAttendanceDetailPage";
import OperationAttendancesPage from "./OperationAttendancesPage";
import { Card, CardContent } from "@/components/ui/card";

export default function OperationAttendanceStationPage() {
  const { attendanceId } = useParams<{ attendanceId?: string }>();

  return (
    <section className="mx-auto flex w-full max-w-[1800px] flex-col gap-4">
      <div className="rounded-lg border bg-muted/20 px-4 py-3 lg:px-5">
        <div className="flex items-center gap-3">
          <Inbox className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">Estação de atendimentos</p>
            <p className="text-xs text-muted-foreground">
              Acompanhe as filas e opere uma conversa no mesmo contexto de workspace.
            </p>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(22rem,0.9fr)_minmax(0,1.6fr)] xl:gap-6">
        <div className={attendanceId ? "hidden min-w-0 lg:block" : "min-w-0"}>
          <OperationAttendancesPage
            embedded
            realtimeEnabled={!attendanceId}
          />
        </div>

        <div className={attendanceId ? "min-w-0" : "hidden min-w-0 lg:block"}>
          {attendanceId ? (
            <OperationAttendanceDetailPage realtimeEnabled />
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
    <Card className="min-h-[32rem]">
      <CardContent className="flex h-full min-h-[32rem] flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <MessageSquare className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-semibold">Selecione um atendimento</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Escolha uma conversa na lista para abrir mensagens, ações e a timeline
            do ciclo operacional.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
