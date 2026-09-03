import { redirect } from "next/navigation";
import { AuthProvider } from "@/components/AuthProvider";
import { getSession } from "@/lib/session";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <AuthProvider
      user={{ id: session.sub, email: session.email, name: session.name, role: session.role }}
    >
      {children}
    </AuthProvider>
  );
}
