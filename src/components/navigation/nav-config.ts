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
  LuMegaphone
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
    title: "My Applications",
    href: "/applications",
    icon: LuFileText,
  },
  {
    title: "My Progress",
    href: "/progress",
    icon: LuActivity,
  },
  {
    title: "Offers & Joining",
    href: "/offers",
    icon: LuAward,
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
    title: "Students",
    href: "/admin/students",
    icon: LuUser,
  },
  {
    title: "Companies & Drives",
    href: "/admin/drives",
    icon: LuBriefcase,
  },
  {
    title: "Applications",
    href: "/admin/applications",
    icon: LuFileText,
  },
  {
    title: "ATS Tracker",
    href: "/admin/ats",
    icon: LuLayers,
  },
  {
    title: "Offers & Joinees",
    href: "/admin/offers",
    icon: LuAward,
  },
  {
    title: "Reports & Analytics",
    href: "/admin/reports",
    icon: LuActivity,
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
