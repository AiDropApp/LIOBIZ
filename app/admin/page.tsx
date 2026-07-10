import { redirect } from "next/navigation";
import AdminPanel from "@/components/admin/AdminPanel";
import { getActiveSession } from "@/lib/require-session";

export const runtime = "nodejs";

export default async function AdminPage() {
  const session = await getActiveSession();
  if (!session || session.role !== "admin") {
    redirect("/login?next=/admin");
  }
  return <AdminPanel />;
}
