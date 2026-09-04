import { Suspense } from "react";
import { Inbox } from "@/components/messages/Inbox";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Inbox />
    </Suspense>
  );
}
