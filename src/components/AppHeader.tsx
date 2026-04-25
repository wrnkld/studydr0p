import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// Minimal header per wireframes: logo on the left, Sign in / Sign out on the right.
export default function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="p-6 flex items-center justify-between">
      <Link to={user ? "/studies" : "/"} className="underline">
        StudyDrop
      </Link>
      {user && (
        <button
          type="button"
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
          className="underline"
        >
          Sign out
        </button>
      )}
    </header>
  );
}
