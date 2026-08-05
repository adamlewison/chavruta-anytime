import { z } from "zod";
import { uuid } from "./common";

/**
 * setNotificationSetting(type, channel, isEnabled).
 * `type` is validated as a non-empty string rather than a closed enum: the
 * NotificationType union is defined by the DB enum, and duplicating it here
 * would create a second source of truth that silently drifts.
 */
export const setNotificationSettingSchema = z.object({
  type: z.string().min(1).max(64),
  channel: z.string().min(1).max(32),
  isEnabled: z.boolean(),
});

/** markNotificationRead(notificationId) */
export const markNotificationReadSchema = uuid;
