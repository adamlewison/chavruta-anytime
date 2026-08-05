import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { NotificationList, type NotificationRow } from "@/components/notifications/notification-list";
import { listNotifications } from "@/server/queries/notifications";

export const metadata: Metadata = {
  title: "Notifications — ChavrutaAnytime",
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (!session.user.onboardedAt) redirect("/onboarding");

  let notifs: NotificationRow[] = [];

  try {
    notifs = await listNotifications(session.user.id);
  } catch (err) {
    console.error("Notifications query error:", err);
  }

  return <NotificationList notifs={notifs} />;
}
