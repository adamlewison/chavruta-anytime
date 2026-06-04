import { House, Search, Users, MessageSquare, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Only rendered in the mobile bottom tab bar */
  mobileOnly?: boolean;
  /** Only rendered in the desktop top nav */
  desktopOnly?: boolean;
};

export const navItems: NavItem[] = [
  { label: "Home",        href: "/dashboard",   icon: House },
  { label: "Find",        href: "/find",         icon: Search },
  { label: "Network",     href: "/connections",  icon: Users },
  { label: "Messages",    href: "/messages",     icon: MessageSquare },
  { label: "Profile",     href: "/profile",      icon: User, mobileOnly: true },
];
