import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  ChevronDown,
  ChevronUp,
  GripVertical,
  RotateCcw,
  LayoutDashboard,
} from "lucide-react";
import {
  CatalogCategory,
  CatalogIndicator,
  WidgetLayout,
} from "@/types/dashboard-v2";
import { useTranslation } from "react-i18next";

interface CustomizerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CatalogCategory[];
  currentWidgets: WidgetLayout[];
  onSave: (widgets: WidgetLayout[]) => void;
  onReset: () => void;
}

const WIDGET_TYPE_LABELS: Record<string, string> = {
  kpi_card: "KPI CARD",
  chart_bar: "BAR CHART",
  chart_line: "LINE CHART",
  chart_donut: "DONUT CHART",
  funnel: "FUNNEL",
  table: "TABLE",
  progress_bar: "PROGRESS",
};

const PRIORITY_COLORS: Record<string, string> = {
  primary: "bg-primary/20 text-primary",
  secondary: "bg-muted text-muted-foreground",
};

export function CustomizerDialog({
  open,
  onOpenChange,
  categories,
  currentWidgets,
  onSave,
  onReset,
}: CustomizerDialogProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(currentWidgets.map((w) => w.indicatorId));
  });
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    () => new Set(categories.slice(0, 1).map((c) => c.id)),
  );

  // Quando o dialog abre, sincroniza com widgets atuais
  const handleOpenChange = (value: boolean) => {
    if (value) {
      setSelectedIds(new Set(currentWidgets.map((w) => w.indicatorId)));
    }
    onOpenChange(value);
  };

  // Filtrar por busca
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;

    const term = search.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        indicators: cat.indicators.filter(
          (ind) =>
            ind.name.toLowerCase().includes(term) ||
            ind.description.toLowerCase().includes(term) ||
            cat.name.toLowerCase().includes(term),
        ),
      }))
      .filter((cat) => cat.indicators.length > 0);
  }, [categories, search]);

  const toggleIndicator = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCategory = (catId: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  const handleSave = () => {
    // Gera layout automático para os indicadores selecionados
    const widgets: WidgetLayout[] = [];
    let y = 0;
    let x = 0;

    // Mantém posições de widgets existentes
    const existingMap = new Map(currentWidgets.map((w) => [w.indicatorId, w]));

    // Catalogo flat para lookup
    const allIndicators = new Map<string, CatalogIndicator>();
    for (const cat of categories) {
      for (const ind of cat.indicators) {
        allIndicators.set(ind.id, ind);
      }
    }

    for (const id of selectedIds) {
      const existing = existingMap.get(id);
      const indicator = allIndicators.get(id);

      if (existing) {
        widgets.push({ ...existing, visible: true });
      } else {
        // Determina tamanho baseado no tipo de widget
        const wType = indicator?.widgetType ?? "kpi_card";
        let w = 3;
        let h = 2;

        if (
          wType === "chart_donut" ||
          wType === "chart_bar" ||
          wType === "funnel" ||
          wType === "table"
        ) {
          w = 6;
          h = 4;
        } else if (wType === "chart_line") {
          w = 6;
          h = 4;
        }

        if (x + w > 12) {
          x = 0;
          y += h;
        }

        widgets.push({
          indicatorId: id,
          x,
          y,
          w,
          h,
          visible: true,
        });

        x += w;
        if (x >= 12) {
          x = 0;
          y += h;
        }
      }
    }

    onSave(widgets);
    onOpenChange(false);
  };

  const handleReset = () => {
    onReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            {t("dashboard.customizeDashboard")}
          </DialogTitle>
        </DialogHeader>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("dashboard.searchIndicator")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de categorias */}
        <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
          <div className="space-y-1">
            {filteredCategories.map((category) => {
              const isOpen = openCategories.has(category.id);
              const selectedCount = category.indicators.filter((ind) =>
                selectedIds.has(ind.id),
              ).length;

              return (
                <Collapsible
                  key={category.id}
                  open={isOpen}
                  onOpenChange={() => toggleCategory(category.id)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {category.name}
                      </span>
                      {selectedCount > 0 && (
                        <Badge variant="secondary" className="h-5 text-[10px]">
                          {selectedCount}
                        </Badge>
                      )}
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2 pb-2 mt-2">
                      {category.indicators.map((indicator) => (
                        <IndicatorItem
                          key={indicator.id}
                          indicator={indicator}
                          checked={selectedIds.has(indicator.id)}
                          onToggle={() => toggleIndicator(indicator.id)}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1 text-muted-foreground"
          >
            <RotateCcw className="h-3 w-3" />
              {t("dashboard.resetWidgets")}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave}>{t("common.saveChanges")}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Item de indicador ----
function IndicatorItem({
  indicator,
  checked,
  onToggle,
}: {
  indicator: CatalogIndicator;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${
        checked
          ? "bg-primary/5 border border-primary/20"
          : "hover:bg-muted/50 border border-transparent"
      }`}
      onClick={onToggle}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={() => onToggle()}
        className="pointer-events-none"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{indicator.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 h-4 uppercase"
          >
            {WIDGET_TYPE_LABELS[indicator.widgetType] ?? indicator.widgetType}
          </Badge>
          <Badge
            variant="secondary"
            className={`text-[9px] px-1.5 py-0 h-4 uppercase ${
              PRIORITY_COLORS[indicator.priority]
            }`}
          >
            {indicator.priority}
          </Badge>
        </div>
      </div>
      <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
    </div>
  );
}
