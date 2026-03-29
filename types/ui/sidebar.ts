export interface SubItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SidebarItemType {
  href: string;
  label: string;
  labelKey?: string;
  icon?: React.ReactNode;
  Icon?: React.ElementType<any>;
  iconProps?: Record<string, any>;
  subItems?: SubItem[];
  badgeCount?: number;
}
