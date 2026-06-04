import { pgEnum } from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender", ["male", "female"]);

export const subjectLevelEnum = pgEnum("subject_level", [
  "beginner",
  "intermediate",
  "advanced",
  "teaching",
]);

export const connectionStatusEnum = pgEnum("connection_status", [
  "pending",
  "accepted",
  "declined",
  "blocked",
]);

export const chaburaMemberRoleEnum = pgEnum("chabura_member_role", [
  "rosh",
  "member",
  "pending",
]);

export const sessionTypeEnum = pgEnum("session_type", [
  "chavruta",
  "chabura",
]);

export const sessionStatusEnum = pgEnum("session_status", [
  "active",
  "paused",
  "cancelled",
]);

export const occurrenceStatusEnum = pgEnum("occurrence_status", [
  "scheduled",
  "cancelled",
  "completed",
  "missed",
]);

export const conversationTypeEnum = pgEnum("conversation_type", [
  "dm",
  "chabura",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "in_app",
  "email",
  "push",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "invited",
  "accepted",
  "attended",
  "missed",
  "cancelled",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "connection_request",
  "connection_accepted",
  "chabura_invite",
  "chabura_request",
  "session_invite",
  "session_starting_soon",
  "session_starting_now",
  "session_cancelled",
  "message_received",
  "match_found",
]);
