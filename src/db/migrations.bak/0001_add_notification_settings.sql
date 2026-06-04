CREATE TYPE "public"."notification_channel" AS ENUM('in_app', 'email', 'push');--> statement-breakpoint
CREATE TABLE "user_notification_settings" (
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "user_notification_settings_user_id_type_channel_pk" PRIMARY KEY("user_id","type","channel")
);
--> statement-breakpoint
ALTER TABLE "user_notification_settings" ADD CONSTRAINT "user_notification_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;