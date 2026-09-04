import { Suspense } from "react";
import { SavedPage } from "@/components/saved/SavedPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SavedPage />
    </Suspense>
  );
}
