import { describe, it, expect } from "vitest";
import { completeOnboardingSchema } from "./onboarding";
import { createChaburaSchema, updateChaburaSchema } from "./chaburas";
import { createSessionSchema, rescheduleOccurrenceSchema } from "./sessions";
import { createStudyProfileSchema } from "./study-profiles";
import { sendMessageSchema } from "./messages";
import { updateProfileSchema } from "./profile";
import { firstError } from "./common";

/**
 * These schemas guard live Server Actions. The most important property is not
 * that they reject bad input — it is that they ACCEPT everything the app
 * legitimately sends. A schema that rejects a working payload takes a feature
 * down. Each "accepts" case below mirrors a real call site.
 */

const UUID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const UUID2 = "1b4e28ba-2fa1-11d2-883f-0016d3cca427";

describe("completeOnboardingSchema", () => {
  const valid = {
    name: "Shimon",
    bio: "",
    image: null,
    gender: "male" as const,
    country: "GB",
    postCode: "",
    languages: ["en"],
    timezone: "Europe/London",
    subjects: [UUID],
    availability: Array(42).fill(0),
  };

  it("accepts a fully-populated wizard submission", () => {
    expect(completeOnboardingSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts an EMPTY availability array — the wizard sends [] when step 6 is skipped", () => {
    // Regression guard: requiring exactly 42 bytes here would block onboarding
    // for every user who does not fill in their availability grid.
    expect(completeOnboardingSchema.safeParse({ ...valid, availability: [] }).success).toBe(true);
  });

  it("accepts an OAuth avatar URL and a null image alike", () => {
    expect(completeOnboardingSchema.safeParse({
      ...valid, image: "https://lh3.googleusercontent.com/a/abc123=s96-c",
    }).success).toBe(true);
    expect(completeOnboardingSchema.safeParse({ ...valid, image: null }).success).toBe(true);
  });

  it("rejects a malformed bitmap that is neither empty nor 42 bytes", () => {
    expect(completeOnboardingSchema.safeParse({ ...valid, availability: Array(10).fill(0) }).success).toBe(false);
  });

  it("rejects the fields the wizard already gates on", () => {
    expect(completeOnboardingSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
    expect(completeOnboardingSchema.safeParse({ ...valid, languages: [] }).success).toBe(false);
    expect(completeOnboardingSchema.safeParse({ ...valid, subjects: [] }).success).toBe(false);
    expect(completeOnboardingSchema.safeParse({ ...valid, gender: "other" }).success).toBe(false);
  });

  it("rejects a non-uuid subject id", () => {
    expect(completeOnboardingSchema.safeParse({ ...valid, subjects: ["gemara"] }).success).toBe(false);
  });
});

describe("createChaburaSchema", () => {
  const valid = {
    name: "Morning Daf Yomi",
    description: "",
    slug: "morning-daf-yomi",
    isPublic: true,
  };

  it("accepts what the new-chabura form builds", () => {
    expect(createChaburaSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts the optional subjectId and image when present", () => {
    expect(createChaburaSchema.safeParse({
      ...valid, subjectId: UUID, image: "https://blob.vercel-storage.com/x.png",
    }).success).toBe(true);
  });

  it("rejects a slug that is not kebab-case, matching the form's own slugifier", () => {
    for (const slug of ["Morning Daf", "morning_daf", "-leading", "trailing-", "UPPER"]) {
      expect(createChaburaSchema.safeParse({ ...valid, slug }).success).toBe(false);
    }
  });

  it("rejects a slug under three characters, matching the form's minimum", () => {
    expect(createChaburaSchema.safeParse({ ...valid, slug: "ab" }).success).toBe(false);
  });
});

describe("updateChaburaSchema", () => {
  it("accepts the nested (chaburaId, data) call shape", () => {
    expect(updateChaburaSchema.safeParse({
      chaburaId: UUID,
      data: { name: "Renamed", description: "", isPublic: false },
    }).success).toBe(true);
  });

  it("accepts data without the optional isPublic", () => {
    expect(updateChaburaSchema.safeParse({
      chaburaId: UUID, data: { name: "Renamed", description: "" },
    }).success).toBe(true);
  });
});

describe("createSessionSchema", () => {
  const base = {
    subjectId: UUID,
    title: "Chumash with Yossi",
    rrule: "FREQ=WEEKLY;BYDAY=TU",
    dtstart: new Date("2026-03-03T21:00:00Z").toISOString(),
    durationMin: 60,
    timezone: "America/New_York",
  };

  it("accepts a chavruta session carrying chavrutaPairId", () => {
    expect(createSessionSchema.safeParse({
      ...base, type: "chavruta", chavrutaPairId: UUID2,
    }).success).toBe(true);
  });

  it("accepts a chabura session carrying chaburaId", () => {
    expect(createSessionSchema.safeParse({
      ...base, type: "chabura", chaburaId: UUID2,
    }).success).toBe(true);
  });

  it("rejects a chavruta session with no chavrutaPairId", () => {
    expect(createSessionSchema.safeParse({ ...base, type: "chavruta" }).success).toBe(false);
  });

  it("rejects a chabura session with no chaburaId", () => {
    expect(createSessionSchema.safeParse({ ...base, type: "chabura" }).success).toBe(false);
  });

  it("accepts the duration chips the form offers", () => {
    for (const durationMin of [30, 45, 60, 90, 120]) {
      expect(createSessionSchema.safeParse({
        ...base, type: "chabura", chaburaId: UUID2, durationMin,
      }).success).toBe(true);
    }
  });

  it("rejects a non-ISO dtstart", () => {
    expect(createSessionSchema.safeParse({
      ...base, type: "chabura", chaburaId: UUID2, dtstart: "2026-03-03 21:00",
    }).success).toBe(false);
  });
});

describe("rescheduleOccurrenceSchema", () => {
  const start = new Date("2026-03-03T21:00:00Z").toISOString();
  const end = new Date("2026-03-03T22:00:00Z").toISOString();

  it("accepts an end after the start", () => {
    expect(rescheduleOccurrenceSchema.safeParse({
      occurrenceId: UUID, newStartsAt: start, newEndsAt: end,
    }).success).toBe(true);
  });

  it("rejects an end before the start", () => {
    expect(rescheduleOccurrenceSchema.safeParse({
      occurrenceId: UUID, newStartsAt: end, newEndsAt: start,
    }).success).toBe(false);
  });

  it("rejects a zero-length occurrence", () => {
    expect(rescheduleOccurrenceSchema.safeParse({
      occurrenceId: UUID, newStartsAt: start, newEndsAt: start,
    }).success).toBe(false);
  });
});

describe("createStudyProfileSchema", () => {
  const bits = "1".repeat(336);

  it("accepts the 336-char bit string the learning-profiles editor produces", () => {
    expect(createStudyProfileSchema.safeParse({
      subjectId: UUID, availabilityLocal: bits, availabilityUtc: bits, notes: "",
    }).success).toBe(true);
  });

  it("accepts a shorter string, since stringToBitmap zero-fills the remainder", () => {
    expect(createStudyProfileSchema.safeParse({
      subjectId: UUID, availabilityLocal: "101", availabilityUtc: "", notes: undefined,
    }).success).toBe(true);
  });

  it("rejects non-binary characters and over-long strings", () => {
    expect(createStudyProfileSchema.safeParse({
      subjectId: UUID, availabilityLocal: "abc", availabilityUtc: bits,
    }).success).toBe(false);
    expect(createStudyProfileSchema.safeParse({
      subjectId: UUID, availabilityLocal: "1".repeat(337), availabilityUtc: bits,
    }).success).toBe(false);
  });
});

describe("sendMessageSchema", () => {
  it("accepts a normal message", () => {
    expect(sendMessageSchema.safeParse({ conversationId: UUID, body: "Shalom" }).success).toBe(true);
  });

  it("rejects an empty body and one over the 1000-char composer limit", () => {
    expect(sendMessageSchema.safeParse({ conversationId: UUID, body: "" }).success).toBe(false);
    expect(sendMessageSchema.safeParse({ conversationId: UUID, body: "x".repeat(1001) }).success).toBe(false);
  });

  it("accepts exactly 1000 characters", () => {
    expect(sendMessageSchema.safeParse({ conversationId: UUID, body: "x".repeat(1000) }).success).toBe(true);
  });
});

describe("updateProfileSchema", () => {
  it("accepts a single-field patch, which is how settings pages call it", () => {
    expect(updateProfileSchema.safeParse({ darkMode: true }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ country: "IL", timezone: "Asia/Jerusalem" }).success).toBe(true);
  });

  it("accepts an empty patch as a legal no-op", () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(true);
  });

  it("rejects a country code that is not alpha-2", () => {
    expect(updateProfileSchema.safeParse({ country: "GBR" }).success).toBe(false);
  });
});

describe("firstError", () => {
  it("prefixes the failing field path so the toast names the field", () => {
    const r = completeOnboardingSchema.safeParse({});
    expect(r.success).toBe(false);
    if (!r.success) expect(firstError(r.error)).toMatch(/^[a-zA-Z]+: /);
  });
});
