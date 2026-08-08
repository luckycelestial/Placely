import { 
  LuLayoutDashboard,
  LuFileText,
  LuBriefcase,
  LuUser,
  LuSettings,
  LuFolderOpen,
  LuAward,
  LuActivity,
  LuLayers,
  LuMegaphone,
  LuChartBar,
  LuDatabase,
  LuWorkflow
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
    title: "Leaderboard",
    href: "/leaderboard",
    icon: LuAward,
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
    title: "Leaderboard",
    href: "/admin/leaderboard",
    icon: LuAward,
  },
  {
    title: "Students",
    href: "/admin/students",
    icon: LuUser,
  },
  {
    title: "Groups & Domains",
    href: "/admin/groups",
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
    icon: LuWorkflow,
  },
  /* {
    title: "Notices & Events",
    href: "/admin/notices",
    icon: LuMegaphone,
  }, */
  {
    title: "Documents Center",
    href: "/admin/documents",
    icon: LuFolderOpen,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: LuSettings,
  },
];
