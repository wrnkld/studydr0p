import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// Minimal header per wireframes: logo on the left, Sign in / Sign out on the right.
export default function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-border">
      <div className="container flex h-14 items-center justify-between">
        <Link
          to={user ? "/dashboard" : "/"}
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span
            aria-hidden
            className="inline-block h-6 w-6 rounded-md bg-foreground"
          />
          StudyDrop
        </Link>

        {user ? (
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        ) : (
          <Link
            to="/login"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
