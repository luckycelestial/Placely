import { 
  LuLayoutDashboard,
  LuFileText,
  LuBriefcase,
  LuUser,
  LuSettings,
  LuFolderOpen,
  LuBell,
  LuAward,
  LuActivity,
  LuLayers,
  LuMegaphone,
  LuChartBar
} from "react-icons/lu";

export const STUDENT_NAV_ITEMS = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LuLayoutDashboard,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: LuUser,
  },
  {
    title: "Job Opportunities",
    href: "/drives",
    icon: LuBriefcase,
  },
  {
    title: "My Progress",
    href: "/progress",
    icon: LuActivity,
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: LuBell,
  },
  {
    title: "Documents Center",
    href: "/documents",
    icon: LuFolderOpen,
  },
];

export const ADMIN_NAV_ITEMS = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LuLayoutDashboard,
  },
  {
    title: "Reports & Analytics",
    href: "/admin/reports",
    icon: LuActivity,
  },
  {
    title: "Visual Analytics",
    href: "/admin/analytics",
    icon: LuChartBar,
  },
  {
    title: "Students",
    href: "/admin/students",
    icon: LuUser,
  },
  {
    title: "Data Workspace",
    href: "/admin/data",
    icon: LuLayers,
  },
  {
    title: "Companies & Drives",
    href: "/admin/drives",
    icon: LuBriefcase,
  },
  {
    title: "ATS Tracker",
    href: "/admin/ats",
    icon: LuLayers,
  },
  {
    title: "Notices & Events",
    href: "/admin/notices",
    icon: LuMegaphone,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: LuSettings,
  },
];
