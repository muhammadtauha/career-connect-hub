import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Shield,
  GraduationCap,
  SendHorizonal,
  UserRound,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { CountUp } from "@/components/count-up";
import { NotificationBell } from "@/components/notification-bell";
import { statTone } from "@/lib/visual";
import { Wordmark } from "@/components/wordmark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS, signOutCompletely, useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };

const COMMON: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Project feed", icon: Search },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

const STUDENT: NavItem[] = [
  { to: "/applications", label: "My applications", icon: SendHorizonal },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { to: "/profile", label: "Profile", icon: UserRound },
];

const COMPANY: NavItem[] = [
  { to: "/company", label: "Company workspace", icon: Building2 },
  { to: "/students", label: "Student directory", icon: GraduationCap },
];


const ADMIN: NavItem[] = [{ to: "/admin", label: "Admin panel", icon: Shield }];

function useNavItems(): NavItem[] {
  const { role, roles } = useAuth();
  const base = role === "company" ? [...COMMON, ...COMPANY] : [...COMMON, ...STUDENT];
  return roles.includes("admin") ? [...base, ...ADMIN] : base;
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const items = useNavItems();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function UserMenu() {
  const { profile, user, role } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const initials =
    (profile?.full_name || user?.email || "?")
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full min-w-0 items-center gap-2.5 rounded-md p-2 text-left transition-colors hover:bg-sidebar-accent/60">
          <Avatar className="size-7 shrink-0">
            <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
            <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm">{profile?.full_name || user?.email}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {role ? ROLE_LABELS[role] : "Member"}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
          {user?.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={role === "company" ? "/company" : "/profile"}>
            <UserRound className="size-4" /> Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => {
            await signOutCompletely(queryClient);
            navigate({ to: "/auth", replace: true });
          }}
        >
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col justify-between border-r border-sidebar-border bg-sidebar p-3 lg:flex">
        <div className="space-y-6">
          <Link to="/dashboard" className="block px-1.5 py-1">
            <Wordmark />
          </Link>
          <NavLinks />
        </div>
        <UserMenu />
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation" className="lg:hidden">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-3">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-full flex-col justify-between">
                <div className="space-y-6">
                  <div className="px-1.5 py-1">
                    <Wordmark />
                  </div>
                  <NavLinks onNavigate={() => setOpen(false)} />
                </div>
                <UserMenu />
              </div>
            </SheetContent>
          </Sheet>
          <span className="lg:hidden">
            <Wordmark />
          </span>
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon = Briefcase,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: typeof Briefcase;
}) {
  const tone = statTone(label);
  return (
    <div className="panel card-interactive stagger-item relative overflow-hidden p-4">
      <span className={cn("absolute inset-y-0 left-0 w-[3px]", tone.bar)} aria-hidden />
      <div className="flex items-center justify-between gap-2">
        <span
          className="truncate text-xs font-medium tracking-wide text-muted-foreground/90 uppercase"
          title={label}
        >
          {label}
        </span>
        <span className={cn("grid size-7 shrink-0 place-items-center rounded-md", tone.icon)}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="count-pop mt-3 font-mono text-2xl font-semibold tabular-nums">
        <CountUp value={value} />
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground/80">{hint}</p> : null}
    </div>
  );
}
