import { Suspense } from "react";
import MagicLinkContent from "./MagicLickContent";

export default function MagicLinkPage() {
  return (
    <Suspense fallback={null}>
      <MagicLinkContent />
    </Suspense>
  );
}