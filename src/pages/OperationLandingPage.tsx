import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";

export default function OperationLandingPage() {
  const { currentWorkspace } = useWorkspaceContext();

  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center p-6">
      <div className="w-full rounded-xl border bg-card p-8 text-center shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">
          Workspace de operação
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {currentWorkspace?.name || "Operação"}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Este workspace está pronto para os módulos operacionais. A estrutura
          de áreas, filas e atendimentos será disponibilizada na etapa E2.
        </p>
      </div>
    </section>
  );
}
