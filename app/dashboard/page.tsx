import { redirect } from "next/navigation";
import ClientDashboard from "@/components/dashboard/ClientDashboard";
import { getActiveSession } from "@/lib/require-session";

export const runtime = "nodejs";

export default async function DashboardPage() {
  const session = await getActiveSession();
  if (!session) {
    redirect("/login?next=/dashboard");
  }
  if (session.role === "admin") {
    // Admins may view client dashboard; blocked already filtered
  } else if (session.role !== "client") {
    redirect("/login?next=/dashboard");
  }
  return <ClientDashboard />;
}
