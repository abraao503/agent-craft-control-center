import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface AdministrationBreadcrumbItem {
  label: string;
  to?: string;
}

export function AdministrationBreadcrumb({
  items,
}: {
  items: AdministrationBreadcrumbItem[];
}) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.flatMap((item, index) => {
          const isLast = index === items.length - 1;
          const breadcrumbItem = (
            <BreadcrumbItem key={`item-${item.label}-${index}`}>
              {item.to && !isLast ? (
                <BreadcrumbLink asChild>
                  <Link to={item.to}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          );

          return isLast
            ? [breadcrumbItem]
            : [
                breadcrumbItem,
                <BreadcrumbSeparator
                  key={`separator-${item.label}-${index}`}
                />,
              ];
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
