import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./LoginForm";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_not_configured: "此登入方式尚未設定，請聯絡管理員",
  oauth_state_mismatch: "登入逾時或驗證失敗，請再試一次",
  oauth_no_email: "此帳號未提供 email，無法登入",
  oauth_failed: "登入失敗，請稍後再試",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  const { error } = await props.searchParams;
  const errorCode = typeof error === "string" ? error : undefined;
  const initialError = errorCode ? OAUTH_ERROR_MESSAGES[errorCode] ?? null : null;

  return <LoginForm initialError={initialError} />;
}
