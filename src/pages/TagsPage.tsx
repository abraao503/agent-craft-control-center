import React from "react";
import { TagManager } from "@/components/tags/TagManager";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { useTranslation } from "react-i18next";

export default function TagsPage() {
  const { currentWorkspace } = useWorkspaceContext();
  const { t } = useTranslation();

  if (!currentWorkspace?.id) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-muted-foreground">
          {t("tags.selectWorkspace")}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("tags.title")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("tags.description")}
        </p>
      </div>
      <div className="bg-card border rounded-lg p-6">
        <TagManager workspaceId={currentWorkspace.id} />
      </div>
    </div>
  );
}
