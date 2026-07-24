-- Required extensions (Neon supports both out of the box).
CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint

CREATE TYPE "public"."brand_type" AS ENUM('arabic', 'designer', 'niche');--> statement-breakpoint
CREATE TYPE "public"."concentration" AS ENUM('edt', 'edp', 'parfum', 'extrait');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('usd', 'sar', 'aed', 'egp');--> statement-breakpoint
CREATE TYPE "public"."fragrance_family" AS ENUM('woody', 'oriental', 'fresh', 'floral', 'gourmand');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'unisex');--> statement-breakpoint
CREATE TYPE "public"."note_layer" AS ENUM('top', 'heart', 'base');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'moderator', 'user');--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"preferences" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"country" text,
	"founded_year" integer,
	"logo" text,
	"description" text,
	"type" "brand_type" DEFAULT 'arabic' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "perfumes" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_id" integer NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"release_year" integer,
	"perfumer" text,
	"gender" "gender" NOT NULL,
	"concentration" "concentration" NOT NULL,
	"fragrance_family" "fragrance_family" NOT NULL,
	"description" text,
	"image" text,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "perfumes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "perfume_notes" (
	"perfume_id" integer NOT NULL,
	"note_id" integer NOT NULL,
	"layer" "note_layer" NOT NULL,
	CONSTRAINT "perfume_notes_perfume_id_note_id_pk" PRIMARY KEY("perfume_id","note_id")
);
--> statement-breakpoint
CREATE TABLE "alternatives" (
	"original_id" integer NOT NULL,
	"alternative_id" integer NOT NULL,
	"similarity_score" real NOT NULL,
	"price_original" integer,
	"price_alternative" integer,
	"currency" "currency" DEFAULT 'usd' NOT NULL,
	"similarity_explanation" text,
	"advantages" text[],
	"disadvantages" text[],
	"expert_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "alternatives_original_id_alternative_id_pk" PRIMARY KEY("original_id","alternative_id"),
	CONSTRAINT "similarity_score_range" CHECK ("alternatives"."similarity_score" >= 0 AND "alternatives"."similarity_score" <= 100),
	CONSTRAINT "no_self_alternative" CHECK ("alternatives"."original_id" <> "alternatives"."alternative_id")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"user_id" text NOT NULL,
	"perfume_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"longevity" integer,
	"projection" integer,
	"sillage" integer,
	"comment" text,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_user_id_perfume_id_pk" PRIMARY KEY("user_id","perfume_id"),
	CONSTRAINT "rating_range" CHECK ("reviews"."rating" >= 1 AND "reviews"."rating" <= 5),
	CONSTRAINT "longevity_range" CHECK ("reviews"."longevity" IS NULL OR ("reviews"."longevity" >= 0 AND "reviews"."longevity" <= 10)),
	CONSTRAINT "projection_range" CHECK ("reviews"."projection" IS NULL OR ("reviews"."projection" >= 0 AND "reviews"."projection" <= 10)),
	CONSTRAINT "sillage_range" CHECK ("reviews"."sillage" IS NULL OR ("reviews"."sillage" >= 0 AND "reviews"."sillage" <= 10))
);
--> statement-breakpoint
ALTER TABLE "perfumes" ADD CONSTRAINT "perfumes_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perfume_notes" ADD CONSTRAINT "perfume_notes_perfume_id_perfumes_id_fk" FOREIGN KEY ("perfume_id") REFERENCES "public"."perfumes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perfume_notes" ADD CONSTRAINT "perfume_notes_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alternatives" ADD CONSTRAINT "alternatives_original_id_perfumes_id_fk" FOREIGN KEY ("original_id") REFERENCES "public"."perfumes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alternatives" ADD CONSTRAINT "alternatives_alternative_id_perfumes_id_fk" FOREIGN KEY ("alternative_id") REFERENCES "public"."perfumes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_perfume_id_perfumes_id_fk" FOREIGN KEY ("perfume_id") REFERENCES "public"."perfumes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "brands_type_idx" ON "brands" USING btree ("type");--> statement-breakpoint
CREATE INDEX "perfumes_brand_idx" ON "perfumes" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "perfumes_family_idx" ON "perfumes" USING btree ("fragrance_family");--> statement-breakpoint
CREATE INDEX "perfumes_gender_idx" ON "perfumes" USING btree ("gender");--> statement-breakpoint
CREATE INDEX "perfume_notes_note_idx" ON "perfume_notes" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "perfume_notes_layer_idx" ON "perfume_notes" USING btree ("layer");--> statement-breakpoint
CREATE INDEX "alternatives_alt_idx" ON "alternatives" USING btree ("alternative_id");--> statement-breakpoint
CREATE INDEX "alternatives_score_idx" ON "alternatives" USING btree ("similarity_score");--> statement-breakpoint
CREATE INDEX "reviews_perfume_idx" ON "reviews" USING btree ("perfume_id");--> statement-breakpoint
CREATE INDEX "reviews_rating_idx" ON "reviews" USING btree ("rating");--> statement-breakpoint

-- Vector similarity index (cosine). HNSW works at any dataset size; rebuild
-- after a large bulk-load of embeddings to tune recall.
CREATE INDEX IF NOT EXISTS "perfumes_embedding_idx"
	ON "perfumes" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint

-- Fuzzy text search on display names (ILIKE / similarity / %).
CREATE INDEX IF NOT EXISTS "perfumes_name_trgm_idx"
	ON "perfumes" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brands_name_trgm_idx"
	ON "brands" USING gin ("name" gin_trgm_ops);