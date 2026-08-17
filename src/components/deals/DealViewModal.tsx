import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PhoneInput, PhoneDisplay } from "@/components/ui/phone-input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Save,
  Trash2,
  History,
  GripVertical,
  MoreVertical,
  Edit2,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  Loader2,
  X,
  Bot,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DealListItem, DealNote, LeadAttributionSummary } from "@/types/deal";
import {
  StageFormField,
  FieldType,
  DocumentType,
} from "@/types/stage-form-field";
import { PipelineStageMinimal } from "@/types/pipeline";
import { getDealById } from "@/services/deal/getDealById";
import { getDealFormFields } from "@/services/deal/getDealFormFields";
import { saveDealFormValues } from "@/services/deal/saveDealFormValues";
import { getStageFormFieldHistory } from "@/services/stage-form-field/getStageFormFieldHistory";
import { listStageFormFields } from "@/services/stage-form-field/listStageFormFields";
import { createStageFormField } from "@/services/stage-form-field/createStageFormField";
import { deleteStageFormField } from "@/services/stage-form-field/deleteStageFormField";
import { getDealNotes } from "@/services/deal/getDealNotes";
import { createDealNote } from "@/services/deal/createDealNote";
import { useToast } from "@/components/ui/use-toast";
import { listPipelineStages } from "@/services/pipeline/listPipelineStages";
import { moveDealStage } from "@/services/deal/moveDealStage";
import { formatDistanceToNow, format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SelectFieldTypeModal } from "./SelectFieldTypeModal";
import { CreateFieldModal } from "./CreateFieldModal";
import { EditFieldModal } from "./EditFieldModal";
import { TagsSelector } from "@/components/tags/TagsSelector";
import { UserSelector } from "./UserSelector";
import { updateStageFormField } from "@/services/stage-form-field/updateStageFormField";
import { updateDeal } from "@/services/deal/updateDeal";
import { updateDealTags } from "@/services/deal/updateDealTags";
import { assignUserToDeal } from "@/services/deal/assignUserToDeal";
import { deleteDeal } from "@/services/deal/deleteDeal";
import { listTags } from "@/services/tag/listTags";
import { updateCustomerPhone } from "@/services/customer/updateCustomerPhone";
import {
  formatCPF,
  formatCNPJ,
  isValidCPF,
  isValidCNPJ,
} from "@brazilian-utils/brazilian-utils";
import { AxiosError } from "axios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePermissions } from "@/hooks/usePermissions";
import { DealFollowUpListDialog } from "./follow-up/DealFollowUpListDialog";
import { getDealAttributions } from "@/services/deal/getDealAttributions";
import {
  formatAttributionChannel,
  formatAttributionEnrichmentState,
  formatAttributionOrigin,
  formatAttributionSourceLabel,
  isAttributionConfigurationIssue,
} from "@/utils/deal-attribution";

// Utility functions for datetime conversion
// Converts UTC datetime to local datetime-local input format
const utcToLocalDatetimeString = (utcDateString: string): string => {
  if (!utcDateString) return "";
  const date = new Date(utcDateString);
  // Get local datetime in format YYYY-MM-DDTHH:mm
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Converts local datetime-local input value to UTC ISO string
const localDatetimeStringToUTC = (localDatetimeString: string): string => {
  if (!localDatetimeString) return "";
  // Create date from local datetime string (browser interprets as local time)
  const date = new Date(localDatetimeString);
  // Return ISO string (which is in UTC)
  return date.toISOString();
};

// Formats datetime field value for display (converts UTC to local formatted string)
const formatDatetimeForDisplay = (
  utcDateString: string,
  fieldType: FieldType,
): string => {
  if (!utcDateString) return "";
  const date = new Date(utcDateString);

  if (fieldType === "date") {
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  }

  if (fieldType === "datetime" || fieldType === "due_date") {
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  }

  return utcDateString;
};

interface DealViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: DealListItem | null;
  workspaceId: string;
  pipelineId?: string; // Optional pipeline ID to fetch stages
}

const attributionValue = (
  name: string | null | undefined,
  id: string | null | undefined,
) => name || id || "Não informado";

const AttributionDetails: React.FC<{
  attribution: LeadAttributionSummary;
  title: string;
  canAccessIntegrations: boolean;
}> = ({ attribution, title, canAccessIntegrations }) => {
  const sourceUrl = (() => {
    if (!attribution.sourceUrl) return null;
    try {
      const url = new URL(attribution.sourceUrl);
      return /^https?:$/.test(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  })();

  return (
    <div className="rounded-md border p-3 space-y-3">
      <div>
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="font-medium">{formatAttributionOrigin(attribution)}</p>
        <p className="text-xs text-muted-foreground">
          {formatAttributionSourceLabel(attribution.sourceType)} ·{" "}
          {new Date(attribution.attributedAt).toLocaleString("pt-BR")}
        </p>
      </div>

      <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-xs">
        <dt className="text-muted-foreground">Canal/plataforma</dt>
        <dd>{formatAttributionChannel(attribution)} · Meta</dd>
        <dt className="text-muted-foreground">Campanha</dt>
        <dd>
          {attributionValue(attribution.campaignName, attribution.campaignId)}
        </dd>
        <dt className="text-muted-foreground">Conjunto</dt>
        <dd>{attributionValue(attribution.adSetName, attribution.adSetId)}</dd>
        <dt className="text-muted-foreground">Anúncio</dt>
        <dd>{attributionValue(attribution.adName, attribution.adId)}</dd>
        <dt className="text-muted-foreground">Formulário</dt>
        <dd>{attributionValue(attribution.formName, attribution.formId)}</dd>
        <dt className="text-muted-foreground">Página</dt>
        <dd>{attributionValue(attribution.pageName, attribution.pageId)}</dd>
        <dt className="text-muted-foreground">Estado</dt>
        <dd>{formatAttributionEnrichmentState(attribution)}</dd>
      </dl>

      {isAttributionConfigurationIssue(attribution) &&
        canAccessIntegrations && (
          <Link
            to="/integrations"
            className="inline-flex text-xs text-primary hover:underline"
          >
            Configurar integração
          </Link>
        )}

      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Abrir origem
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
};

export const DealViewModal: React.FC<DealViewModalProps> = ({
  open,
  onOpenChange,
  deal,
  workspaceId,
  pipelineId: pipelineIdProp,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { has } = usePermissions();
  const canAccessIntegrations =
    has("manage:integrations") || has("view:integrations");

  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [newNoteContent, setNewNoteContent] = useState("");
  const [showSelectTypeModal, setShowSelectTypeModal] = useState(false);
  const [showCreateFieldModal, setShowCreateFieldModal] = useState(false);
  const [showEditFieldModal, setShowEditFieldModal] = useState(false);
  const [showFollowUpListDialog, setShowFollowUpListDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState<
    FieldType | "document" | null
  >(null);
  const [editingField, setEditingField] = useState<StageFormField | null>(null);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

  // Editable deal fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState<number | undefined>(undefined);
  const [currency, setCurrency] = useState("BRL");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [assignedUserId, setAssignedUserId] = useState<string | null>(null);

  // Track which field is being saved
  const [savingField, setSavingField] = useState<string | null>(null);

  // Track fields that have been modified locally to prevent overwriting during API updates
  // Using ref to avoid triggering useEffect when modified fields change
  const modifiedFieldsRef = useRef<Set<string>>(new Set());

  // Tags management
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Fetch deal details
  const { data: dealDetails, isLoading: dealDetailsLoading } = useQuery({
    queryKey: ["getDealById", deal?.id],
    queryFn: () => getDealById(deal!.id),
    enabled: open && !!deal?.id,
  });

  // Fetch current stage form fields with values
  const { data: currentFields = [], isLoading: currentFieldsLoading } =
    useQuery({
      queryKey: ["getDealFormFields", deal?.id],
      queryFn: () => getDealFormFields(deal!.id),
      enabled: open && !!deal?.id,
    });

  // Fetch stage form field history
  const { data: fieldHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["getStageFormFieldHistory", deal?.id, deal?.stageId],
    queryFn: () => getStageFormFieldHistory(deal!.id, deal!.stageId),
    enabled: open && !!deal?.id && !!deal?.stageId,
  });

  // Fetch all fields for current stage (for adding new fields)
  const { data: stageFields = [], isLoading: stageFieldsLoading } = useQuery({
    queryKey: ["listStageFormFields", deal?.stageId],
    queryFn: () => listStageFormFields(deal!.stageId),
    enabled: open && !!deal?.stageId,
  });

  // Fetch deal notes
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["getDealNotes", deal?.id],
    queryFn: () => getDealNotes(deal!.id, { limit: 50, offset: 0 }),
    enabled: open && !!deal?.id,
  });

  const { data: attributionHistory } = useQuery({
    queryKey: ["getDealAttributions", deal?.id, workspaceId],
    queryFn: () =>
      getDealAttributions(deal!.id, { workspaceId, page: 1, limit: 50 }),
    enabled: open && !!deal?.id,
  });

  // Fetch tags
  const { data: allTags = [] } = useQuery({
    queryKey: ["tags", workspaceId],
    queryFn: () => listTags(workspaceId),
    enabled: !!workspaceId,
  });

  // Fetch pipeline stages for moving the deal between stages (if pipelineId available)
  type MaybeWithPipeline = { pipelineId?: string; pipeline?: { id?: string } };
  const pipelineId =
    pipelineIdProp ||
    ((dealDetails as MaybeWithPipeline)?.pipelineId as string | undefined) ||
    ((deal as MaybeWithPipeline)?.pipelineId as string | undefined) ||
    ((deal as MaybeWithPipeline)?.pipeline?.id as string | undefined);
  const { data: pipelineStages = [], isLoading: pipelineStagesLoading } =
    useQuery({
      queryKey: ["listPipelineStages", pipelineId, workspaceId],
      queryFn: () => {
        if (!pipelineId) throw new Error("pipelineId is required");
        return listPipelineStages(pipelineId, workspaceId);
      },
      enabled: open && !!pipelineId && !!workspaceId,
    });

  const moveDealMutation = useMutation({
    mutationFn: async (toStageId: string) => {
      if (!deal) return;
      await moveDealStage(deal.id, { workspaceId, stageId: toStageId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getDealById", deal?.id] });
      queryClient.invalidateQueries({ queryKey: ["dealsByStage"] });
      toast({ title: "Sucesso", description: "Negócio movido de etapa." });
    },
    onError: (e: unknown) => {
      if (
        e &&
        e instanceof AxiosError &&
        e?.response?.status === 422 &&
        e?.response?.data?.message
      ) {
        const errorMessage = e.response.data.message;

        // Extract field names from error message
        const match = errorMessage.match(
          /Required fields must be filled: (.+)/,
        );
        if (match) {
          const fields = match[1];
          toast({
            title: "Campos obrigatórios não preenchidos",
            description: `Preencha os seguintes campos antes de mover o negócio: ${fields}`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro de validação",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Erro",
          description: "Falha ao mover negócio.",
          variant: "destructive",
        });
      }
    },
  });

  useEffect(() => {
    console.log("DealViewModal - Debug Info:", {
      dealDetails,
      deal,
      pipelineId,
      workspaceId,
      pipelineStagesCount: pipelineStages.length,
      pipelineStagesLoading,
    });
  }, [
    dealDetails,
    deal,
    pipelineId,
    workspaceId,
    pipelineStages,
    pipelineStagesLoading,
  ]);

  useEffect(() => {
    console.log("pipelineStages", pipelineStages);
  }, [pipelineStages]);

  // Initialize field values
  useEffect(() => {
    if (currentFields.length > 0) {
      setFieldValues((prevValues) => {
        const values: Record<string, string> = {};
        currentFields.forEach((field) => {
          // Only update from API if field hasn't been modified locally
          if (modifiedFieldsRef.current.has(field.id)) {
            values[field.id] = prevValues[field.id] || "";
          } else {
            // Convert UTC to local time for datetime fields
            if (
              (field.type === "datetime" || field.type === "due_date") &&
              field.value
            ) {
              values[field.id] = utcToLocalDatetimeString(field.value);
            } else {
              values[field.id] = field.value || "";
            }
          }
        });
        return values;
      });
    }
  }, [currentFields]);

  // Initialize deal fields
  useEffect(() => {
    if (dealDetails) {
      setTitle(dealDetails.title || "");
      setDescription(dealDetails.description || "");
      setValue(dealDetails.value ?? undefined);
      setCurrency(dealDetails.currency || "BRL");
      setCustomerName(dealDetails.customer?.name || "");
      setCustomerEmail(dealDetails.customer?.email || "");
      // PhoneInput expects E.164 (+prefix); backend stores without +
      setCustomerPhone(
        dealDetails.customer?.phone ? `+${dealDetails.customer.phone}` : "",
      );
      setAssignedUserId(dealDetails.assignedUser?.id || null);
      setSelectedTagIds(dealDetails.tags || []);
    }
  }, [dealDetails]);

  // Update deal mutation
  const updateDealMutation = useMutation({
    mutationFn: async (data: {
      title?: string;
      description?: string;
      value?: number;
      currency?: string;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      fieldName?: string;
    }) => {
      if (!deal) return;
      await updateDeal(deal.id, workspaceId, {
        title: data.title?.trim() || undefined,
        description: data.description?.trim() || undefined,
        value: data.value,
        currency: data.currency,
        customer:
          data.customerName?.trim() ||
          data.customerEmail !== undefined ||
          data.customerPhone !== undefined
            ? {
                name: data.customerName?.trim() || undefined,
                email:
                  data.customerEmail !== undefined
                    ? data.customerEmail.trim()
                    : undefined,
                phone: data.customerPhone?.trim() || undefined,
              }
            : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getDealById", deal?.id] });
      // Invalidate deal listings to reflect changes in kanban
      queryClient.invalidateQueries({ queryKey: ["dealsByStage"] });
      setSavingField(null);
    },
    onError: (error: unknown, data) => {
      // Revert email to previous value if email update failed
      if (data.fieldName === "customerEmail") {
        setCustomerEmail(dealDetails?.customer?.email || "");

        let description = "Falha ao atualizar e-mail.";
        if (error instanceof AxiosError) {
          const status = error.response?.status;
          const message = error.response?.data?.message;

          if (status === 400 || message === "Invalid email format") {
            description = "Formato de e-mail inválido.";
          } else if (status === 409) {
            description = "Este e-mail já está em uso.";
          } else if (message === "Customer not found") {
            description = "Cliente não encontrado.";
          } else if (message === "Internal error") {
            description = "Erro interno. Tente novamente mais tarde.";
          }
        }

        toast({ title: "Erro", description, variant: "destructive" });
        setSavingField(null);
        return;
      }

      toast({
        title: "Erro",
        description: "Falha ao atualizar negócio.",
        variant: "destructive",
      });
      setSavingField(null);
    },
  });

  // Update customer phone mutation (dedicated route)
  const updateCustomerPhoneMutation = useMutation({
    mutationFn: async (phone: string) => {
      if (!dealDetails?.customer?.id) return;
      await updateCustomerPhone({
        customerId: dealDetails.customer.id,
        phone,
        workspaceId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getDealById", deal?.id] });
      setSavingField(null);
    },
    onError: (error: unknown) => {
      // Revert to previous value stored in dealDetails
      const previousPhone = dealDetails?.customer?.phone
        ? `+${dealDetails.customer.phone}`
        : "";
      setCustomerPhone(previousPhone);

      let description = "Falha ao atualizar telefone.";
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        const message = error.response?.data?.message;

        if (status === 400) {
          description = "Número no formato incorreto.";
        } else if (status === 409) {
          if (message === "Phone already in use") {
            description = "Este número de telefone já está em uso.";
          } else {
            description = "Conflito ao atualizar telefone.";
          }
        } else if (message === "Customer not found") {
          description = "Cliente não encontrado.";
        } else if (message === "Internal error") {
          description = "Erro interno. Tente novamente mais tarde.";
        }
      }

      toast({ title: "Erro", description, variant: "destructive" });
      setSavingField(null);
    },
  });

  // Save field values mutation
  const saveFieldValuesMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      if (!deal) return;
      // Send only the field being edited
      let value = fieldValues[fieldId];

      // Convert local datetime to UTC for datetime fields
      const field = currentFields.find((f) => f.id === fieldId);
      if (
        field &&
        (field.type === "datetime" || field.type === "due_date") &&
        value
      ) {
        value = localDatetimeStringToUTC(value);
      }

      await saveDealFormValues(deal.id, { values: [{ fieldId, value }] });
    },
    onSuccess: () => {
      // Clear modified fields after successful save
      if (savingField) {
        modifiedFieldsRef.current.delete(savingField);
      }
      queryClient.invalidateQueries({
        queryKey: ["getDealFormFields", deal?.id],
      });
      // Invalidate deal listings to reflect dueDate changes in kanban
      queryClient.invalidateQueries({ queryKey: ["dealsByStage"] });
      setSavingField(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao salvar campos.",
        variant: "destructive",
      });
      setSavingField(null);
    },
  });

  // Create field mutation
  const createFieldMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      label: string;
      description: string;
      type: FieldType;
      isRequired: boolean;
    }) => {
      if (!deal) return;
      await createStageFormField({
        ...data,
        stageId: deal.stageId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["listStageFormFields", deal?.stageId],
      });
      queryClient.invalidateQueries({
        queryKey: ["getDealFormFields", deal?.id],
      });
      setShowCreateFieldModal(false);
      setSelectedFieldType(null);
      toast({ title: "Sucesso", description: "Campo criado com sucesso." });
    },
    onError: (error: unknown) => {
      if (error instanceof AxiosError) {
        if (
          error?.response?.data?.message ===
          "Field with this name already exists in stage"
        ) {
          toast({
            title: "Erro",
            description:
              "Este nome de campo já existe. Por favor, escolha outro nome.",
            variant: "destructive",
          });

          return;
        }
      }

      toast({
        title: "Erro",
        description: "Falha ao criar campo.",
        variant: "destructive",
      });
    },
  });

  // Update field mutation
  const updateFieldMutation = useMutation({
    mutationFn: async (data: {
      fieldId: string;
      label: string;
      description: string;
      isRequired: boolean;
    }) => {
      const { fieldId, ...updateData } = data;
      await updateStageFormField(fieldId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["listStageFormFields", deal?.stageId],
      });
      queryClient.invalidateQueries({
        queryKey: ["getDealFormFields", deal?.id],
      });
      setShowEditFieldModal(false);
      setEditingField(null);
      toast({ title: "Sucesso", description: "Campo atualizado com sucesso." });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar campo.",
        variant: "destructive",
      });
    },
  });

  // Delete field mutation
  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      await deleteStageFormField(fieldId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["listStageFormFields", deal?.stageId],
      });
      queryClient.invalidateQueries({
        queryKey: ["getDealFormFields", deal?.id],
      });
      toast({ title: "Sucesso", description: "Campo removido com sucesso." });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao remover campo.",
        variant: "destructive",
      });
    },
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async () => {
      if (!deal || !newNoteContent.trim()) return;
      await createDealNote({
        dealId: deal.id,
        content: newNoteContent.trim(),
      });
    },
    onSuccess: () => {
      setNewNoteContent("");
      queryClient.invalidateQueries({ queryKey: ["getDealNotes", deal?.id] });
      toast({ title: "Sucesso", description: "Nota adicionada." });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao adicionar nota.",
        variant: "destructive",
      });
    },
  });

  // Update tags mutation
  const updateTagsMutation = useMutation({
    mutationFn: async (tagIds: string[]) => {
      if (!deal) return;
      await updateDealTags(deal.id, workspaceId, { tagIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getDealById", deal?.id] });
      queryClient.invalidateQueries({ queryKey: ["listDealsByPipeline"] });
      toast({ title: "Sucesso", description: "Tags atualizadas." });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar tags.",
        variant: "destructive",
      });
    },
  });

  // Assign user mutation
  const assignUserMutation = useMutation({
    mutationFn: async (userId: string | null) => {
      if (!deal || !userId) return;
      await assignUserToDeal(deal.id, { workspaceId, userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getDealById", deal?.id] });
      queryClient.invalidateQueries({ queryKey: ["dealsByStage"] });
      toast({
        title: "Sucesso",
        description: "Usuário atribuído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atribuir usuário.",
        variant: "destructive",
      });
    },
  });

  const handleFieldValueChange = (
    fieldId: string,
    value: string,
    fieldType?: FieldType,
  ) => {
    // Mark field as modified
    modifiedFieldsRef.current.add(fieldId);

    // Clear error when user starts typing
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldId];
      return newErrors;
    });

    // Format CPF/CNPJ as user types
    let formattedValue = value;
    if (fieldType === "cpf") {
      // Remove non-numeric characters
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 11) {
        try {
          formattedValue = formatCPF(numericValue);
        } catch {
          formattedValue = numericValue;
        }
      }
    } else if (fieldType === "cnpj") {
      // Remove non-numeric characters
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 14) {
        try {
          formattedValue = formatCNPJ(numericValue);
        } catch {
          formattedValue = numericValue;
        }
      }
    }

    setFieldValues((prev) => ({ ...prev, [fieldId]: formattedValue }));
  };

  const handleFieldBlur = (fieldId: string, fieldType?: FieldType) => {
    // Save field value when input loses focus
    const currentValue = fieldValues[fieldId];
    const originalField = currentFields.find((f) => f.id === fieldId);
    const originalValue = originalField?.value || "";

    // Validate CPF/CNPJ on blur
    if (currentValue && currentValue.trim()) {
      if (fieldType === "cpf") {
        const numericValue = currentValue.replace(/\D/g, "");
        if (numericValue && !isValidCPF(numericValue)) {
          setFieldErrors((prev) => ({
            ...prev,
            [fieldId]: "CPF inválido",
          }));
          return;
        }
      } else if (fieldType === "cnpj") {
        const numericValue = currentValue.replace(/\D/g, "");
        if (numericValue && !isValidCNPJ(numericValue)) {
          setFieldErrors((prev) => ({
            ...prev,
            [fieldId]: "CNPJ inválido",
          }));
          return;
        }
      }
    }

    // Only save if value actually changed
    if (currentValue !== undefined && currentValue !== originalValue) {
      setSavingField(fieldId);
      saveFieldValuesMutation.mutate(fieldId);
    } else {
      // Remove from modified fields if value hasn't changed
      modifiedFieldsRef.current.delete(fieldId);
    }
  };

  const handleTitleBlur = () => {
    if (title !== dealDetails?.title) {
      setSavingField("title");
      updateDealMutation.mutate({ title, fieldName: "title" });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== dealDetails?.description) {
      setSavingField("description");
      updateDealMutation.mutate({ description, fieldName: "description" });
    }
  };

  const handleValueBlur = () => {
    if (value !== dealDetails?.value) {
      setSavingField("value");
      updateDealMutation.mutate({ value, fieldName: "value" });
    }
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    if (newCurrency !== (dealDetails?.currency || "BRL")) {
      setSavingField("value");
      updateDealMutation.mutate({ currency: newCurrency, fieldName: "value" });
    }
  };

  const handleCustomerNameBlur = () => {
    if (customerName !== dealDetails?.customer?.name) {
      setSavingField("customerName");
      updateDealMutation.mutate({ customerName, fieldName: "customerName" });
    }
  };

  const handleCustomerEmailBlur = () => {
    if (customerEmail !== (dealDetails?.customer?.email || "")) {
      setSavingField("customerEmail");
      updateDealMutation.mutate({ customerEmail, fieldName: "customerEmail" });
    }
  };

  const handleCustomerPhoneBlur = () => {
    // customerPhone is E.164 with + (e.g. +5511999887766 or +351912345678)
    // Backend expects the + prefix for correct international number parsing
    if (!customerPhone) return;
    const storedPhone = dealDetails?.customer?.phone || "";
    // Compare against stored format (digits without +)
    const phoneDigits = customerPhone.replace(/^\+/, "");
    if (phoneDigits !== storedPhone) {
      setSavingField("customerPhone");
      updateCustomerPhoneMutation.mutate(customerPhone);
    }
  };

  const handleSelectFieldType = (type: FieldType | "document") => {
    setSelectedFieldType(type);
    setShowCreateFieldModal(true);
  };

  const handleCreateField = (data: {
    name: string;
    label: string;
    description: string;
    isRequired: boolean;
    type: FieldType;
  }) => {
    createFieldMutation.mutate(data);
  };

  const handleEditField = (field: StageFormField) => {
    setEditingField(field);
    setShowEditFieldModal(true);
  };

  const handleUpdateField = (data: {
    label: string;
    description: string;
    isRequired: boolean;
  }) => {
    if (!editingField) return;
    updateFieldMutation.mutate({
      fieldId: editingField.id,
      ...data,
    });
  };

  const handleDeleteField = (fieldId: string) => {
    if (confirm("Tem certeza que deseja remover este campo?")) {
      deleteFieldMutation.mutate(fieldId);
    }
  };

  const handleAddNote = () => {
    createNoteMutation.mutate();
  };

  const handleTagsChange = (tagIds: string[]) => {
    setSelectedTagIds(tagIds);
  };

  const handleUserSelect = (userId: string | null) => {
    setAssignedUserId(userId);
    assignUserMutation.mutate(userId);
  };

  // Delete deal mutation
  const deleteDealMutation = useMutation({
    mutationFn: async () => {
      if (!deal) return;
      await deleteDeal({ dealId: deal.id, workspaceId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dealsByStage"] });
      queryClient.invalidateQueries({ queryKey: ["listDealsByPipeline"] });
      onOpenChange(false);
      toast({ title: "Sucesso", description: "Negócio removido com sucesso." });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao remover negócio.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteDeal = () => {
    setShowDeleteConfirm(true);
  };

  // Verifica se o usuário tem permissão para atribuir deals
  const canAssignDeal = has("assign:deal");
  const canDeleteDeal = has("delete:deal");

  const handleCloseModal = (isOpen: boolean) => {
    if (!isOpen) {
      // Save any pending changes before closing
      // Check if any deal field was modified
      if (title !== dealDetails?.title) {
        updateDealMutation.mutate({ title });
      }
      if (description !== dealDetails?.description) {
        updateDealMutation.mutate({ description });
      }
      if (value !== undefined && value !== dealDetails?.value) {
        updateDealMutation.mutate({ value });
      }
      if (customerName !== dealDetails?.customer?.name) {
        updateDealMutation.mutate({ customerName });
      }

      // Custom fields are now saved automatically on blur, no need to save on close
    }
    onOpenChange(isOpen);
  };

  const toggleStageExpansion = (stageId: string) => {
    setExpandedStages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stageId)) {
        newSet.delete(stageId);
      } else {
        newSet.add(stageId);
      }
      return newSet;
    });
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case "short_text":
        return "I";
      case "long_text":
        return "≡";
      case "email":
        return "@";
      case "phone":
        return "📞";
      case "number":
        return "#";
      case "date":
        return "📅";
      case "datetime":
        return "🕐";
      case "due_date":
        return "🕐";
      case "cpf":
      case "cnpj":
        return "📄";
      default:
        return "I";
    }
  };

  const renderFieldInput = (field: StageFormField) => {
    const value = fieldValues[field.id] || "";

    switch (field.type) {
      case "short_text":
      case "email":
        return (
          <Input
            type={field.type === "email" ? "email" : "text"}
            value={value}
            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
            onBlur={() => handleFieldBlur(field.id)}
            placeholder={field.description || field.label}
          />
        );
      case "phone":
        return (
          <PhoneInput
            defaultCountry="BR"
            value={value}
            onChange={(val) => handleFieldValueChange(field.id, val || "")}
            onBlur={() => handleFieldBlur(field.id)}
            placeholder={field.description || field.label}
          />
        );
      case "long_text":
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
            onBlur={() => handleFieldBlur(field.id)}
            placeholder={field.description || field.label}
            rows={3}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
            onBlur={() => handleFieldBlur(field.id)}
            placeholder={field.description || field.label}
          />
        );
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
            onBlur={() => handleFieldBlur(field.id)}
          />
        );
      case "datetime":
      case "due_date":
        return (
          <Input
            type="datetime-local"
            value={value}
            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
            onBlur={() => handleFieldBlur(field.id)}
          />
        );
      case "cpf":
      case "cnpj": {
        const hasError = fieldErrors[field.id];
        return (
          <div className="space-y-1">
            <Input
              type="text"
              value={value}
              onChange={(e) =>
                handleFieldValueChange(field.id, e.target.value, field.type)
              }
              onBlur={() => handleFieldBlur(field.id, field.type)}
              placeholder={field.description || field.label}
              className={hasError ? "border-red-500" : ""}
              maxLength={field.type === "cpf" ? 14 : 18}
            />
            {hasError && <p className="text-xs text-red-500">{hasError}</p>}
          </div>
        );
      }
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
            onBlur={() => handleFieldBlur(field.id)}
            placeholder={field.description || field.label}
          />
        );
    }
  };

  if (!deal) return null;

  const isLoading = dealDetailsLoading || currentFieldsLoading;

  return (
    <>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover negócio</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este negócio? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDealMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteDealMutation.mutate()}
              disabled={deleteDealMutation.isPending}
            >
              {deleteDealMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-7xl max-h-[90vh] p-0 gap-0 [&>button]:hidden">
          {/* three columns: left (slightly narrower), center for fields/comments, right for moving card */}
          <div className="grid grid-cols-[1fr,400px,280px] h-full">
            {/* Left Column - Deal Details */}
            <div className="border-r">
              <DialogHeader className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl">
                    {dealDetails?.title || deal.title}
                  </DialogTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFollowUpListDialog(true)}
                    className="gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Agendamentos
                  </Button>
                </div>
              </DialogHeader>

              <ScrollArea className="h-[calc(90vh-100px)] px-6">
                {isLoading ? (
                  <div className="space-y-4 pb-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4 pb-6 px-1">
                    {/* Customer Info */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        Nome do contato principal
                        {savingField === "customerName" && (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        )}
                      </Label>
                      <Input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        onBlur={handleCustomerNameBlur}
                        placeholder="Nome do cliente"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          E-mail principal
                          {savingField === "customerEmail" && (
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                        </Label>
                        <Input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          onBlur={handleCustomerEmailBlur}
                          placeholder="Inserir e-mail"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          Telefone principal
                          {savingField === "customerPhone" && (
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                        </Label>
                        <PhoneInput
                          defaultCountry="BR"
                          value={customerPhone}
                          onChange={(val) => setCustomerPhone(val || "")}
                          onBlur={handleCustomerPhoneBlur}
                        />
                      </div>
                    </div>

                    {/* Deal Details */}
                    <div className="border-t pt-4 mt-4 px-1">
                      <h3 className="font-semibold mb-3">
                        Detalhes do negócio
                      </h3>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            Nome do negócio
                            {savingField === "title" && (
                              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                            )}
                          </Label>
                          <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            placeholder="Nome do negócio"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Pipeline</Label>
                            <Input disabled value="Pipeline atual" />
                          </div>
                          <div className="space-y-2">
                            <Label>Fase</Label>
                            <Input
                              disabled
                              value={
                                dealDetails?.currentStage?.name || "Fase atual"
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            Valor do negócio
                            {savingField === "value" && (
                              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                            )}
                          </Label>
                          <CurrencyInput
                            numericValue={value}
                            currency={currency}
                            onNumericValueChange={setValue}
                            onCurrencyChange={handleCurrencyChange}
                            onBlur={handleValueBlur}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Data de criação</Label>
                          <Input
                            value={
                              dealDetails?.createdAt
                                ? new Date(
                                    dealDetails.createdAt,
                                  ).toLocaleString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""
                            }
                            disabled
                            className="bg-muted"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            Descrição
                            {savingField === "description" && (
                              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                            )}
                          </Label>
                          <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={handleDescriptionBlur}
                            placeholder="Descrição do negócio"
                            rows={4}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            Usuário Responsável
                            {assignUserMutation.isPending && (
                              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                            )}
                          </Label>
                          <UserSelector
                            workspaceId={workspaceId}
                            selectedUserId={assignedUserId}
                            selectedUserName={dealDetails?.assignedUser?.name}
                            onUserSelect={handleUserSelect}
                            disabled={
                              !canAssignDeal || assignUserMutation.isPending
                            }
                          />
                          {!canAssignDeal && (
                            <p className="text-xs text-muted-foreground">
                              Você não tem permissão para atribuir usuários a
                              este negócio.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4 px-1">
                      <h3 className="font-semibold mb-3">
                        Atribuição de origem
                      </h3>
                      {dealDetails?.attribution?.firstTouch ? (
                        <div className="space-y-3 text-sm">
                          <AttributionDetails
                            attribution={dealDetails.attribution.firstTouch}
                            title="Primeiro toque"
                            canAccessIntegrations={canAccessIntegrations}
                          />
                          {dealDetails.attribution.lastTouch &&
                            dealDetails.attribution.lastTouch.id !==
                              dealDetails.attribution.firstTouch.id && (
                              <AttributionDetails
                                attribution={dealDetails.attribution.lastTouch}
                                title="Último toque"
                                canAccessIntegrations={canAccessIntegrations}
                              />
                            )}
                          {attributionHistory &&
                            attributionHistory.total > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Histórico ({attributionHistory.total})
                                </p>
                                {attributionHistory.items.map((touch) => (
                                  <div
                                    key={touch.id}
                                    className="flex items-center justify-between rounded border px-2 py-1.5 text-xs"
                                  >
                                    <span className="truncate">
                                      {formatAttributionOrigin(touch)}
                                    </span>
                                    <span className="ml-2 shrink-0 text-muted-foreground">
                                      {new Date(
                                        touch.attributedAt,
                                      ).toLocaleDateString("pt-BR")}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Origem não informada
                        </p>
                      )}
                    </div>

                    {/* Tags Section */}
                    <div className="border-t pt-4 mt-4 px-1">
                      <h3 className="font-semibold mb-3">Tags</h3>

                      <div className="space-y-2">
                        <TagsSelector
                          allTags={allTags}
                          selectedTagIds={selectedTagIds}
                          onTagsChange={handleTagsChange}
                          onSave={(tagIds) => updateTagsMutation.mutate(tagIds)}
                          isLoading={updateTagsMutation.isPending}
                          workspaceId={workspaceId}
                        />
                      </div>
                    </div>

                    {/* Stage History */}
                    {historyLoading ? (
                      <div className="border-t pt-4 mt-4 px-1">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <History className="h-4 w-4" />
                          Histórico de Etapas
                        </h3>
                        <div className="space-y-2">
                          {[1, 2].map((i) => (
                            <div
                              key={i}
                              className="border rounded-lg overflow-hidden border-l-4"
                            >
                              <div className="p-3 space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-48" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : fieldHistory.length > 0 ? (
                      <div className="border-t pt-4 mt-4 px-1">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <History className="h-4 w-4" />
                          Histórico de Etapas
                        </h3>
                        <div className="space-y-2">
                          {fieldHistory.map((stage) => {
                            const isExpanded = expandedStages.has(
                              stage.stageId,
                            );

                            return (
                              <div
                                key={stage.stageId}
                                className="border rounded-lg overflow-hidden"
                                style={{
                                  borderLeftWidth: "4px",
                                  borderLeftColor: stage.stageColor || "#000",
                                }}
                              >
                                <button
                                  onClick={() =>
                                    toggleStageExpansion(stage.stageId)
                                  }
                                  className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex-1 text-left">
                                    <p className="font-semibold text-sm">
                                      {stage.stageName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Entrou em{" "}
                                      {new Date().toLocaleDateString("pt-BR", {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric",
                                      })}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                </button>

                                {isExpanded && stage.fields.length > 0 && (
                                  <div className="px-3 pb-3 space-y-2 bg-muted/20">
                                    {stage.fields.map((field) => {
                                      // Format datetime values for display
                                      let displayValue =
                                        field.value || "Não preenchido";
                                      if (
                                        field.value &&
                                        (field.type === "datetime" ||
                                          field.type === "due_date" ||
                                          field.type === "date")
                                      ) {
                                        displayValue = formatDatetimeForDisplay(
                                          field.value,
                                          field.type,
                                        );
                                      }

                                      return (
                                        <div
                                          key={field.id}
                                          className="flex items-start gap-2"
                                        >
                                          <span className="text-muted-foreground mt-0.5">
                                            {getFieldIcon(field.type)}
                                          </span>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">
                                              {field.label}
                                            </p>
                                            <p className="text-sm text-muted-foreground break-words">
                                              {displayValue}
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Right Column - Fields Management & Notes */}
            <div className="flex flex-col">
              {/* Header with stage name and add button */}
              <div className="p-4 border-b flex items-center justify-between">
                {dealDetailsLoading ? (
                  <Skeleton className="h-5 w-32" />
                ) : (
                  <h3 className="font-semibold text-sm">
                    {dealDetails?.currentStage?.name || "Etapa Atual"}
                  </h3>
                )}
                {has("create:stage-form-field") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSelectTypeModal(true)}
                    className="h-8 gap-1.5 text-xs font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Novo Campo
                  </Button>
                )}
              </div>

              {/* Fields Section */}
              <div className="flex-1 overflow-hidden border-b">
                <div className="p-4 pb-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Campos Personalizados
                  </h4>
                </div>
                <ScrollArea className="h-[calc(45vh-120px)]">
                  <div className="px-4 pb-4 space-y-3">
                    {stageFieldsLoading ? (
                      // Skeleton loading state
                      <>
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-48" />
                              </div>
                              <div className="flex items-center gap-1">
                                <Skeleton className="h-6 w-6" />
                                <Skeleton className="h-6 w-6" />
                              </div>
                            </div>
                            <Skeleton className="h-10 w-full" />
                          </div>
                        ))}
                      </>
                    ) : stageFields.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">
                        Nenhum campo criado ainda.
                      </p>
                    ) : (
                      stageFields.map((field) => (
                        <div key={field.id} className="space-y-2">
                          {/* Field Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">
                                  {field.label}
                                  {field.isRequired && (
                                    <span className="text-destructive ml-1">
                                      *
                                    </span>
                                  )}
                                </p>
                                {savingField === field.id && (
                                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                )}
                              </div>
                              {field.description && (
                                <p className="text-xs text-muted-foreground">
                                  {field.description}
                                </p>
                              )}
                            </div>

                            {/* Actions Menu - Only for users with edit/delete permissions */}
                            {(has("update:stage-form-field") ||
                              has("delete:stage-form-field")) && (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 cursor-grab"
                                >
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                    >
                                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {has("update:stage-form-field") && (
                                      <DropdownMenuItem
                                        onClick={() => handleEditField(field)}
                                      >
                                        <Edit2 className="h-3 w-3 mr-2" />
                                        Editar
                                      </DropdownMenuItem>
                                    )}
                                    {has("delete:stage-form-field") && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleDeleteField(field.id)
                                        }
                                        className="text-destructive"
                                      >
                                        <Trash2 className="h-3 w-3 mr-2" />
                                        Remover
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>

                          {/* Field Input */}
                          {renderFieldInput(field)}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Comments Section */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="p-4 pb-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Comentários
                  </h4>
                </div>
                <div className="px-4 pb-2 space-y-3">
                  <Textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Escreva aqui..."
                    rows={3}
                    className="resize-none"
                  />

                  {newNoteContent.trim() && (
                    <Button
                      size="sm"
                      onClick={handleAddNote}
                      disabled={createNoteMutation.isPending}
                      className="w-full"
                    >
                      Adicionar Comentário
                    </Button>
                  )}
                </div>

                {/* Comments List with ScrollArea */}
                <ScrollArea className="flex-1 px-4">
                  <div className="space-y-3 pb-4">
                    {notesLoading && (
                      <>
                        {[1, 2].map((i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-6 w-6 rounded-full" />
                              <div className="flex-1 space-y-1">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-3 w-32" />
                              </div>
                            </div>
                            <Skeleton className="h-10 w-full ml-8" />
                          </div>
                        ))}
                      </>
                    )}

                    {!notesLoading && notes.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Nenhum comentário ainda.
                      </p>
                    )}

                    {!notesLoading &&
                      notes.map((note) => (
                        <div key={note.id} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {note.user?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium">
                                {note.user?.name || "Usuário"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(() => {
                                  const noteDate = new Date(note.createdAt);
                                  const daysDiff = differenceInDays(
                                    new Date(),
                                    noteDate,
                                  );

                                  if (daysDiff >= 7) {
                                    return format(
                                      noteDate,
                                      "dd/MM/yyyy 'às' HH:mm",
                                      { locale: ptBR },
                                    );
                                  }

                                  return formatDistanceToNow(noteDate, {
                                    addSuffix: true,
                                    locale: ptBR,
                                  });
                                })()}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm pl-8">{note.content}</p>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Extra Right Column - Move card between pipeline stages */}
            <div className="border-l bg-transparent flex flex-col">
              <div className="p-4 border-b h-[65px] flex items-center justify-between">
                <h3 className="font-semibold text-sm">Mover negócio para...</h3>
                <div className="flex items-center gap-1">
                  {canDeleteDeal && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-70 hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive gap-2"
                          onClick={handleDeleteDeal}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remover negócio
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-70 hover:opacity-100"
                    onClick={() => handleCloseModal(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 flex-1 overflow-auto">
                {pipelineStagesLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : pipelineStages && pipelineStages.length > 0 ? (
                  <TooltipProvider>
                    <div className="space-y-2">
                      {pipelineStages.map((stage: PipelineStageMinimal) => {
                        const isCurrent =
                          dealDetails?.currentStage?.id === stage.id;
                        const stageColor = stage.color || "#6b7280"; // fallback to gray
                        const hasAssistant = !!stage.assistantPipelineStage;
                        return (
                          <Button
                            key={stage.id}
                            size="sm"
                            variant={isCurrent ? "outline" : "ghost"}
                            className={`w-full justify-between border-l-4 ${
                              isCurrent ? "opacity-60" : ""
                            }`}
                            style={{
                              borderLeftColor: stageColor,
                            }}
                            onClick={() => {
                              if (!isCurrent && moveDealMutation)
                                moveDealMutation.mutate(stage.id);
                            }}
                            disabled={isCurrent || moveDealMutation.isPending}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: stageColor }}
                              />
                              <span className="text-left">{stage.name}</span>
                              {hasAssistant && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex">
                                      <Bot className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p>Assistente de IA ativo nesta etapa</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        );
                      })}
                    </div>
                  </TooltipProvider>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Nenhuma etapa disponível.
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>

        {/* Modals for field creation and editing */}
        <SelectFieldTypeModal
          open={showSelectTypeModal}
          onOpenChange={setShowSelectTypeModal}
          onSelectType={handleSelectFieldType}
        />

        <CreateFieldModal
          open={showCreateFieldModal}
          onOpenChange={setShowCreateFieldModal}
          fieldType={selectedFieldType}
          onCreateField={handleCreateField}
          isCreating={createFieldMutation.isPending}
        />

        <EditFieldModal
          open={showEditFieldModal}
          onOpenChange={setShowEditFieldModal}
          field={editingField}
          onUpdateField={handleUpdateField}
          isUpdating={updateFieldMutation.isPending}
        />

        {/* Scheduled messages list dialog */}
        <DealFollowUpListDialog
          open={showFollowUpListDialog}
          onOpenChange={setShowFollowUpListDialog}
          dealId={deal?.id || ""}
          dealTitle={dealDetails?.title || deal?.title || ""}
        />
      </Dialog>
    </>
  );
};

export default DealViewModal;
