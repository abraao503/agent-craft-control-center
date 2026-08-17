import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { TemplateTextDisplay } from "@/components/message-template";
import { formatPhone } from "@/utils/phone";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Megaphone,
  Loader2,
  Play,
  Pause,
  XCircle,
  RotateCcw,
  Trash2,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import { SmartPagination } from "@/components/common/SmartPagination";
import {
  getMassBroadcast,
  listMassBroadcastRecipients,
  startMassBroadcast,
  pauseMassBroadcast,
  cancelMassBroadcast,
  retryFailedRecipients,
  deleteMassBroadcast,
} from "@/services/mass-broadcast";
import {
  MassBroadcastStatus,
  MassBroadcastRecipientStatus,
} from "@/types/mass-broadcast";
import { format } from "date-fns";
import { enUS, es, ptBR } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useAppLocale } from "@/i18n/LocaleProvider";

const STATUS_COLORS: Record<MassBroadcastStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  READY: "bg-green-100 text-green-800",
  SENDING: "bg-yellow-100 text-yellow-800",
  PAUSED: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
  FAILED: "bg-red-100 text-red-800",
};

const RECIPIENT_STATUS_COLORS: Record<MassBroadcastRecipientStatus, string> = {
  PENDING: "bg-gray-100 text-gray-800",
  QUEUED: "bg-blue-100 text-blue-800",
  SENT: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  SKIPPED: "bg-yellow-100 text-yellow-800",
};

const ITEMS_PER_PAGE = 10;

export default function MassBroadcastDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { locale } = useAppLocale();
  const dateLocale = locale === "es-ES" ? es : locale === "en-US" ? enUS : ptBR;

  const getStatusLabel = (status: MassBroadcastStatus) => {
    const labels: Record<MassBroadcastStatus, string> = {
      DRAFT: t("broadcasts.draft"),
      PROCESSING: t("broadcasts.processing"),
      READY: t("broadcasts.ready"),
      SENDING: t("broadcasts.sending"),
      PAUSED: t("broadcasts.paused"),
      COMPLETED: t("broadcasts.completed"),
      CANCELLED: t("broadcasts.cancelled"),
      FAILED: t("broadcasts.failed"),
    };
    return labels[status];
  };

  const getRecipientStatusLabel = (status: MassBroadcastRecipientStatus) => {
    const labels: Record<MassBroadcastRecipientStatus, string> = {
      PENDING: t("broadcastDetail.pendingStatus"),
      QUEUED: t("broadcastDetail.queued"),
      SENT: t("broadcastDetail.sentStatus"),
      FAILED: t("broadcastDetail.failedStatus"),
      SKIPPED: t("broadcastDetail.skipped"),
    };
    return labels[status];
  };

  const [recipientsPage, setRecipientsPage] = useState(1);
  const [recipientStatusFilter, setRecipientStatusFilter] =
    useState<string>("ALL");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  // Fetch broadcast details
  const {
    data: broadcast,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["mass-broadcast", id],
    queryFn: () => getMassBroadcast(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      // Auto-refresh when sending
      const status = query.state.data?.status;
      if (status === "SENDING" || status === "PROCESSING") {
        return 5000;
      }
      return false;
    },
  });

  // Fetch recipients
  const { data: recipientsData, isLoading: isLoadingRecipients } = useQuery({
    queryKey: [
      "mass-broadcast-recipients",
      id,
      recipientsPage,
      recipientStatusFilter,
    ],
    queryFn: () =>
      listMassBroadcastRecipients(id!, {
        page: recipientsPage,
        limit: ITEMS_PER_PAGE,
        status:
          recipientStatusFilter !== "ALL"
            ? (recipientStatusFilter as MassBroadcastRecipientStatus)
            : undefined,
      }),
    enabled: !!id,
    refetchInterval: (query) => {
      if (
        broadcast?.status === "SENDING" ||
        broadcast?.status === "PROCESSING"
      ) {
        return 5000;
      }
      return false;
    },
  });

  // Actions mutations
  const startMutation = useMutation({
    mutationFn: () => startMassBroadcast(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mass-broadcast", id] });
      queryClient.invalidateQueries({
        queryKey: ["mass-broadcast-recipients", id],
      });
      toast({
        title: t("broadcastDetail.startSuccess"),
        description: t("broadcastDetail.startSuccessDescription"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("broadcastDetail.startError"),
        description: error?.message || t("broadcastDetail.startErrorDescription"),
        variant: "destructive",
      });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: () => pauseMassBroadcast(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mass-broadcast", id] });
      queryClient.invalidateQueries({
        queryKey: ["mass-broadcast-recipients", id],
      });
      toast({
        title: t("broadcastDetail.pauseSuccess"),
        description: t("broadcastDetail.pauseSuccessDescription"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("broadcastDetail.pauseError"),
        description: error?.message || t("broadcastDetail.pauseErrorDescription"),
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelMassBroadcast(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mass-broadcast", id] });
      queryClient.invalidateQueries({
        queryKey: ["mass-broadcast-recipients", id],
      });
      setIsCancelDialogOpen(false);
      toast({
        title: t("broadcastDetail.cancelSuccess"),
        description: t("broadcastDetail.cancelSuccessDescription"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("broadcastDetail.cancelError"),
        description: error?.message || t("broadcastDetail.cancelErrorDescription"),
        variant: "destructive",
      });
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => retryFailedRecipients(id!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["mass-broadcast", id] });
      queryClient.invalidateQueries({
        queryKey: ["mass-broadcast-recipients", id],
      });
      toast({
        title: t("broadcastDetail.retrySuccess"),
        description: t("broadcastDetail.retrySuccessDescription", { count: data.retriedCount }),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("broadcastDetail.retryError"),
        description:
          error?.message || t("broadcastDetail.retryErrorDescription"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteMassBroadcast(id!),
    onSuccess: () => {
      toast({
        title: t("broadcastDetail.deleteSuccess"),
        description: t("broadcastDetail.deleteSuccessDescription"),
      });
      navigate("/broadcasts");
    },
    onError: (error: Error) => {
      toast({
        title: t("broadcastDetail.deleteError"),
        description: error?.message || t("broadcastDetail.deleteErrorDescription"),
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: dateLocale });
  };

  const getProgressPercent = () => {
    if (!broadcast || broadcast.totalRecipients === 0) return 0;
    return Math.round(
      ((broadcast.sentCount + broadcast.failedCount) /
        broadcast.totalRecipients) *
        100,
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !broadcast) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/broadcasts")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">{t("broadcastDetail.notFound")}</h1>
        </div>
        <div className="bg-red-50 p-4 rounded-md border border-red-200">
          <p className="text-red-800">
            {t("broadcastDetail.notFoundDescription")}
          </p>
        </div>
      </div>
    );
  }

  const progress = getProgressPercent();
  const canStart = ["DRAFT", "READY", "PAUSED"].includes(broadcast.status);
  const canPause = broadcast.status === "SENDING";
  const canCancel = !["COMPLETED", "CANCELLED"].includes(broadcast.status);
  const canRetry =
    broadcast.recipientsSummary.failed > 0 &&
    !["SENDING", "CANCELLED"].includes(broadcast.status);
  const canDelete = broadcast.status !== "SENDING";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/broadcasts")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{broadcast.name}</h1>
              <Badge
                variant="secondary"
                className={STATUS_COLORS[broadcast.status]}
              >
                {getStatusLabel(broadcast.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {t("broadcastDetail.createdAt", { date: formatDate(broadcast.createdAt) })}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canStart && (
            <Button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
            >
              {startMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {broadcast.status === "PAUSED"
                ? t("broadcastDetail.resume")
                : t("broadcastDetail.start")}
            </Button>
          )}
          {canPause && (
            <Button
              variant="outline"
              onClick={() => pauseMutation.mutate()}
              disabled={pauseMutation.isPending}
            >
              {pauseMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Pause className="h-4 w-4 mr-2" />
              )}
              {t("broadcastDetail.pause")}
            </Button>
          )}
          {canRetry && (
            <Button
              variant="outline"
              onClick={() => retryMutation.mutate()}
              disabled={retryMutation.isPending}
            >
              {retryMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              {t("broadcastDetail.retryFailed")}
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setIsCancelDialogOpen(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              {t("broadcastDetail.cancel")}
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("broadcastDetail.delete")}
            </Button>
          )}
        </div>
      </div>

      {/* Progress + Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t("broadcastDetail.total")}</span>
            </div>
            <p className="text-2xl font-bold">{broadcast.totalRecipients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">{t("broadcastDetail.sent")}</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {broadcast.recipientsSummary.sent}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">{t("broadcastDetail.failures")}</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {broadcast.recipientsSummary.failed}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">{t("broadcastDetail.pending")}</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {broadcast.recipientsSummary.pending +
                broadcast.recipientsSummary.queued}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      {(broadcast.status === "SENDING" ||
        broadcast.status === "PAUSED" ||
        broadcast.status === "COMPLETED") && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>{t("broadcastDetail.progress")}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-primary rounded-full h-3 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Details & Recipients */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">{t("broadcastDetail.details")}</TabsTrigger>
          <TabsTrigger value="recipients">
            {t("broadcastDetail.recipients", { count: broadcast.totalRecipients })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          {/* Campaign Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                {t("broadcastDetail.campaignInformation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{t("broadcastDetail.name")}</Label>
                  <p className="font-medium">{broadcast.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("broadcastDetail.status")}</Label>
                  <div>
                    <Badge
                      variant="secondary"
                      className={STATUS_COLORS[broadcast.status]}
                    >
                      {getStatusLabel(broadcast.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    {t("broadcastDetail.messageDelay")}
                  </Label>
                  <p className="font-medium">
                    {broadcast.messageDelaySeconds}s
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    {t("broadcastDetail.messageVariations")}
                  </Label>
                  <p className="font-medium">
                    {broadcast.messageVariations.length}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground">{t("broadcastDetail.messages")}</Label>
                <div className="space-y-2 mt-2">
                  {broadcast.messageVariations.map((msg, index) => (
                    <div
                      key={index}
                      className="bg-muted rounded-md p-3 text-sm"
                    >
                      <span className="text-xs text-muted-foreground font-medium">
                        {t("broadcastDetail.variation", { count: index + 1 })}
                      </span>
                      <p className="mt-1 whitespace-pre-wrap">
                        <TemplateTextDisplay text={msg} />
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">
                    {t("broadcastDetail.sendWindowStart")}
                  </Label>
                  <p className="font-medium">
                    {formatDate(broadcast.startTime)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    {t("broadcastDetail.sendWindowEnd")}
                  </Label>
                  <p className="font-medium">{formatDate(broadcast.endTime)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("broadcastDetail.startedAt")}</Label>
                  <p className="font-medium">
                    {formatDate(broadcast.startedAt)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("broadcastDetail.completedAt")}</Label>
                  <p className="font-medium">
                    {formatDate(broadcast.completedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recipients Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("broadcastDetail.recipientsSummary")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {(
                  Object.entries(broadcast.recipientsSummary) as [
                    string,
                    number,
                  ][]
                )
                  .filter(([key]) => key !== "total")
                  .map(([key, value]) => (
                    <div key={key} className="text-center">
                      <Badge
                        variant="secondary"
                        className={
                          RECIPIENT_STATUS_COLORS[
                            key.toUpperCase() as MassBroadcastRecipientStatus
                          ] || ""
                        }
                      >
                        {getRecipientStatusLabel(
                          key.toUpperCase() as MassBroadcastRecipientStatus,
                        ) || key}
                      </Badge>
                      <p className="text-xl font-bold mt-1">{value}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("broadcastDetail.recipients", { count: broadcast.totalRecipients })}</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t("broadcastDetail.statusFilter")}</span>
                  <Select
                    value={recipientStatusFilter}
                    onValueChange={(value) => {
                      setRecipientStatusFilter(value);
                      setRecipientsPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder={t("broadcastDetail.all")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">{t("broadcastDetail.all")}</SelectItem>
                      <SelectItem value="PENDING">{t("broadcastDetail.pendingStatus")}</SelectItem>
                      <SelectItem value="QUEUED">{t("broadcastDetail.queued")}</SelectItem>
                      <SelectItem value="SENT">{t("broadcastDetail.sentStatus")}</SelectItem>
                      <SelectItem value="FAILED">{t("broadcastDetail.failedStatus")}</SelectItem>
                      <SelectItem value="SKIPPED">{t("broadcastDetail.skipped")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingRecipients ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recipientsData && recipientsData.items.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("broadcastDetail.customerId")}</TableHead>
                        <TableHead>{t("broadcastDetail.phone")}</TableHead>
                        <TableHead>{t("broadcastDetail.status")}</TableHead>
                        <TableHead>{t("broadcastDetail.message")}</TableHead>
                        <TableHead>{t("broadcastDetail.sentAt")}</TableHead>
                        <TableHead>{t("broadcastDetail.errorColumn")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipientsData.items.map((recipient) => (
                        <TableRow key={recipient.id}>
                          <TableCell className="font-mono text-xs">
                            {recipient.customerId.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatPhone(recipient.customerPhone)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                RECIPIENT_STATUS_COLORS[recipient.status]
                              }
                            >
                              {getRecipientStatusLabel(recipient.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs">
                            {recipient.messageContent}
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatDate(recipient.sentAt)}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate text-xs text-red-600">
                            {recipient.errorMessage || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {recipientsData.totalPages > 1 && (
                    <div className="mt-4">
                      <SmartPagination
                        currentPage={recipientsPage}
                        totalPages={recipientsData.totalPages}
                        onPageChange={setRecipientsPage}
                        showItemCount
                        itemsPerPage={ITEMS_PER_PAGE}
                        totalItems={recipientsData.total}
                        itemLabel={t("broadcastDetail.itemLabel")}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    {t("broadcastDetail.emptyRecipients", {
                      filter:
                        recipientStatusFilter !== "ALL"
                          ? t("broadcastDetail.filteredSuffix")
                          : "",
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("broadcastDetail.cancelDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("broadcastDetail.cancelDialogDescription", { name: broadcast.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("broadcastDetail.back")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t("broadcastDetail.cancelCampaign")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("broadcastDetail.deleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("broadcastDetail.deleteDialogDescription", { name: broadcast.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("broadcastDetail.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t("broadcastDetail.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
