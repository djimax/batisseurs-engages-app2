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
  UserCheck,
  Calendar,
  History,
  Shield,
  Eye,
  Mail,
  BarChart3,
  PhoneCall,
  Globe,
  Cog,
  Lock,
  Briefcase,
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
  
  // Gestion Documentaire
  { label: "📁 Gestion Documentaire", isGroup: true, items: [
    { icon: FileText, label: "Documents", path: "/documents" },
    { icon: FolderOpen, label: "Catégories", path: "/categories" },
    { icon: Archive, label: "Archives", path: "/archives" },
  ]},
  
  // Gestion des Membres
  { label: "👥 Gestion des Membres", isGroup: true, items: [
    { icon: Users, label: "Membres", path: "/members" },
    { icon: UserCheck, label: "Adhésions", path: "/members/adhesions" },
    { icon: UserCheck, label: "Liste des Adhérents", path: "/adhesions-list" },
    { icon: Shield, label: "Gestion des Rôles", path: "/admin/roles", adminOnly: true },
  ]},
  
  // Projets & Événements
  { label: "💼 Projets & Événements", isGroup: true, items: [
    { icon: Briefcase, label: "Projets", path: "/projects" },
    { icon: Calendar, label: "Événements", path: "/events" },
    { icon: Megaphone, label: "Campagnes", path: "/campaigns" },
  ]},
  
  // Groupes & Antennes
  { label: "🏢 Groupes & Antennes", isGroup: true, items: [
    { icon: MapPin, label: "Antennes", path: "/antennes" },
    { icon: MapPin, label: "Groupes & Antennes (Legacy)", path: "/groupes-antennes" },
  ]},
  
  // Finances
  { label: "💰 Finances", isGroup: true, items: [
    { icon: DollarSign, label: "Finance", path: "/finance" },
  ]},
  
  // CRM
  { label: "📞 CRM", isGroup: true, adminOnly: true, items: [
    { icon: Users, label: "Tableau de Bord CRM", path: "/crm", adminOnly: true },
    { icon: Users, label: "Contacts", path: "/crm/contacts", adminOnly: true },
    { icon: PhoneCall, label: "Activités", path: "/crm/activities", adminOnly: true },
    { icon: BarChart3, label: "Rapports", path: "/crm/reports", adminOnly: true },
  ]},
  
  // Communication
  { label: "📢 Communication", isGroup: true, items: [
    { icon: Megaphone, label: "Annonces", path: "/announcements" },
    { icon: Mail, label: "Emails", path: "/email-composer" },
  ]},
  
  // Administration
  { label: "⚙️ Administration", isGroup: true, adminOnly: true, items: [
    { icon: Settings, label: "Paramètres Globaux", path: "/global-settings", adminOnly: true },
    { icon: Users, label: "Utilisateurs", path: "/users", adminOnly: true },
    { icon: Eye, label: "Journaux d'Audit", path: "/admin/audit-logs", adminOnly: true },
    { icon: Shield, label: "Réinitialisations MDP", path: "/admin/password-resets", adminOnly: true },
  ]},
  
  // Activité & Logs
  { label: "📊 Activité & Logs", isGroup: true, items: [
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="Les Batisseurs Engages" className="w-16 h-16 object-contain" />
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
            className="w-full shadow-lg hover:shadow-xl transition-all"
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
                className="w-full flex items-center gap-2 px-2 py-2 text-xs font-semibold text-white/70 hover:text-white transition-colors group-data-[collapsible=icon]:hidden"
              >
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
                className={`h-10 transition-all font-normal ${
                  level > 0 ? "pl-6" : ""
                } ${
                  isActive
                    ? "bg-accent text-primary hover:bg-accent"
                    : "text-white/80 hover:bg-primary/80 hover:text-white"
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
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-primary/20">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-primary/80 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-white/80" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain shrink-0" />
                  <span className="font-semibold tracking-tight truncate text-sm text-white">
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

          <SidebarFooter className="p-3 border-t border-primary/20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-primary/80 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  <Avatar className="h-9 w-9 border shrink-0 bg-accent">
                    <AvatarFallback className="text-xs font-medium bg-accent text-primary">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-white">
                      {user?.name || "Utilisateur"}
                    </p>
                    <p className="text-xs text-white/60 truncate mt-1.5">
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
              className="absolute right-0 top-0 bottom-0 w-1 hover:bg-accent/50 cursor-col-resize transition-colors"
            />
          )}
        </Sidebar>
      </div>

      <SidebarInset>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3 h-16">
            <SidebarTrigger className="-ml-1" />
          </div>
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>
    </>
  );
}
