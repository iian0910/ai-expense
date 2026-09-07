import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPendingOAuthProfile } from "@/lib/oauthSession";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  const pending = await getPendingOAuthProfile();

  return (
    <RegisterForm
      oauthProfile={
        pending
          ? {
              name: pending.name,
              email: pending.email,
              avatarUrl: pending.avatarUrl,
            }
          : null
      }
    />
  );
}
