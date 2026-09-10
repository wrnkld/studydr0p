import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function Account() {
  useDocumentTitle("Account info · StudyDrop");

  return (
    <div className="container max-w-5xl py-10">
      <h1 className="text-4xl font-semibold font-serif">Hello world</h1>
    </div>
  );
}
