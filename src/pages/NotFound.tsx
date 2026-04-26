import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container py-16 space-y-4">
      <h1>Page not found</h1>
      <p className="text-muted-foreground">
        The link you followed may be broken, or the page may have been removed.
      </p>
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </main>
  );
}
