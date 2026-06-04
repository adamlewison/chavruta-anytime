import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getNotificationSettings } from "@/server/actions/notifications";
import { NotificationSettings } from "@/components/settings/notification-settings";

export const metadata: Metadata = {
  title: "Notifications — Settings — ChavrutaAnytime",
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { disabled } = await getNotificationSettings();

  return <NotificationSettings disabledKeys={[...disabled]} />;
}
