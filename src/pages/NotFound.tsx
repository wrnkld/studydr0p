import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/study/primitives";

export default function NotFound() {
  return (
    <PageContainer space="md">
      <PageHeader
        title="Page not found"
        description="The link you followed may be broken, or the page may have been removed."
      />
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </PageContainer>
  );
}
