import { Activity, ActivityType } from "@/types/activity";
import { differenceInDays, formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight, Calendar, User, Bot } from "lucide-react";

interface ActivityItemProps {
  activity: Activity;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const formatDate = (date: Date) => {
    const daysDiff = differenceInDays(new Date(), date);

    if (daysDiff >= 7) {
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    }

    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: ptBR,
    });
  };

  const renderDealStageTransition = (
    activity: Activity & { type: ActivityType.DEAL_STAGE_TRANSITION }
  ) => {
    const initiator = activity.userName || activity.assistantName || "Sistema";
    const isAssistant = !!activity.assistantName;

    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
            <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-300" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              {isAssistant ? (
                <Bot className="h-3 w-3 text-muted-foreground" />
              ) : (
                <User className="h-3 w-3 text-muted-foreground" />
              )}
              <p className="text-sm font-medium">{initiator}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              moveu o negócio{" "}
              <span className="font-medium">{activity.dealTitle}</span>
              {activity.fromStageName && (
                <>
                  {" "}
                  de{" "}
                  <span className="font-medium">{activity.fromStageName}</span>
                </>
              )}{" "}
              para <span className="font-medium">{activity.toStageName}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {activity.pipelineName}
            </p>
            {activity.reason && (
              <p className="text-xs italic text-muted-foreground">
                Motivo: {activity.reason}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(activity.createdAt, {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderDueDateExpired = (
    activity: Activity & { type: ActivityType.DUE_DATE_EXPIRED }
  ) => {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <div className="rounded-full bg-red-100 p-2 dark:bg-red-900">
            <Calendar className="h-4 w-4 text-red-600 dark:text-red-300" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">Data vencida</p>
            <p className="text-sm text-muted-foreground">
              O campo <span className="font-medium">{activity.fieldLabel}</span>{" "}
              do negócio{" "}
              <span className="font-medium">{activity.dealTitle}</span> venceu
            </p>
            <p className="text-xs text-muted-foreground">
              {activity.pipelineName} • {activity.currentStageName}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(activity.dueDate)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="border-b pb-4 last:border-b-0">
      {activity.type === ActivityType.DEAL_STAGE_TRANSITION &&
        renderDealStageTransition(activity)}
      {activity.type === ActivityType.DUE_DATE_EXPIRED &&
        renderDueDateExpired(activity)}
    </div>
  );
}
