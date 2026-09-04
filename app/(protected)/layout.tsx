import { redirect } from "next/navigation";
import { AuthProvider } from "@/components/AuthProvider";
import { getSession } from "@/lib/session";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  await connectToDatabase();
  const dbUser = await User.findById(session.sub).select("avatarUrl").lean();

  return (
    <AuthProvider
      user={{
        id: session.sub,
        email: session.email,
        name: session.name,
        role: session.role,
        avatarUrl: (dbUser?.avatarUrl as string | undefined) ?? null,
      }}
    >
      {children}
    </AuthProvider>
  );
}
