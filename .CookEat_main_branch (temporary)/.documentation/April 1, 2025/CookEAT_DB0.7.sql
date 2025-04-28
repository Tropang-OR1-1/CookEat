CREATE DATABASE CookEAT;
USE CookEAT;
CREATE TABLE `follows` (
  `following_user_id` integer,
  `followed_user_id` integer
);

CREATE TABLE `user` (
  `id` integer PRIMARY KEY,
  `picture` varchar(50),
  `biography` varchar(100),
  `username` varchar(30),
  `nationality` varchar(30),
  `sex` enum('Female','Male'),
  `status` enum('private','public', 'restricted')
);

CREATE TABLE `posts` (
  `id` integer PRIMARY KEY,
  `ref_id` integer,
  `title` varchar(255) NOT NULL,
  `body` text COMMENT 'Content of the post',
  `reference_link` varchar(50),
  `user_id` integer NOT NULL,
  `status` varchar(255),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `comments` (
  `id` integer PRIMARY KEY,
  `ref_id` integer,
  `post_id` integer NOT NULL,
  `user_id` integer NOT NULL,
  `comments` varchar(200),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `post_reactions` (
  `user_id` integer,
  `post_id` integer,
  `vote` enum('UP','DOWN')
);

CREATE TABLE `comment_reactions` (
  `user_id` integer,
  `comment_id` integer,
  `vote` enum('UP','DOWN')
);

CREATE TABLE `categoryTags` (
  `post_id` integer,
  `category` varchar(30)
);

CREATE TABLE `usersTags` (
  `user_id` integer,
  `category` varchar(30)
);

CREATE TABLE `SessionManagement` (
  `session` varchar(255),
  `user_id` integer PRIMARY KEY,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `expiration` timestamp
);

CREATE TABLE `UserData` (
  `user_id` integer PRIMARY KEY,
  `username` varchar(30),
  `password_hashed` varchar(255),
  `email` varchar(50),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX `categoryTags_index_0` ON `categoryTags` (`post_id`, `category`);

ALTER TABLE `posts` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `posts` ADD FOREIGN KEY (`id`) REFERENCES `posts` (`ref_id`);

ALTER TABLE `posts` ADD FOREIGN KEY (`id`) REFERENCES `categoryTags` (`post_id`);

ALTER TABLE `categoryTags` ADD FOREIGN KEY (`category`) REFERENCES `usersTags` (`category`);

ALTER TABLE `follows` ADD FOREIGN KEY (`following_user_id`) REFERENCES `users` (`id`);

ALTER TABLE `categoryTags` ADD FOREIGN KEY (`category`) REFERENCES `users` (`nationality`);

ALTER TABLE `follows` ADD FOREIGN KEY (`followed_user_id`) REFERENCES `users` (`id`);

ALTER TABLE `usersTags` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `post_reactions` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `post_reactions` ADD FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`);

ALTER TABLE `comments` ADD FOREIGN KEY (`id`) REFERENCES `comments` (`ref_id`);

ALTER TABLE `comments` ADD FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`);

ALTER TABLE `comments` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `comment_reactions` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `comments` ADD FOREIGN KEY (`id`) REFERENCES `comment_reactions` (`comment_id`);

ALTER TABLE `UserData` ADD FOREIGN KEY (`user_id`) REFERENCES `SessionManagement` (`user_id`);

ALTER TABLE `users` ADD FOREIGN KEY (`id`) REFERENCES `SessionManagement` (`user_id`);

ALTER TABLE `users` ADD FOREIGN KEY (`username`) REFERENCES `UserData` (`username`);
