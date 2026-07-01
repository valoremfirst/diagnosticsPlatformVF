import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Already signed in? Skip the form.
  const user = await getCurrentUser();
  if (user) {
    redirect(
      user.role === "client" && user.companyId
        ? `/companies/${user.companyId}`
        : "/",
    );
  }
  return <LoginForm />;
}
