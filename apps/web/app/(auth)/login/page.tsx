import LoginPageClient from "./loginPageClient";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from = "/" } = await searchParams;

  return <LoginPageClient from={from} />;
}
