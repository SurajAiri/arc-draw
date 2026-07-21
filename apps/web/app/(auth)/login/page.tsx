import { Suspense } from "react";
import LoginContent from "./LoginContent";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginLoading() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex justify-center">
        <div className="h-12 w-40 animate-pulse rounded bg-muted" />
      </div>

      <div className="glass rounded-2xl p-8">
        <div className="space-y-4">
          <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          <div className="h-4 w-56 animate-pulse rounded bg-muted" />

          <div className="h-11 animate-pulse rounded-xl bg-muted" />
          <div className="h-11 animate-pulse rounded-xl bg-muted" />
          <div className="h-11 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
