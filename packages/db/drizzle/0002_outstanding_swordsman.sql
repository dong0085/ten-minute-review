DROP INDEX "quizzes_classroom_date_idx";--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "kind" text DEFAULT 'daily' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "quizzes_classroom_date_daily_idx" ON "quizzes" USING btree ("classroom_id","quiz_date") WHERE kind = 'daily';--> statement-breakpoint
CREATE INDEX "quizzes_user_kind_composed_idx" ON "quizzes" USING btree ("user_id","kind","composed_at");