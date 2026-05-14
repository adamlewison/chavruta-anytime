import { z } from "zod";

export const onboardingSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  bio: z.string().max(280).default(""),
  image: z.string().url().nullable().default(null),
  gender: z.enum(["male", "female"]),
  country: z.string().min(2).max(2),
  postCode: z.string().max(20).default(""),
  languages: z.array(z.string()).min(1, "Select at least one language"),
  timezone: z.string().min(1),
  subjects: z
    .array(
      z.object({
        subjectId: z.string().uuid(),
        level: z.enum(["beginner", "intermediate", "advanced", "teaching"]),
      })
    )
    .min(1, "Select at least one subject"),
  availability: z.array(z.number()).length(42).nullable(),
});

export const connectionRequestSchema = z.object({
  addresseeId: z.string().uuid(),
});

export const messageSchema = z.object({
  body: z.string().min(1).max(1000),
});

export const createChaburaSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(""),
  subjectId: z.string().uuid().optional(),
  isPublic: z.boolean().default(true),
  image: z.string().url().optional(),
});

export const createSessionSchema = z.object({
  type: z.enum(["chavruta", "chabura"]),
  chavrutaPairId: z.string().uuid().optional(),
  chaburaId: z.string().uuid().optional(),
  subjectId: z.string().uuid(),
  title: z.string().min(1).max(200),
  rrule: z.string().min(1),
  dtstart: z.string().datetime(),
  durationMin: z.number().int().min(30).max(120),
  timezone: z.string().min(1),
});

export const availabilityBitmapSchema = z
  .instanceof(Uint8Array)
  .refine((v) => v.length === 42, "Availability bitmap must be exactly 42 bytes");
