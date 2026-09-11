CREATE TABLE "deleted_daily_quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"classroom_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"quiz_date" date NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deleted_daily_quizzes" ADD CONSTRAINT "deleted_daily_quizzes_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deleted_daily_quizzes" ADD CONSTRAINT "deleted_daily_quizzes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "deleted_daily_quizzes_classroom_date_idx" ON "deleted_daily_quizzes" USING btree ("classroom_id","quiz_date");--> statement-breakpoint
CREATE INDEX "deleted_daily_quizzes_user_idx" ON "deleted_daily_quizzes" USING btree ("user_id");