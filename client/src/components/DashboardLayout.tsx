import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard, 
  LogOut, 
  PanelLeft, 
  Users, 
  FileText, 
  FolderOpen,
  Settings,
  Activity,
  Building2,
  Archive,
  DollarSign,
  Megaphone,
  Bell,
  UserCheck,
  Calendar,
  History,
  Shield,
  Eye,
  Mail,
  Newspaper,
  BarChart3,
  PhoneCall,
  Globe,
  Cog,
  Lock,
  Briefcase,
  Gavel,
  ChevronDown,
  MapPin
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { useAuth as useAuthHook } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type MenuItem = {
  icon?: any;
  label: string;
  path?: string;
  adminOnly?: boolean;
  isGroup?: boolean;
  items?: MenuItem[];
};

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/dashboard" },
  
  // Gestion documentaire
  { icon: FolderOpen, label: "Gestion documentaire", isGroup: true, items: [
    { icon: FileText, label: "Documents", path: "/documents" },
    { icon: FolderOpen, label: "Catégories", path: "/categories" },
    { icon: Archive, label: "Archives", path: "/archives" },
  ]},
  
  // Gestion des membres
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: Users, label: "Gestion des membres", isGroup: true, items: [
    { icon: Users, label: "Membres", path: "/members" },
    { icon: Users, label: "Annuaire interne", path: "/member-directory" },
    { icon: UserCheck, label: "Adhésions", path: "/members/adhesions" },
    { icon: UserCheck, label: "Liste des Adhérents", path: "/adhesions-list" },
    { icon: UserCheck, label: "Mon espace adhérent", path: "/member-portal" },
    { icon: Shield, label: "Gestion des Rôles", path: "/admin/roles", adminOnly: true },
    { icon: Lock, label: "Permissions & Périmètres", path: "/admin/permissions", adminOnly: true },
  ]},
  
  // Projets et événements
  { icon: Briefcase, label: "Projets et événements", isGroup: true, items: [
    { icon: Briefcase, label: "Projets", path: "/projects" },
    { icon: Calendar, label: "Événements", path: "/events" },
    { icon: Megaphone, label: "Campagnes", path: "/campaigns" },
    { icon: Gavel, label: "Gouvernance & AG", path: "/governance" },
  ]},
  
  // Groupes et antennes
  { icon: MapPin, label: "Groupes et antennes", isGroup: true, items: [
    { icon: MapPin, label: "Antennes", path: "/antennes" },
    { icon: MapPin, label: "Groupes & Antennes (Legacy)", path: "/groupes-antennes" },
  ]},
  
  // Finances
  { icon: DollarSign, label: "Finances", isGroup: true, items: [
    { icon: DollarSign, label: "Finance", path: "/finance" },
  ]},
  
  // CRM
  { icon: PhoneCall, label: "CRM", isGroup: true, adminOnly: true, items: [
    { icon: Users, label: "Tableau de Bord CRM", path: "/crm", adminOnly: true },
    { icon: Users, label: "Contacts", path: "/crm/contacts", adminOnly: true },
    { icon: PhoneCall, label: "Activités", path: "/crm/activities", adminOnly: true },
    { icon: BarChart3, label: "Rapports", path: "/crm/reports", adminOnly: true },
  ]},
  
  // Communication
  { icon: Megaphone, label: "Communication", isGroup: true, items: [
    { icon: Megaphone, label: "Annonces", path: "/announcements" },
    { icon: Newspaper, label: "Actualités", path: "/news" },
    { icon: Mail, label: "Composer un email", path: "/email-composer" },
    { icon: FileText, label: "Templates email", path: "/email-templates" },
    { icon: History, label: "Historique emails", path: "/email-history" },
  ]},
  
  // Administration
  { icon: Settings, label: "Administration", isGroup: true, adminOnly: true, items: [
    { icon: Settings, label: "Paramètres Globaux", path: "/global-settings", adminOnly: true },
    { icon: Users, label: "Utilisateurs", path: "/users", adminOnly: true },
    { icon: Eye, label: "Journaux d'Audit", path: "/admin/audit-logs", adminOnly: true },
    { icon: Shield, label: "Réinitialisations MDP", path: "/admin/password-resets", adminOnly: true },
  ]},
  
  // Activité et logs
  { icon: BarChart3, label: "Activité et logs", isGroup: true, items: [
    { icon: Activity, label: "Activité", path: "/activity" },
    { icon: History, label: "Historique d'audit", path: "/audit-history" },
  ]},
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
  onLogout,
}: {
  children: React.ReactNode;
  onLogout?: () => void;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuthHook();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
        <div className="app-auth-shell flex items-center justify-center min-h-screen p-4">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="brand-mark mb-4">
              <img src="/logo.png" alt="Les Bâtisseurs Engagés" className="h-14 w-14 object-contain" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-center">
              Les Bâtisseurs Engagés
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Plateforme de gestion documentaire pour associations. Connectez-vous pour accéder à vos documents.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full button-interactive shadow-[0_12px_24px_-16px_var(--primary)]"
          >
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth} onLogout={onLogout}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
  onLogout?: () => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
  onLogout,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuthHook() as any;
  const handleLogout = onLogout || logout;
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const toggleGroup = (groupLabel: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupLabel)) {
      newExpanded.delete(groupLabel);
    } else {
      newExpanded.add(groupLabel);
    }
    setExpandedGroups(newExpanded);
  };

  const isItemActive = (path?: string) => location === path;

  const renderMenuItems = (items: MenuItem[], level = 0) => {
    return items
      .filter(item => {
        if (item.adminOnly && user?.role !== "admin") {
          return false;
        }
        return true;
      })
      .map((item, index) => {
        if (item.isGroup && item.items) {
          const isExpanded = expandedGroups.has(item.label);
          return (
            <div key={`group-${index}`}>
              <button
                onClick={() => toggleGroup(item.label)}
                className="sidebar-section-label w-full flex items-center gap-2 px-2.5 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-sidebar-foreground/55 hover:text-sidebar-foreground transition-colors group-data-[collapsible=icon]:hidden"
              >
                {item.icon && <item.icon className="h-3.5 w-3.5 opacity-80" />}
                <span>{item.label}</span>
                <ChevronDown
                  className={`h-3 w-3 ml-auto transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isExpanded && (
                <div className="space-y-1">
                  {renderMenuItems(item.items, level + 1)}
                </div>
              )}
            </div>
          );
        }

        if (item.path) {
          const isActive = isItemActive(item.path);
          return (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                isActive={isActive}
                onClick={() => setLocation(item.path!)}
                tooltip={item.label}
                  className={`h-10 rounded-xl font-medium transition-[background-color,color,transform,box-shadow] duration-200 active:scale-[0.98] ${
                  level > 0 ? "pl-6" : ""
                } ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[0_8px_18px_-14px_oklch(0.78_0.14_39_/_0.9)] hover:bg-sidebar-accent"
                    : "text-sidebar-foreground/78 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground"
                }`}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        }

        return null;
      });
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
          <Sidebar
          collapsible="icon"
          className="border-r-0 shadow-[12px_0_35px_-28px_oklch(0.18_0.06_184_/_0.7)]"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-20 justify-center border-b border-sidebar-border/60">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center rounded-xl text-sidebar-foreground/80 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground transition-[background-color,color,transform] duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-sidebar-foreground/80" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-sidebar-foreground/95 p-1 shadow-sm">
                    <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
                  </div>
                  <span className="font-extrabold tracking-tight truncate text-sm text-sidebar-foreground">
                    Bâtisseurs Engagés
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 pt-2">
            <SidebarMenu className="px-2 py-1">
              {renderMenuItems(menuItems)}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-sidebar-border/60">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-xl px-1.5 py-1.5 hover:bg-sidebar-foreground/10 transition-[background-color,transform] duration-200 active:scale-[0.99] w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
                  <Avatar className="h-9 w-9 border shrink-0 bg-accent">
                    <AvatarFallback className="text-xs font-bold bg-sidebar-accent text-sidebar-accent-foreground">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-semibold truncate leading-none text-sidebar-foreground">
                      {user?.name || "Utilisateur"}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setLocation("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Paramètres Utilisateur</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    handleLogout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>

          {!isCollapsed && (
            <div
              onMouseDown={() => setIsResizing(true)}
              className="absolute right-0 top-0 bottom-0 w-1 hover:bg-sidebar-accent/60 cursor-col-resize transition-colors"
            />
          )}
        </Sidebar>
      </div>

      <SidebarInset>
        <div className="app-shell flex flex-col h-full">
          <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/70 bg-background/85 px-4 py-3 h-16 backdrop-blur-xl sm:px-6">
            <SidebarTrigger className="-ml-1 rounded-xl text-primary hover:bg-primary/10 hover:text-primary" />
            <div className="hidden min-w-0 items-center gap-2 text-sm text-muted-foreground sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_oklch(0.72_0.14_150_/_0.14)]" />
              <span>Plateforme associative</span>
            </div>
          </div>
          <main className="flex-1 overflow-auto">
            <div className="app-page p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>
    </>
  );
}
