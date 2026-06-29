import Link from "next/link";

import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="font-display text-7xl text-teal">404</div>
      <h1 className="mt-3 font-display text-2xl text-ink">Diagnostic not found</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        The page or diagnostic you're looking for doesn't exist or may have been
        removed.
      </p>
      <Link href="/" className="mt-6">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  );
}
