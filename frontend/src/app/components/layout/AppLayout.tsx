import { useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Dumbbell,
  BookOpen,
  TrendingUp,
  Apple,
  User,
  Menu,
  X,
  Bell,
  Search,
  Flame,
  ChevronRight,
  LogOut,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../ui/utils";
import { useAuth } from "../../../hooks/useAuth";
import { useNotifications } from "../../../hooks/useNotifications";
import { formatNotifTime } from "../../../services/notificationStore";
import { Toaster } from "../ui/sonner";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/workouts", icon: Dumbbell, label: "Workouts" },
  { path: "/exercises", icon: BookOpen, label: "Exercises" },
  { path: "/progress", icon: TrendingUp, label: "Progress" },
  { path: "/nutrition", icon: Apple, label: "Nutrition" },
  { path: "/profile", icon: User, label: "Profile" },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, hasUnread, unreadCount, markRead, markAllRead, clearAll } =
    useNotifications();

  const displayName = user?.nome || "Usuario";
  const initials = displayName
    .split(" ")
    .map((name) => name[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const currentPage = navItems.find((item) =>
    item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path)
  );

  const bottomNavItems = navItems.slice(0, 5);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 p-6 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Flame className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">FitPlan</span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 mt-4 rounded-xl bg-accent/50">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src="icon" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">Membro FitPlan</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
          <div className="flex items-center gap-1 mt-3 p-2 bg-orange-50 rounded-lg">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-medium text-orange-600">14-day streak!</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 mt-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
                {item.label === "Nutrition" && (
                  <Badge className="ml-auto text-[10px] py-0 px-1.5 h-4 bg-green-500 text-white hover:bg-green-500">
                    New
                  </Badge>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            className="w-full mb-3 gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" /> Sair
          </Button>
          <div className="text-xs text-muted-foreground text-center">
            FitPlan Pro · v2.4.1
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center gap-3 px-4 sm:px-6 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-12 w-12"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate">
              {currentPage?.label || "FitPlan"}
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block truncate">
              {formattedDate}
            </p>
          </div>

          {/* Search */}
          <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-2 w-48 lg:w-64">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              placeholder="Search..."
              className="bg-transparent text-sm outline-none placeholder:text-muted-foreground flex-1 w-full"
            />
          </div>

          {/* Notifications */}
          <Popover
            open={notifOpen}
            onOpenChange={(open) => {
              setNotifOpen(open);
              if (open && hasUnread) markAllRead();
            }}
          >
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-11 w-11 shrink-0">
                <Bell className="w-5 h-5" />
                {hasUnread && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 max-h-[480px] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">Notificações</p>
                  {unreadCount > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 h-4 bg-red-500 text-white hover:bg-red-500">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                      title="Marcar todas como lidas"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                      title="Limpar todas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="overflow-y-auto flex-1 divide-y divide-border">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                    <Bell className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      As notificações aparecem aqui quando você completa treinos e mais.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => markRead(notif.id)}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                        notif.unread && "bg-blue-50/60"
                      )}
                    >
                      <span className="text-xl shrink-0 mt-0.5">{notif.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{notif.title}</p>
                          {notif.unread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.body}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          {formatNotifTime(notif.createdAt)}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-border shrink-0">
                  <p className="text-xs text-muted-foreground text-center">
                    {unreadCount > 0
                      ? `${unreadCount} não lida${unreadCount !== 1 ? "s" : ""}`
                      : "Você está em dia com todas as notificações."}
                  </p>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Avatar */}
          <Avatar className="w-9 h-9 cursor-pointer shrink-0" onClick={() => navigate("/profile")}>
            <AvatarImage src="icon" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex lg:hidden z-30">
        {bottomNavItems.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <Toaster richColors position="top-right" />
    </div>
  );
}
