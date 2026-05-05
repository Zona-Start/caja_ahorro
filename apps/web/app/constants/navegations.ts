// src/constants/navegations.ts
import { LayoutDashboard, LucideIcon, Users } from 'lucide-react';

export interface NavSubItem {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  requiresPermission?: {
    resource: string;
    action: string;
  };
  items?: NavSubItem[]; // Aquí definimos que es opcional
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Gestión",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Asociados",
        href: "/members",
        icon: Users,
        // Ahora TS no se quejará de esta propiedad
        items: [
          { label: "Lista", href: "/members/list" }
        ]
      },
     
    ]
  },
   {
    label: "Contabilidad",
    items: [
      {
        label: "Plan de Cuentas",
        href: "contabilidad/cuentas-contables",
        icon: LayoutDashboard,
      },
      {
        label: "Asociados",
        href: "/members",
        icon: Users,
        // Ahora TS no se quejará de esta propiedad
        items: [
          { label: "Lista", href: "/members/list" }
        ]
      },
     
    ]
  }
];