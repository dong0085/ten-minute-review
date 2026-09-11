DROP INDEX "email_sends_user_day_idx";--> statement-breakpoint
ALTER TABLE "email_sends" ADD COLUMN "kind" text DEFAULT 'daily' NOT NULL;--> statement-breakpoint
ALTER TABLE "email_sends" ADD COLUMN "quiz_id" uuid;--> statement-breakpoint
ALTER TABLE "email_sends" ADD CONSTRAINT "email_sends_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "email_sends_user_day_daily_idx" ON "email_sends" USING btree ("user_id","sent_on") WHERE kind = 'daily';--> statement-breakpoint
CREATE UNIQUE INDEX "email_sends_user_quiz_idx" ON "email_sends" USING btree ("user_id","quiz_id");