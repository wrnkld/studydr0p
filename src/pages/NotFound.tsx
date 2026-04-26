import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">

      <main className="container flex max-w-md flex-col py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-3 text-muted-foreground">
          The link you followed may be broken, or the page may have been removed.
        </p>
        <div className="mt-8">
          <Button asChild>
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
