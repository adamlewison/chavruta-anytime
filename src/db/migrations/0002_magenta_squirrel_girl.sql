ALTER TABLE "study_profiles" ALTER COLUMN "availability_local" SET DATA TYPE bit(336) USING "availability_local"::bit(336);--> statement-breakpoint
ALTER TABLE "study_profiles" ALTER COLUMN "availability_utc" SET DATA TYPE bit(336) USING "availability_utc"::bit(336);
