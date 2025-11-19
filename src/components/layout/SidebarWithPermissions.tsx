import { usePermissions } from "@/hooks/usePermissions";
import { ReactNode } from "react";
import {
  SidebarMenuItem,
  filterSidebarItems,
} from "@/utils/sidebar";

interface SidebarWithPermissionsProps {
  items: SidebarMenuItem[];
  renderItem: (item: SidebarMenuItem) => ReactNode;
}

export function SidebarWithPermissions({
  items,
  renderItem,
}: SidebarWithPermissionsProps) {
  const { has, hasAny, hasAll } = usePermissions();

  const visibleItems = filterSidebarItems(items, has, hasAny, hasAll);

  return <>{visibleItems.map(renderItem)}</>;
}
