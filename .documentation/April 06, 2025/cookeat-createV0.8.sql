CREATE DATABASE cookeat;
USE cookeat;

CREATE TABLE `followers` (
  `following_user_id` integer NOT NULL,
  `followed_user_id` integer NOT NULL
);

CREATE TABLE user_profile (
  id INT NOT NULL UNIQUE,
  picture VARCHAR(50),
  biography VARCHAR(100),
  username VARCHAR(30) NOT NULL,
  nationality VARCHAR(30),
  sex ENUM('Female', 'Male') NULL,
  status ENUM('private', 'public', 'restricted') DEFAULT 'public',
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  birthday date
);

CREATE TABLE `posts` (
  `id` integer AUTO_INCREMENT NOT NULL,
  `ref_id` integer,
  `title` varchar(255) NOT NULL,
  `body` text COMMENT 'Content of the post',
  `reference_link` varchar(50),
  `user_id` integer NOT NULL,
  `created_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY(id)
);

CREATE TABLE `comments` (
  `id` integer AUTO_INCREMENT NOT NULL,
  `ref_id` integer,
  `post_id` integer NOT NULL,
  `user_id` integer NOT NULL,
  `comments` text,
  `created_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY(id)
);

CREATE TABLE `post_reactions` (
  `user_id` integer NOT NULL,
  `post_id` integer NOT NULL,
  `vote` ENUM ('UP', 'DOWN')
);

CREATE TABLE `comment_reactions` (
  `user_id` integer NOT NULL,
  `comment_id` integer NOT NULL,
  `vote` ENUM ('UP', 'DOWN')
);

CREATE TABLE `postsTags` (
  `post_id` int NOT NULL,
  `category` int NOT NULL
);

CREATE TABLE `usersTags` (
  `user_id` integer NOT NULL,
  `category` int NOT NULL
);

CREATE TABLE `userdata` (
  `user_id` integer NOT NULL AUTO_INCREMENT,
  `password_hashed` varchar(60) NOT NULL,
  `email` varchar(254) NOT NULL,
  `verified_email` bool DEFAULT FALSE,
  `created_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY(user_id)
);

CREATE TABLE `category` (
  `id` integer AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `description` text,
  PRIMARY KEY(id)
);

ALTER TABLE user_profile ADD FOREIGN KEY (id) REFERENCES userdata(user_id) ON DELETE CASCADE;

ALTER TABLE followers ADD FOREIGN KEY (following_user_id) REFERENCES user_profile(id) ON DELETE CASCADE;
ALTER TABLE followers ADD FOREIGN KEY (followed_user_id) REFERENCES user_profile(id) ON DELETE CASCADE;

ALTER TABLE post_reactions ADD FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE;
ALTER TABLE post_reactions ADD FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

ALTER TABLE comment_reactions ADD FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE;
ALTER TABLE comment_reactions ADD FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE;

ALTER TABLE postsTags ADD FOREIGN KEY (category) REFERENCES category(id) ON DELETE CASCADE;
ALTER TABLE postsTags ADD FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

ALTER TABLE usersTags ADD FOREIGN KEY (category) REFERENCES category(id) ON DELETE CASCADE;
ALTER TABLE usersTags ADD FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE;

ALTER TABLE comments ADD FOREIGN KEY (ref_id) REFERENCES comments(id) ON DELETE CASCADE;
ALTER TABLE comments ADD FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
ALTER TABLE comments ADD FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE;

ALTER TABLE posts ADD FOREIGN KEY (ref_id) REFERENCES posts(id) ON DELETE CASCADE;
ALTER TABLE posts ADD FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE;

