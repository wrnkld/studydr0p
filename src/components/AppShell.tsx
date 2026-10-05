import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Layers, PanelLeftClose, PanelLeftOpen, UserRound, LogIn, ChevronUp, CreditCard, LogOut, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { EXAMPLE_STUDIES } from "@/lib/exampleStudies";
import { STUDY_TYPE_ICONS } from "@/lib/studyTypeIcons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import AuthDialog from "@/components/AuthDialog";
import NewStudyMenu from "@/components/NewStudyMenu";
import Account, { type AccountSection } from "@/pages/Account";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authDestination, setAuthDestination] = useState("/studies");
  const [personName, setPersonName] = useState("Your account");
  const [accountSection, setAccountSection] = useState<AccountSection | null>(null);

  useEffect(() => {
    setAccountSection(null);
    if (!user) return;
    let cancelled = false;
    setPersonName(user.user_metadata?.full_name || user.user_metadata?.first_name || "Your account");
    void supabase.from("researchers").select("first_name, last_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      const name = [data?.first_name, data?.last_name].filter(Boolean).join(" ");
      if (!cancelled && name) setPersonName(name);
    });
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  if (location.pathname.startsWith("/s/")) return <>{children}</>;

  const requestAuth = (destination: string) => {
    setAuthDestination(destination);
    setMobileOpen(false);
    setAuthOpen(true);
  };
  const navigation = (compact = false) => (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 shrink-0 items-center border-b border-border px-5", compact && "justify-center px-2")}>
        <NavLink to="/" className="font-serif text-base font-semibold" aria-label="StudyDrop">
          {compact ? "SD" : "StudyDrop"}
        </NavLink>
      </div>
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-5">
        <NavItem to="/home" icon={Home} label="Home" compact={compact} />
        {user ? <NavItem to="/studies" icon={Layers} label="Studies" compact={compact} /> : null}
        <NewStudyMenu compact={compact} className="mb-1 w-full" onSelect={type => {
          const destination = `/studies/new?type=${type}`;
          user ? navigate(destination) : requestAuth(destination);
        }} />
        <div className="mt-8 border-t border-border pt-5">
          {!compact && <p className="mb-3 px-2 text-xs uppercase text-muted-foreground">Example studies</p>}
          {EXAMPLE_STUDIES.map(study => {
            const Icon = STUDY_TYPE_ICONS[study.type];
            return <Button key={study.id} asChild variant="ghost" className={cn("mb-1 h-10 w-full justify-start rounded-lg px-2 text-left",
              location.pathname === `/examples/${study.id}` && "bg-accent text-accent-foreground", compact && "justify-center px-0")}
            >
              <NavLink to={`/examples/${study.id}`} title={study.title} aria-label={study.title}>
                <Icon />{!compact && <span className="min-w-0 truncate">{study.title}</span>}
              </NavLink>
            </Button>;
          })}
        </div>
      </nav>
      <div className="shrink-0 border-t border-border px-3 py-4">
        {user ? <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" aria-label={personName} title={compact ? personName : undefined} className={cn("h-10 w-full justify-start px-2", compact && "justify-center px-0")}>
              <UserRound />{!compact && <><span className="min-w-0 truncate">{personName}</span><ChevronUp className="ml-auto" /></>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start">
            <DropdownMenuItem onSelect={() => { setMobileOpen(false); setAccountSection("billing"); }}><CreditCard />Billing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => { void signOut().then(() => navigate("/")); }}><LogOut />Sign out</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => { setMobileOpen(false); setAccountSection("account"); }} className="text-destructive"><Trash2 />Delete account</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> :
          <Button variant="ghost" className={cn("h-10 w-full justify-start px-2", compact && "justify-center px-0")}
            title={compact ? "Sign in" : undefined} onClick={() => requestAuth("/studies")}>
            <LogIn />{!compact && "Sign in"}
          </Button>}
      </div>
    </div>
  );
  const currentExample = EXAMPLE_STUDIES.find((study) => location.pathname === `/examples/${study.id}`);
  const pageLabel = currentExample ? currentExample.title : location.pathname === "/home" ? "Home" :
    location.pathname === "/account" ? "Account info" : location.pathname.startsWith("/studies") ? "Studies" : "StudyDrop";

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 border-r border-border bg-muted/40 md:block", collapsed ? "w-16" : "w-64")}>
        {navigation(collapsed)}
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
          <Button variant="ghost" size="icon" className="hidden md:inline-flex"
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} title={collapsed ? "Expand navigation" : "Collapse navigation"}
            onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><PanelLeftOpen /></Button>
          <span className="min-w-0 truncate text-base font-medium">{pageLabel}</span>
          {currentExample && <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">20 responses</span>}
        </header>
        {children}
      </div>
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent aria-describedby={undefined} className="left-0 top-0 h-[100dvh] w-72 max-w-[85vw] translate-x-0 translate-y-0 gap-0 rounded-none p-0 sm:rounded-none">
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          {navigation()}
        </DialogContent>
      </Dialog>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} onAuthed={() => navigate(authDestination)} />
      <Dialog open={accountSection !== null} onOpenChange={open => { if (!open) setAccountSection(null); }}>
        <DialogContent aria-describedby={undefined} className="max-h-[85dvh] overflow-y-auto">
          <DialogTitle>{personName}</DialogTitle>
          {accountSection && <Account section={accountSection} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NavItem({ to, icon: Icon, label, compact }: { to: string; icon: typeof Home; label: string; compact: boolean }) {
  return <Button asChild variant="ghost" className="mb-1 h-10 w-full justify-start rounded-lg px-2">
    <NavLink to={to} end title={compact ? label : undefined} className={({ isActive }) => cn(isActive && "bg-accent text-accent-foreground", compact && "justify-center")}>
      <Icon />{!compact && label}
    </NavLink>
  </Button>;
}