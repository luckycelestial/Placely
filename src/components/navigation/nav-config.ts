import { 
  LuLayoutDashboard,
  LuFileText,
  LuBriefcase,
  LuUser,
  LuSettings,
  LuFolderOpen,
  LuBell,
  LuAward,
  LuActivity
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
