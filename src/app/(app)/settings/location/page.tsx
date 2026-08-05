import type { Metadata } from "next";
import { auth } from "@/server/auth";
import { getUserLocation } from "@/server/queries/users";
import { LocationSettings } from "@/components/settings/location-settings";

export const metadata: Metadata = {
  title: "Location & Timezone — Settings — ChavrutaAnytime",
};

export default async function LocationPage() {
  const session = await auth();

  let country = "";
  let timezone = "";

  if (session?.user?.id) {
    try {
      const row = await getUserLocation(session.user.id);
      if (row) {
        country = row.country ?? "";
        timezone = row.timezone ?? "";
      }
    } catch {
      // fall through with empty defaults
    }
  }

  return <LocationSettings initialCountry={country} initialTimezone={timezone} />;
}
