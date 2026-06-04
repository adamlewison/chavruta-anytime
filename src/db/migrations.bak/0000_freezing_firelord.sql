CREATE TYPE "public"."chabura_member_role" AS ENUM('rosh', 'member', 'pending');--> statement-breakpoint
CREATE TYPE "public"."connection_status" AS ENUM('pending', 'accepted', 'declined', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."conversation_type" AS ENUM('dm', 'chabura');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('connection_request', 'connection_accepted', 'chabura_invite', 'chabura_request', 'session_invite', 'session_starting_soon', 'session_starting_now', 'session_cancelled', 'message_received', 'match_found');--> statement-breakpoint
CREATE TYPE "public"."occurrence_status" AS ENUM('scheduled', 'cancelled', 'completed', 'missed');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('active', 'paused', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."session_type" AS ENUM('chavruta', 'chabura');--> statement-breakpoint
CREATE TYPE "public"."subject_level" AS ENUM('beginner', 'intermediate', 'advanced', 'teaching');--> statement-breakpoint
CREATE TABLE "chabura_members" (
	"chabura_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "chabura_member_role" NOT NULL,
	"joined_at" timestamp with time zone,
	CONSTRAINT "chabura_members_chabura_id_user_id_pk" PRIMARY KEY("chabura_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "chaburas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"creator_id" uuid NOT NULL,
	"rosh_chabura_id" uuid,
	"is_public" boolean DEFAULT true,
	"image" text,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	CONSTRAINT "chaburas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"addressee_id" uuid NOT NULL,
	"status" "connection_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone,
	"responded_at" timestamp with time zone,
	CONSTRAINT "connections_pair_unique" UNIQUE("requester_id","addressee_id"),
	CONSTRAINT "connections_no_self" CHECK ("connections"."requester_id" <> "connections"."addressee_id")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"name" text,
	"bio" text,
	"image" text,
	"gender" "gender",
	"country" text,
	"post_code" text,
	"languages" text[],
	"timezone" text,
	"availability" "bytea",
	"onboarded_at" timestamp with time zone,
	"dark_mode" boolean DEFAULT false,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"hebrew_name" text,
	"description" text,
	"image" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone,
	CONSTRAINT "subjects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_subjects" (
	"user_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"level" "subject_level" NOT NULL,
	"created_at" timestamp with time zone,
	CONSTRAINT "user_subjects_user_id_subject_id_pk" PRIMARY KEY("user_id","subject_id")
);
--> statement-breakpoint
CREATE TABLE "learning_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "session_type" NOT NULL,
	"chavruta_pair_id" uuid,
	"chabura_id" uuid,
	"subject_id" uuid NOT NULL,
	"title" text,
	"rrule" text,
	"dtstart" timestamp with time zone,
	"duration_min" integer,
	"timezone" text,
	"status" "session_status" DEFAULT 'active' NOT NULL,
	"meet_url" text,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "session_occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "occurrence_status" DEFAULT 'scheduled' NOT NULL,
	"meet_url" text,
	"notes" text,
	"created_at" timestamp with time zone,
	CONSTRAINT "session_occurrences_session_starts" UNIQUE("session_id","starts_at")
);
--> statement-breakpoint
CREATE TABLE "conversation_members" (
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"last_read_at" timestamp with time zone,
	CONSTRAINT "conversation_members_conversation_id_user_id_pk" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "conversation_type" NOT NULL,
	"chabura_id" uuid,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone,
	"edited_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"payload" jsonb,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "chabura_members" ADD CONSTRAINT "chabura_members_chabura_id_chaburas_id_fk" FOREIGN KEY ("chabura_id") REFERENCES "public"."chaburas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chabura_members" ADD CONSTRAINT "chabura_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chaburas" ADD CONSTRAINT "chaburas_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chaburas" ADD CONSTRAINT "chaburas_rosh_chabura_id_users_id_fk" FOREIGN KEY ("rosh_chabura_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_addressee_id_users_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subjects" ADD CONSTRAINT "user_subjects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subjects" ADD CONSTRAINT "user_subjects_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_chavruta_pair_id_connections_id_fk" FOREIGN KEY ("chavruta_pair_id") REFERENCES "public"."connections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_chabura_id_chaburas_id_fk" FOREIGN KEY ("chabura_id") REFERENCES "public"."chaburas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_occurrences" ADD CONSTRAINT "session_occurrences_session_id_learning_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."learning_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_chabura_id_chaburas_id_fk" FOREIGN KEY ("chabura_id") REFERENCES "public"."chaburas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_occurrences_session_id_idx" ON "session_occurrences" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "messages_conversation_created_idx" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","created_at") WHERE "notifications"."read_at" IS NULL;