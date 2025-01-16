CREATE TABLE `opened_doors` (
  `id` int NOT NULL,
  `user_session_id` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `door_number` int NOT NULL,
  `opened_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `surprises` (
  `id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `emoji` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `rules` text COLLATE utf8mb4_general_ci,
  `implementation` text COLLATE utf8mb4_general_ci,
  `evaluation` text COLLATE utf8mb4_general_ci,
  `notes` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


