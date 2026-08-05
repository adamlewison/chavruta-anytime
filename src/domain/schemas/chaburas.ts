import { z } from "zod";
import { optionalText, text, uuid } from "./common";

/** createChabura(data) */
export const createChaburaSchema = z.object({
  name: text(100),
  description: optionalText(500),
  slug: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  subjectId: uuid.optional(),
  isPublic: z.boolean(),
  image: z.url().optional(),
});

/** joinChabura / leaveChabura (chaburaId) */
export const chaburaIdSchema = uuid;

/** approveMember / declineMember (chaburaId, userId) */
export const chaburaMemberSchema = z.object({
  chaburaId: uuid,
  userId: uuid,
});

/** updateChabura(chaburaId, data) */
export const updateChaburaSchema = z.object({
  chaburaId: uuid,
  data: z.object({
    name: text(100),
    description: optionalText(500),
    isPublic: z.boolean().optional(),
  }),
});
