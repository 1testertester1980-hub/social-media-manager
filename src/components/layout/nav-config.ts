import {
  LayoutDashboard,
  Film,
  Calendar,
  BarChart3,
  Users,
  Bell,
  Settings,
  ListChecks,
  UserCircle,
} from "lucide-react";

export const ADMIN_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/content", label: "Content", icon: Film },
  { href: "/calendar", label: "Kalendár", icon: Calendar },
  { href: "/analytics", label: "Analytika", icon: BarChart3 },
  { href: "/profiles", label: "Profily", icon: Users },
  { href: "/notifications", label: "Notifikácie", icon: Bell },
  { href: "/settings", label: "Nastavenia", icon: Settings },
];

export const WORKER_NAV = [
  { href: "/my-tasks", label: "Moje úlohy", icon: ListChecks },
  { href: "/calendar", label: "Kalendár", icon: Calendar },
  { href: "/notifications", label: "Notifikácie", icon: Bell },
  { href: "/account", label: "Profil", icon: UserCircle },
];
