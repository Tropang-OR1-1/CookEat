CREATE TYPE "ingredient_category" AS ENUM (
  'Plant-based',
  'Animal-based',
  'Seafood',
  'Dairy',
  'Grain-based',
  'Processed Food',
  'Condiments and Sauces',
  'Beverages',
  'Sweeteners',
  'Fats and Oils',
  'Additives and Preservatives',
  'Spices and Herbs',
  'Fermented Products'
);

CREATE TYPE "recipe_type_category" AS ENUM (
  'Meal Type',
  'Cuisine Type',
  'Dietary Restrictions/Preferences',
  'Cooking Methods',
  'Difficulty Level',
  'Flavor Profiles',
  'Time & Preparation',
  'Occasion/Theme'
);

CREATE TYPE "user_profile_sex_enum" AS ENUM (
  'Female',
  'Male'
);

CREATE TYPE "user_profile_status_enum" AS ENUM (
  'private',
  'public',
  'restricted'
);

CREATE TYPE "comment_post_vote_enum" AS ENUM (
  'UP',
  'DOWN'
);

CREATE TABLE "followers" (
  "following_user_id" integer NOT NULL,
  "followed_user_id" integer NOT NULL
);

CREATE TABLE "user_profile" (
  "id" INT UNIQUE NOT NULL,
  "picture" VARCHAR(50),
  "biography" VARCHAR(100),
  "username" VARCHAR(30) NOT NULL,
  "nationality" VARCHAR(30),
  "sex" user_profile_sex_enum,
  "status" user_profile_status_enum DEFAULT 'public',
  "created_at" timestamp DEFAULT (CURRENT_TIMESTAMP),
  "birthday" date
);

CREATE TABLE "posts" (
  "id" INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY NOT NULL,
  "ref_id" integer,
  "title" varchar(255) NOT NULL,
  "body" text,
  "user_id" integer NOT NULL,
  "view_count" int DEFAULT 0,
  "created_at" timestamp DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE "postmedia" (
  "post_id" int,
  "path" varchar(50)
);

CREATE TABLE "comments" (
  "id" INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY NOT NULL,
  "ref_id" integer,
  "post_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "comments" text,
  "created_at" timestamp DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE "post_reactions" (
  "user_id" integer NOT NULL,
  "post_id" integer NOT NULL,
  "vote" comment_post_vote_enum
);

CREATE TABLE "comment_reactions" (
  "user_id" integer NOT NULL,
  "comment_id" integer NOT NULL,
  "vote" comment_post_vote_enum
);

CREATE TABLE "postsTags" (
  "post_id" int NOT NULL,
  "tags_id" int NOT NULL
);

CREATE TABLE "usersTags" (
  "user_id" integer NOT NULL,
  "tags_id" int NOT NULL
);

CREATE TABLE "userdata" (
  "user_id" INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY NOT NULL,
  "password_hashed" varchar(60) NOT NULL,
  "email" varchar(254) NOT NULL,
  "verified_email" bool DEFAULT false,
  "created_at" timestamp DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE "tags" (
  "id" INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "name" varchar(30) NOT NULL,
  "description" text
);

CREATE TABLE "Recipes" (
  "id" int PRIMARY KEY,
  "name" varchar(20),
  "author_id" int,
  "procedure" text,
  "view_count" int DEFAULT 0,
  "created_at" timestamp DEFAULT (current_timestamp)
);

CREATE TABLE "Ingredients" (
  "id" INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "name" varchar(30),
  "type" ingredient_category
);

CREATE TABLE "RI_junction" (
  "recipe_id" int,
  "measurement" varchar(5),
  "ingredient_id" int
);

CREATE TABLE "Category" (
  "id" INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "category" varchar(30) NOT NULL,
  "type" recipe_type_category
);

CREATE TABLE "RC_junction" (
  "recipe_id" int NOT NULL,
  "category_id" int NOT NULL
);

CREATE TABLE "recipe_rating" (
  "recipe_id" int,
  "user_id" int,
  "rating" SMALLINT
);

COMMENT ON COLUMN "posts"."body" IS 'Content of the post';

ALTER TABLE "user_profile" ADD FOREIGN KEY ("id") REFERENCES "userdata" ("user_id") ON DELETE CASCADE;

ALTER TABLE "followers" ADD FOREIGN KEY ("following_user_id") REFERENCES "user_profile" ("id") ON DELETE CASCADE;

ALTER TABLE "followers" ADD FOREIGN KEY ("followed_user_id") REFERENCES "user_profile" ("id") ON DELETE CASCADE;

ALTER TABLE "post_reactions" ADD FOREIGN KEY ("user_id") REFERENCES "user_profile" ("id") ON DELETE CASCADE;

ALTER TABLE "post_reactions" ADD FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE;

ALTER TABLE "comment_reactions" ADD FOREIGN KEY ("user_id") REFERENCES "user_profile" ("id") ON DELETE CASCADE;

ALTER TABLE "comment_reactions" ADD FOREIGN KEY ("comment_id") REFERENCES "comments" ("id") ON DELETE CASCADE;

ALTER TABLE "postsTags" ADD FOREIGN KEY ("tags_id") REFERENCES "tags" ("id") ON DELETE CASCADE;

ALTER TABLE "postsTags" ADD FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE;

ALTER TABLE "usersTags" ADD FOREIGN KEY ("tags_id") REFERENCES "tags" ("id") ON DELETE CASCADE;

ALTER TABLE "usersTags" ADD FOREIGN KEY ("user_id") REFERENCES "user_profile" ("id") ON DELETE CASCADE;

ALTER TABLE "comments" ADD FOREIGN KEY ("ref_id") REFERENCES "comments" ("id") ON DELETE CASCADE;

ALTER TABLE "comments" ADD FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE;

ALTER TABLE "comments" ADD FOREIGN KEY ("user_id") REFERENCES "user_profile" ("id") ON DELETE CASCADE;

ALTER TABLE "posts" ADD FOREIGN KEY ("ref_id") REFERENCES "posts" ("id") ON DELETE CASCADE;

ALTER TABLE "posts" ADD FOREIGN KEY ("user_id") REFERENCES "user_profile" ("id") ON DELETE CASCADE;

ALTER TABLE "RI_junction" ADD FOREIGN KEY ("recipe_id") REFERENCES "Recipes" ("id") ON DELETE CASCADE;

ALTER TABLE "RI_junction" ADD FOREIGN KEY ("ingredient_id") REFERENCES "Ingredients" ("id") ON DELETE CASCADE;

ALTER TABLE "RC_junction" ADD FOREIGN KEY ("recipe_id") REFERENCES "Recipes" ("id") ON DELETE CASCADE;

ALTER TABLE "RC_junction" ADD FOREIGN KEY ("category_id") REFERENCES "Category" ("id") ON DELETE CASCADE;

ALTER TABLE "Recipes" ADD FOREIGN KEY ("author_id") REFERENCES "user_profile" ("id") ON DELETE CASCADE;

ALTER TABLE "recipe_rating" ADD FOREIGN KEY ("user_id") REFERENCES "user_profile" ("id") ON DELETE CASCADE;

ALTER TABLE "recipe_rating" ADD FOREIGN KEY ("recipe_id") REFERENCES "Recipes" ("id") ON DELETE CASCADE;

ALTER TABLE "postmedia" ADD FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE;
