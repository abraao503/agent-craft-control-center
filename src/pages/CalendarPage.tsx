import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { es, ptBR } from "date-fns/locale";
import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Calendar as CalendarIcon, Loader2, Plus } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import esLocale from "@fullcalendar/core/locales/es";
import { DatesSetArg } from "@fullcalendar/core";
import { DateClickArg } from "@fullcalendar/interaction";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { useToast } from "@/hooks/use-toast";
import { listGoogleCalendarIntegrations } from "@/services/google-calendar/listGoogleCalendarIntegrations";
import {
  listGoogleCalendarEvents,
  GoogleCalendarEvent,
} from "@/services/google-calendar/listGoogleCalendarEvents";
import { createGoogleCalendarEvent } from "@/services/google-calendar/createGoogleCalendarEvent";
import { updateGoogleCalendarEvent } from "@/services/google-calendar/updateGoogleCalendarEvent";
import { deleteGoogleCalendarEvent } from "@/services/google-calendar/deleteGoogleCalendarEvent";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar as MiniCalendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppLocale } from "@/i18n/LocaleProvider";
import { useTranslation } from "react-i18next";

import "./CalendarPage.css";

function getLocalDatetimeString(dateObj: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(
    dateObj.getDate(),
  )}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
}

export default function CalendarPage() {
  const { workspaceId } = useWorkspaceManager();
  const { locale } = useAppLocale();
  const { t } = useTranslation();
  const dateLocale = locale === "es-ES" ? es : ptBR;
  const calendarLocale = locale === "es-ES" ? esLocale : ptBrLocale;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const calendarRef = useRef<FullCalendar>(null);

  const [selectedIntegrationIds, setSelectedIntegrationIds] = useState<
    string[]
  >([]);
  const [leftCalendarDate, setLeftCalendarDate] = useState<Date>(new Date());

  // Define if the user selected any accounts manually this session
  const [hasInitedSelection, setHasInitedSelection] = useState(false);

  // Format the date range visible on the current calendar view
  const [visibleRange, setVisibleRange] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);

  // Modal states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "update">("create");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingEventGoogleUrl, setEditingEventGoogleUrl] = useState<
    string | null
  >(null);

  // Form states
  const [formIntegrationId, setFormIntegrationId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formAttendees, setFormAttendees] = useState("");

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setVisibleRange({
      startDate: arg.startStr,
      endDate: arg.endStr,
    });

    // Attempt to keep MiniCalendar approx in sync without forcing the exact day selection
    // Just sync the viewed month if it diverges significantly
    setLeftCalendarDate((prev) => {
      const isSameMonth =
        prev.getMonth() === arg.view.currentStart.getMonth() &&
        prev.getFullYear() === arg.view.currentStart.getFullYear();
      return isSameMonth ? prev : arg.view.currentStart;
    });
  }, []);

  const { data: integrationsData, isLoading: isLoadingIntegrations } = useQuery(
    {
      queryKey: ["google-calendar-integrations", workspaceId],
      queryFn: () =>
        listGoogleCalendarIntegrations({ workspaceId: workspaceId! }),
      enabled: !!workspaceId,
    },
  );

  const integrations = integrationsData?.items || [];
  const activeIntegrations = integrations.filter((i) => i.isActive);

  // Initialize selected array
  useEffect(() => {
    if (activeIntegrations.length > 0 && !hasInitedSelection) {
      setSelectedIntegrationIds(activeIntegrations.map((i) => i.id));
      setHasInitedSelection(true);
    }
  }, [activeIntegrations, hasInitedSelection]);

  const integrationsToPoll = activeIntegrations.filter((i) =>
    selectedIntegrationIds.includes(i.id),
  );

  // Fetch events
  const eventsQueries = useQueries({
    queries: integrationsToPoll.map((integ) => ({
      queryKey: [
        "google-calendar-events",
        integ.id,
        visibleRange?.startDate,
        visibleRange?.endDate,
      ],
      queryFn: () =>
        listGoogleCalendarEvents({
          integrationId: integ.id,
          limit: 100,
          startDate: visibleRange?.startDate,
          endDate: visibleRange?.endDate,
        }),
      enabled: !!integ.id && !!visibleRange,
      staleTime: 60 * 1000,
    })),
  });

  const isLoadingEvents = eventsQueries.some((q) => q.isLoading);
  const isFetchingEvents = eventsQueries.some((q) => q.isFetching);

  const calendarEvents = useMemo(() => {
    const allEvents: {
      id: string;
      title: string;
      start: string;
      end: string;
      url?: string;
      extendedProps: {
        eventId: string | null;
        integrationId: string;
        description: string;
        location: string;
        source: string;
        integrationEmail: string;
        attendees: string[];
      };
    }[] = [];

    eventsQueries.forEach((query, index) => {
      if (!query.data?.items) return;
      const integEmail = integrationsToPoll[index]?.googleEmail || "";
      const integId = integrationsToPoll[index]?.id || "";

      query.data.items.forEach((event: GoogleCalendarEvent) => {
        allEvents.push({
          id: event.googleEventId || event.id || crypto.randomUUID(),
          title: event.title || "Evento sem título",
          start: event.startDateTime,
          end: event.endDateTime,
          url: event.htmlLink || undefined,
          extendedProps: {
            eventId: event.id,
            integrationId: integId,
            description: event.description || "",
            location: event.location || "",
            source: event.source,
            integrationEmail: integEmail,
            attendees: event.attendees || [],
          },
        });
      });
    });

    return allEvents;
  }, [eventsQueries, integrationsToPoll]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createGoogleCalendarEvent,
    onSuccess: () => {
      toast({ title: t("calendar.createdSuccess") });
      queryClient.invalidateQueries({ queryKey: ["google-calendar-events"] });
      setIsEventModalOpen(false);
    },
    onError: () => {
      toast({ title: t("calendar.createError"), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateGoogleCalendarEvent,
    onSuccess: () => {
      toast({ title: t("calendar.updatedSuccess") });
      queryClient.invalidateQueries({ queryKey: ["google-calendar-events"] });
      setIsEventModalOpen(false);
    },
    onError: () => {
      toast({ title: t("calendar.updateError"), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGoogleCalendarEvent,
    onSuccess: () => {
      toast({ title: t("calendar.deletedSuccess") });
      queryClient.invalidateQueries({ queryKey: ["google-calendar-events"] });
      setIsEventModalOpen(false);
    },
    onError: () => {
      toast({ title: t("calendar.deleteError"), variant: "destructive" });
    },
  });

  const handleCreateNew = () => {
    setModalMode("create");
    setFormTitle("");
    setFormDescription("");
    setFormLocation("");
    setFormAttendees("");
    setEditingEventId(null);
    setEditingEventGoogleUrl(null);

    const defaultInteg =
      selectedIntegrationIds.length > 0
        ? selectedIntegrationIds[0]
        : activeIntegrations[0]?.id || "";
    setFormIntegrationId(defaultInteg);

    const start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    setFormStartDate(getLocalDatetimeString(start));
    setFormEndDate(getLocalDatetimeString(end));

    setIsEventModalOpen(true);
  };

  const handleDateClick = (arg: DateClickArg) => {
    setModalMode("create");
    setFormTitle("");
    setFormDescription("");
    setFormLocation("");
    setFormAttendees("");
    setEditingEventId(null);
    setEditingEventGoogleUrl(null);

    const defaultInteg =
      selectedIntegrationIds.length > 0
        ? selectedIntegrationIds[0]
        : activeIntegrations[0]?.id || "";
    setFormIntegrationId(defaultInteg);

    const start = new Date(arg.date);
    if (arg.allDay) {
      start.setHours(9, 0, 0, 0);
    }

    const end = new Date(start.getTime() + 60 * 60 * 1000);

    setFormStartDate(getLocalDatetimeString(start));
    setFormEndDate(getLocalDatetimeString(end));

    setIsEventModalOpen(true);
  };

  const handleSaveEvent = () => {
    if (!formTitle || !formStartDate || !formEndDate || !formIntegrationId) {
      toast({
        title: t("calendar.requiredFields"),
        variant: "destructive",
      });
      return;
    }

    const startISO = new Date(formStartDate).toISOString();
    const endISO = new Date(formEndDate).toISOString();

    const attendeesList = formAttendees
      ? formAttendees
          .split(",")
          .map((a) => a.trim())
          .filter((a) => a.length > 0)
      : [];

    const payload = {
      title: formTitle,
      startDateTime: startISO,
      endDateTime: endISO,
      description: formDescription,
      location: formLocation,
      attendees: attendeesList.length > 0 ? attendeesList : undefined,
    };

    if (modalMode === "create") {
      createMutation.mutate({
        ...payload,
        integrationId: formIntegrationId,
      });
    } else {
      if (!editingEventId) return;
      updateMutation.mutate({
        id: editingEventId,
        ...payload,
      });
    }
  };

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t("calendar.workspaceNotFound")}</h2>
          <p className="text-muted-foreground">
            {t("calendar.noWorkspace")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-page space-y-6 flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            {t("calendar.title")}
            {isFetchingEvents && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground ml-2" />
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("calendar.description")}
          </p>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden items-start">
        {/* Left Sidebar */}
        <aside className="w-64 flex-shrink-0 flex flex-col gap-6 overflow-y-auto pr-2 pb-4 h-full">
          {activeIntegrations.length > 0 && (
            <Button
              onClick={handleCreateNew}
              className="w-full flex justify-start items-center gap-3 rounded-full h-12 shadow-md hover:shadow-lg transition-shadow bg-background text-foreground border border-input px-4"
              variant="outline"
            >
              <div className="bg-primary/10 rounded-full p-1 -ml-1 flex items-center justify-center">
                <Plus className="h-4 w-4 text-primary" strokeWidth={3} />
              </div>
              <span className="font-semibold text-sm">{t("calendar.createEvent")}</span>
            </Button>
          )}

          <div className="flex justify-center border-none shadow-none rounded-none bg-transparent">
            <MiniCalendar
              mode="single"
              selected={leftCalendarDate}
              onSelect={(date) => {
                if (date && calendarRef.current) {
                  setLeftCalendarDate(date);
                  calendarRef.current.getApi().gotoDate(date);
                }
              }}
              className="p-0 pointer-events-auto"
              locale={dateLocale}
            />
          </div>

          <div className="space-y-4 px-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("calendar.myCalendars")}
            </h3>
            {isLoadingIntegrations ? (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Loader2 className="animate-spin w-4 h-4" />
                <span className="text-sm">{t("calendar.loadingAccounts")}</span>
              </div>
            ) : activeIntegrations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("calendar.noConnectedAccount")}
              </p>
            ) : (
              <div className="space-y-3">
                {activeIntegrations.map((integ) => {
                  const isChecked = selectedIntegrationIds.includes(integ.id);
                  return (
                    <div key={integ.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`integ-${integ.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedIntegrationIds((prev) => [
                              ...prev,
                              integ.id,
                            ]);
                          } else {
                            setSelectedIntegrationIds((prev) =>
                              prev.filter((id) => id !== integ.id),
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={`integ-${integ.id}`}
                        className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate w-full"
                        title={integ.googleEmail}
                      >
                        {integ.googleEmail}
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <Card className="flex-1 flex flex-col h-full border-none shadow-md overflow-hidden bg-card">
          <div className="flex-1 p-0 overflow-hidden relative">
            {isLoadingIntegrations ? (
              <div className="h-full flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : integrations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto min-h-[400px]">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  {t("calendar.noConnectedCalendar")}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t("calendar.noConnectedCalendarDescription")}
                </p>
                <Link to="/integrations">
                  <Button variant="outline">{t("calendar.goToIntegrations")}</Button>
                </Link>
              </div>
            ) : (
              <div className="h-full overflow-hidden absolute inset-0 rounded-lg">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[
                    dayGridPlugin,
                    timeGridPlugin,
                    interactionPlugin,
                    listPlugin,
                  ]}
                  initialView="timeGridWeek"
                  locale={calendarLocale}
                  headerToolbar={{
                    left: "today prev,next",
                    center: "title",
                    right: "timeGridDay,timeGridWeek,dayGridMonth,listWeek",
                  }}
                  events={calendarEvents}
                  height="100%"
                  expandRows={true}
                  editable={false}
                  selectable={true}
                  dateClick={handleDateClick}
                  eventClick={(info) => {
                    info.jsEvent.preventDefault();

                    const eProps = info.event.extendedProps;
                    if (!eProps.eventId) {
                      if (info.event.url) {
                        window.open(info.event.url, "_blank");
                      } else {
                        toast({
                          title: t("calendar.eventNotEditable"),
                          variant: "destructive",
                        });
                      }
                      return;
                    }

                    setModalMode("update");
                    setEditingEventId(eProps.eventId);
                    setEditingEventGoogleUrl(info.event.url || null);
                    setFormIntegrationId(eProps.integrationId);
                    setFormTitle(info.event.title);
                    setFormDescription(eProps.description || "");
                    setFormLocation(eProps.location || "");
                    setFormAttendees((eProps.attendees || []).join(", "));

                    if (info.event.start) {
                      setFormStartDate(
                        getLocalDatetimeString(info.event.start),
                      );
                    }
                    if (info.event.end) {
                      setFormEndDate(getLocalDatetimeString(info.event.end));
                    } else if (info.event.start) {
                      const end = new Date(
                        info.event.start.getTime() + 60 * 60 * 1000,
                      );
                      setFormEndDate(getLocalDatetimeString(end));
                    }

                    setIsEventModalOpen(true);
                  }}
                  dayMaxEvents={3}
                  datesSet={handleDatesSet}
                  eventDisplay="block"
                  nowIndicator={true}
                  slotMinTime="06:00:00"
                  slotMaxTime="23:00:00"
                  allDaySlot={true}
                  businessHours={{
                    daysOfWeek: [1, 2, 3, 4, 5],
                    startTime: "08:00",
                    endTime: "18:00",
                  }}
                />
              </div>
            )}
          </div>
        </Card>
      </div>

      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" ? t("calendar.createEvent") : t("calendar.editEvent")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {modalMode === "create" && (
              <div className="grid gap-2">
                <Label htmlFor="integration">{t("calendar.account")}</Label>
                <Select
                  value={formIntegrationId}
                  onValueChange={setFormIntegrationId}
                >
                  <SelectTrigger id="integration">
                    <SelectValue placeholder={t("calendar.selectAccount")} />
                  </SelectTrigger>
                  <SelectContent>
                    {activeIntegrations.map((integ) => (
                      <SelectItem key={integ.id} value={integ.id}>
                        {integ.googleEmail}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="title">{t("calendar.titleLabel")}</Label>
              <Input
                id="title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={t("calendar.titlePlaceholder")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start">{t("calendar.start")}</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end">{t("calendar.end")}</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">{t("calendar.location")}</Label>
              <Input
                id="location"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder={t("calendar.locationPlaceholder")}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="attendees">
                {t("calendar.attendees")}
              </Label>
              <Input
                id="attendees"
                value={formAttendees}
                onChange={(e) => setFormAttendees(e.target.value)}
                placeholder="email1@exemplo.com, email2@exemplo.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">{t("calendar.descriptionLabel")}</Label>
              <Textarea
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t("calendar.eventDescriptionPlaceholder")}
                className="resize-none"
              />
            </div>

            {modalMode === "update" && editingEventGoogleUrl && (
              <Button
                type="button"
                variant="link"
                className="justify-start p-0 h-auto"
                onClick={() => window.open(editingEventGoogleUrl, "_blank")}
              >
                {t("calendar.openGoogleCalendar")}
              </Button>
            )}
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            <div>
              {modalMode === "update" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive">
                      {t("common.delete")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("calendar.deleteEvent")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("calendar.deleteEventDescription")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deleteMutation.isPending}
                        onClick={(e) => {
                          e.preventDefault(); // Prevent modal from closing immediately
                          if (editingEventId) {
                            deleteMutation.mutate({ id: editingEventId });
                          }
                        }}
                      >
                        {deleteMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {t("calendar.confirmDelete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEventModalOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleSaveEvent}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("common.save")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
