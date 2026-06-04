CREATE TYPE "public"."attendance_status" AS ENUM('invited', 'accepted', 'attended', 'missed', 'cancelled');--> statement-breakpoint
CREATE TABLE "session_occurrence_participants" (
	"occurrence_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "attendance_status",
	"joined_at" timestamp with time zone,
	"left_at" timestamp with time zone,
	"minutes_attended" integer,
	"subject_id" uuid,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	CONSTRAINT "session_occurrence_participants_occurrence_id_user_id_pk" PRIMARY KEY("occurrence_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "session_participants" (
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text,
	"created_at" timestamp with time zone,
	CONSTRAINT "session_participants_session_id_user_id_pk" PRIMARY KEY("session_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "session_occurrences" ADD COLUMN "actual_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "session_occurrences" ADD COLUMN "actual_ended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "session_occurrences" ADD COLUMN "actual_duration_min" integer;--> statement-breakpoint
ALTER TABLE "session_occurrences" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "session_occurrence_participants" ADD CONSTRAINT "session_occurrence_participants_occurrence_id_session_occurrences_id_fk" FOREIGN KEY ("occurrence_id") REFERENCES "public"."session_occurrences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_occurrence_participants" ADD CONSTRAINT "session_occurrence_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_occurrence_participants" ADD CONSTRAINT "session_occurrence_participants_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_session_id_learning_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."learning_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;