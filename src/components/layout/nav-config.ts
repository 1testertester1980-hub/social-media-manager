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
  ScrollText,
  Target,
} from "lucide-react";

export const ADMIN_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/content", label: "Content", icon: Film },
  { href: "/calendar", label: "Kalendár", icon: Calendar },
  { href: "/analytics", label: "Analytika", icon: BarChart3 },
  { href: "/profiles", label: "Profily", icon: Users },
  { href: "/marketing-strategia", label: "Marketingová stratégia", icon: Target },
  { href: "/notifications", label: "Notifikácie", icon: Bell },
  { href: "/settings", label: "Nastavenia", icon: Settings },
];

export const WORKER_NAV = [
  { href: "/my-tasks", label: "Moje úlohy", icon: ListChecks },
  { href: "/calendar", label: "Kalendár", icon: Calendar },
  { href: "/marketing-strategia", label: "Marketingová stratégia", icon: Target },
  { href: "/pravidla", label: "Pravidlá", icon: ScrollText },
  { href: "/notifications", label: "Notifikácie", icon: Bell },
  { href: "/account", label: "Profil", icon: UserCircle },
];
