import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type OperationPageHeaderProps = {
  title: ReactNode;
  description: ReactNode;
  eyebrow?: string;
  breadcrumb?: {
    current: string;
    parent?: {
      label: string;
      to: string;
    };
  };
  actions?: ReactNode;
};

export function OperationPageHeader({
  title,
  description,
  eyebrow = "Configuração operacional",
  breadcrumb,
  actions,
}: OperationPageHeaderProps) {
  const header = (
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      {actions ? (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );

  if (!breadcrumb) return header;

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumb.parent ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={breadcrumb.parent.to}>{breadcrumb.parent.label}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          ) : null}
          <BreadcrumbItem>
            <BreadcrumbPage>{breadcrumb.current}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {header}
    </div>
  );
}
