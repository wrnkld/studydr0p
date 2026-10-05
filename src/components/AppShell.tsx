import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Layers, PanelLeftClose, PanelLeftOpen, Plus, UserRound, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { EXAMPLE_STUDIES } from "@/lib/exampleStudies";
import { STUDY_TYPE_META } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import AuthDialog from "@/components/AuthDialog";

export default function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authDestination, setAuthDestination] = useState("/studies");

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
        <Button variant="outline" className={cn("mt-3 w-full justify-start", compact && "justify-center px-0")}
          title={compact ? "New study" : undefined}
          onClick={() => user ? navigate("/studies/new") : requestAuth("/studies/new")}>
          <Plus />{!compact && "New study"}
        </Button>
        <div className="mt-8 border-t border-border pt-5">
          {!compact && <p className="mb-3 px-2 text-xs uppercase text-muted-foreground">Example studies</p>}
          {EXAMPLE_STUDIES.map((study, index) => (
            <Button key={study.id} asChild variant="ghost" className={cn("mb-1 h-auto min-h-10 w-full justify-start rounded-lg px-2 py-3 text-left",
              location.pathname === `/examples/${study.id}` && "bg-accent text-accent-foreground", compact && "justify-center px-0")}
            >
              <NavLink to={`/examples/${study.id}`} title={compact ? study.title : undefined}>
                {compact ? <span className="font-mono text-xs">0{index + 1}</span> : <span className="min-w-0 whitespace-normal">
                  <span className="block text-base leading-snug">{study.title}</span>
                  <span className="mt-1 block font-mono text-xs text-muted-foreground">{STUDY_TYPE_META[study.type].label}</span>
                </span>}
              </NavLink>
            </Button>
          ))}
        </div>
      </nav>
      <div className="shrink-0 border-t border-border px-3 py-4">
        {user ? <NavItem to="/account" icon={UserRound} label="Account info" compact={compact} /> :
          <Button variant="ghost" className={cn("w-full justify-start", compact && "justify-center px-0")}
            title={compact ? "Sign in" : undefined} onClick={() => requestAuth("/studies")}>
            <LogIn />{!compact && "Sign in"}
          </Button>}
        {!compact && <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 px-2 text-xs text-muted-foreground">
          <NavLink to="/home#privacy" className="hover:text-foreground">Privacy</NavLink>
          <NavLink to="/home#terms" className="hover:text-foreground">Terms</NavLink>
          <a href="mailto:hello@studydrop.app" className="hover:text-foreground">Contact</a>
        </div>}
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