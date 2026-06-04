CREATE TABLE "study_profiles" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "subject_id" uuid NOT NULL,
    "availability_local" text NOT NULL,
    "availability_utc" text NOT NULL,
    "notes" text,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "study_profiles" ADD CONSTRAINT "study_profiles_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "study_profiles" ADD CONSTRAINT "study_profiles_subject_id_subjects_id_fk"
    FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "study_profiles_match_idx" ON "study_profiles" USING btree ("subject_id", "active");
--> statement-breakpoint
CREATE INDEX "study_profiles_user_idx" ON "study_profiles" USING btree ("user_id");
