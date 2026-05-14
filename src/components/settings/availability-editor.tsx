"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GridPicker } from "@/components/availability/grid-picker";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateAvailability } from "@/server/actions/profile";

interface AvailabilityEditorProps {
  initialBitmapBase64: string | null;
  timezone: string;
}

export function AvailabilityEditor({
  initialBitmapBase64,
  timezone,
}: AvailabilityEditorProps) {
  const [bitmap, setBitmap] = useState<Uint8Array>(() => {
    if (initialBitmapBase64) {
      try {
        const buf = Buffer.from(initialBitmapBase64, "base64");
        if (buf.length === 42) return new Uint8Array(buf);
      } catch {}
    }
    return new Uint8Array(42);
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const base64 = Buffer.from(bitmap).toString("base64");
    const result = await updateAvailability(base64);
    if (result.success) {
      toast.success("Availability updated");
    } else {
      toast.error(result.error ?? "Couldn't update availability — try again?");
    }
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Availability</CardTitle>
        <p className="text-xs text-muted-foreground">
          Your timezone: <strong>{timezone || "unknown"}</strong>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <GridPicker
          value={bitmap}
          onChange={setBitmap}
          timezone={timezone || "UTC"}
        />
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-accent text-white hover:bg-accent/90"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving…
            </>
          ) : (
            "Save Availability"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
