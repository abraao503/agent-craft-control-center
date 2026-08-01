import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  ResponsiveGridLayout,
  useContainerWidth,
  verticalCompactor,
} from "react-grid-layout";
import type { LayoutItem, Layout, ResponsiveLayouts } from "react-grid-layout";
import { Button } from "@/components/ui/button";
import { Loader2, Settings2 } from "lucide-react";
import { useAuth } from "@/contexts/auth/hooks";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import {
  useDashboardV2,
  useSaveDashboardConfig,
  useResetDashboardConfig,
} from "@/hooks/useDashboardV2";
import { WidgetRenderer } from "@/components/dashboard-v2/widgets";
import { PeriodSelector } from "@/components/dashboard-v2/PeriodSelector";
import { CustomizerDialog } from "@/components/dashboard-v2/CustomizerDialog";
import { DashboardEmptyState } from "@/components/dashboard-v2/DashboardEmptyState";
import { PeriodPreset, WidgetLayout, WidgetType } from "@/types/dashboard-v2";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "@/components/dashboard-v2/dashboard-v2.css";

// ============================================================
// Restrições por tipo de widget (estilo widgets Android)
// Cada tipo tem tamanho min/max fixo e pode ou não ser redimensionável
// ============================================================
interface WidgetConstraints {
  minW: number;
  maxW: number;
  minH: number;
  maxH: number;
  isResizable: boolean;
}

const WIDGET_CONSTRAINTS: Record<WidgetType, WidgetConstraints> = {
  kpi_card: { minW: 2, maxW: 12, minH: 2, maxH: 4, isResizable: true },
  progress_bar: { minW: 3, maxW: 12, minH: 2, maxH: 4, isResizable: true },
  chart_donut: { minW: 3, maxW: 12, minH: 4, maxH: 8, isResizable: true },
  chart_bar: { minW: 4, maxW: 12, minH: 4, maxH: 8, isResizable: true },
  chart_line: { minW: 4, maxW: 12, minH: 4, maxH: 8, isResizable: true },
  funnel: { minW: 4, maxW: 12, minH: 5, maxH: 12, isResizable: true },
  table: { minW: 4, maxW: 12, minH: 4, maxH: 12, isResizable: true },
};

/** Aplica constraints do tipo de widget ao layout item, clampando w/h nos limites */
function applyConstraints(
  item: { i: string; x: number; y: number; w: number; h: number },
  widgetType: WidgetType | undefined,
): LayoutItem {
  const c = widgetType ? WIDGET_CONSTRAINTS[widgetType] : undefined;
  const minW = c?.minW ?? 2;
  const maxW = c?.maxW ?? 12;
  const minH = c?.minH ?? 2;
  const maxH = c?.maxH ?? 8;
  return {
    ...item,
    w: Math.max(minW, Math.min(item.w, maxW)),
    h: Math.max(minH, Math.min(item.h, maxH)),
    minW,
    maxW,
    minH,
    maxH,
    isResizable: c?.isResizable ?? true,
  } as LayoutItem;
}

// ============================================================
// Breakpoints
// ============================================================
const BREAKPOINTS = { xl: 1400, lg: 1200, md: 996, sm: 768 };
const COLS = { xl: 12, lg: 12, md: 12, sm: 6 };

export default function DashboardV2Page() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspaceContext();
  const [period, setPeriod] = useState<PeriodPreset>("last_30_days");
  const [customizerOpen, setCustomizerOpen] = useState(false);

  // Monta o grid apenas após medir o container. Renderizá-lo com uma largura
  // inicial fixa faz o RGL escolher um breakpoint/layout transitório e deixa
  // espaço em branco quando a largura real é maior.
  const { width, containerRef, mounted } = useContainerWidth({
    measureBeforeMount: true,
  });

  const {
    activeWidgets,
    indicatorsData,
    catalogData,
    isLoading,
    indicatorsLoading,
    getIndicatorName,
    getWidgetType,
  } = useDashboardV2(period);

  const saveLayoutMutation = useSaveDashboardConfig({ hideToast: true });
  const saveCustomizerMutation = useSaveDashboardConfig();
  const resetMutation = useResetDashboardConfig();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Converte widgets para layout do react-grid-layout com constraints
  const gridLayouts = useMemo((): ResponsiveLayouts<string> => {
    const getType = (id: string) => getWidgetType(id);

    // xl, lg e md: 12 colunas (layout original)
    const baseLayout: LayoutItem[] = activeWidgets.map((w) =>
      applyConstraints(
        { i: w.indicatorId, x: w.x, y: w.y, w: w.w, h: w.h },
        getType(w.indicatorId),
      ),
    );

    // sm: empilha verticalmente em 6 colunas
    const sm: LayoutItem[] = activeWidgets.map((w, idx) =>
      applyConstraints(
        { i: w.indicatorId, x: 0, y: idx * w.h, w: 6, h: w.h },
        getType(w.indicatorId),
      ),
    );

    return { xl: baseLayout, lg: baseLayout, md: baseLayout, sm };
  }, [activeWidgets, getWidgetType]);

  // Quando o user arrasta/redimensiona widgets (v2 callback signature)
  const handleLayoutChange = useCallback(
    (layout: Layout) => {
      const updatedWidgets: WidgetLayout[] = (
        layout as readonly LayoutItem[]
      ).map((l) => {
        const existing = activeWidgets.find((w) => w.indicatorId === l.i);
        return {
          indicatorId: l.i,
          x: l.x,
          y: l.y,
          w: l.w,
          h: l.h,
          visible: true,
          config: existing?.config,
        };
      });
      // Avoid saving the layout on initial render or if nothing actually changed
      const hasChanges =
        activeWidgets.length !== updatedWidgets.length ||
        activeWidgets.some((aw) => {
          const nw = updatedWidgets.find(
            (uw) => uw.indicatorId === aw.indicatorId,
          );
          if (!nw) return true;
          return (
            nw.x !== aw.x || nw.y !== aw.y || nw.w !== aw.w || nw.h !== aw.h
          );
        });

      if (!hasChanges) return;

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      if (!isDraggingRef.current) {
        saveTimeoutRef.current = setTimeout(() => {
          saveLayoutMutation.mutate({
            workspaceId: currentWorkspace?.id,
            layout: { widgets: updatedWidgets },
          });
        }, 1400);
      }
    },
    [activeWidgets, currentWorkspace?.id, saveLayoutMutation],
  );

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  }, []);

  const handleDragStop = useCallback(
    (layout: Layout) => {
      isDraggingRef.current = false;
      handleLayoutChange(layout);
    },
    [handleLayoutChange],
  );

  // Salvar do customizer
  const handleCustomizerSave = useCallback(
    (widgets: WidgetLayout[]) => {
      saveCustomizerMutation.mutate({
        workspaceId: currentWorkspace?.id,
        layout: { widgets },
      });
    },
    [currentWorkspace?.id, saveCustomizerMutation],
  );

  // Reset
  const handleReset = useCallback(() => {
    resetMutation.mutate();
  }, [resetMutation]);

  // Subtítulo por role
  const subtitle = useMemo(() => {
    const role = user?.role;
    if (role === "PLATFORM_ADMIN") return "Visão geral da plataforma";
    if (role === "COMPANY_OWNER" || role === "COMPANY_ADMIN")
      return "Visão geral da empresa";
    if (
      role === "WORKSPACE_MANAGER" ||
      role === "WORKSPACE_ADMIN" ||
      role === "WORKSPACE_OWNER"
    )
      return "Visão geral do workspace";
    return "Seus indicadores de vendas";
  }, [user?.role]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasWidgets = activeWidgets.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {saveLayoutMutation.isPending && (
            <div className="flex items-center gap-2 mr-2 text-sm text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-md animate-in fade-in zoom-in duration-200">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Salvando layout...</span>
            </div>
          )}
          <PeriodSelector value={period} onChange={setPeriod} />
          <Button
            variant="default"
            size="sm"
            className="gap-2"
            onClick={() => setCustomizerOpen(true)}
          >
            <Settings2 className="h-4 w-4" />
            Personalizar
          </Button>
        </div>
      </div>

      {/* Grid de widgets — ref para medir largura */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <div ref={containerRef as any} className="w-full">
        {hasWidgets && mounted ? (
          <ResponsiveGridLayout
            className="dashboard-grid"
            width={width}
            layouts={gridLayouts}
            breakpoints={BREAKPOINTS}
            cols={COLS}
            rowHeight={50}
            compactor={verticalCompactor}
            dragConfig={{ enabled: true, handle: ".drag-handle", threshold: 5 }}
            resizeConfig={{ enabled: true, handles: ["se"] }}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            onDragStart={handleDragStart}
            onDragStop={handleDragStop}
            onResizeStart={handleDragStart}
            onResizeStop={handleDragStop}
          >
            {activeWidgets.map((widget) => (
              <div key={widget.indicatorId} className="group relative">
                {/* Drag handle invisível no topo — pointer-events-none por padrão para não bloquear scroll */}
                <div className="drag-handle absolute top-0 left-0 right-0 h-8 cursor-grab active:cursor-grabbing z-10 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
                  <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-1 rounded-full bg-muted-foreground/30" />
                  </div>
                </div>
                <WidgetRenderer
                  indicatorId={widget.indicatorId}
                  indicatorName={getIndicatorName(widget.indicatorId)}
                  widgetType={getWidgetType(widget.indicatorId)}
                  data={indicatorsData[widget.indicatorId]}
                  isLoading={indicatorsLoading}
                />
              </div>
            ))}
          </ResponsiveGridLayout>
        ) : !hasWidgets ? (
          <DashboardEmptyState />
        ) : null}
      </div>

      {/* Customizer Dialog */}
      {catalogData && (
        <CustomizerDialog
          open={customizerOpen}
          onOpenChange={setCustomizerOpen}
          categories={catalogData.categories}
          currentWidgets={activeWidgets}
          onSave={handleCustomizerSave}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
