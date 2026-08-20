-- --------------------------------------------------------
-- Hôte:                         127.0.0.1
-- Version du serveur:           8.0.30 - MySQL Community Server - GPL
-- SE du serveur:                Win64
-- HeidiSQL Version:             12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Listage de la structure de la base pour bdprojet
CREATE DATABASE IF NOT EXISTS `bdprojet` /*!40100 DEFAULT CHARACTER SET armscii8 COLLATE armscii8_bin */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `bdprojet`;

-- Listage de la structure de table bdprojet. activites
CREATE TABLE IF NOT EXISTS `activites` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_user` int NOT NULL,
  `id_projet` int NOT NULL,
  `date_activite` date NOT NULL,
  `libelle` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.activites : ~7 rows (environ)
INSERT INTO `activites` (`id`, `id_user`, `id_projet`, `date_activite`, `libelle`, `statut`, `created_at`, `updated_at`) VALUES
	(1, 1, 1, '2025-07-18', 'Rapport de mission de supervision', '1', '2025-07-03 13:29:09', '2025-07-08 13:57:05'),
	(2, 1, 10, '2023-04-13', 'Rapport de mission', '1', '2025-07-03 13:30:06', '2026-07-10 18:58:15'),
	(3, 1, 5, '2025-07-31', 'Visite de la chute', '4', '2025-07-04 11:54:29', '2025-07-10 12:24:11'),
	(7, 1, 10, '2025-07-11', 'hhh', '0', '2025-07-09 16:04:59', '2025-07-09 16:05:07'),
	(10, 4, 17, '2025-07-25', 'retraite a Mbudi', '0', '2025-07-11 11:04:46', '2025-07-20 14:03:23'),
	(11, 4, 24, '2025-07-20', 'ok', '1', '2025-07-20 14:03:12', '2025-07-20 14:03:12'),
	(12, 2, 12, '2025-07-20', 'RAS', '1', '2025-07-20 14:34:30', '2026-07-10 14:12:48');

-- Listage de la structure de table bdprojet. cout_budgets
CREATE TABLE IF NOT EXISTS `cout_budgets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_user` bigint unsigned NOT NULL,
  `id_projet` bigint unsigned NOT NULL,
  `cout_total` decimal(12,2) NOT NULL,
  `cout_perception` decimal(12,2) NOT NULL,
  `date_perception` date NOT NULL,
  `statut` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.cout_budgets : ~0 rows (environ)
INSERT INTO `cout_budgets` (`id`, `id_user`, `id_projet`, `cout_total`, `cout_perception`, `date_perception`, `statut`, `created_at`, `updated_at`) VALUES
	(1, 1, 2, 3000.00, 2000.00, '2025-02-02', NULL, '2025-06-30 07:21:33', '2025-06-30 07:27:07');

-- Listage de la structure de table bdprojet. districts
CREATE TABLE IF NOT EXISTS `districts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_provinces` bigint unsigned NOT NULL,
  `nom_district` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.districts : ~8 rows (environ)
INSERT INTO `districts` (`id`, `id_provinces`, `nom_district`, `statut`, `created_at`, `updated_at`) VALUES
	(1, 1, 'Lukunga', '1', '2025-06-28 11:53:24', '2025-07-08 12:00:26'),
	(2, 1, 'Tshangu', '1', '2025-07-02 12:28:01', '2025-07-02 12:28:01'),
	(3, 1, 'Mont-Amba', '1', '2025-07-02 12:28:51', '2025-07-03 10:32:12'),
	(4, 6, 'Likasi', '1', '2025-07-02 12:29:13', '2026-07-10 18:24:03'),
	(5, 3, 'Kasongo', '1', '2025-07-02 12:33:42', '2025-07-09 13:59:30'),
	(6, 4, 'Katakokombe', '1', '2025-07-04 13:28:02', '2025-07-09 13:57:19'),
	(7, 7, 'Kamoa', '1', '2025-07-09 13:29:56', '2025-07-09 13:55:19'),
	(8, 2, 'Mongo', '1', '2025-07-09 14:01:04', '2025-07-10 12:21:23'),
	(9, 11, 'Mayiko', '0', '2025-07-09 14:05:17', '2025-07-09 14:05:28'),
	(10, 13, 'Kibali', '1', '2025-07-20 14:29:28', '2025-07-20 14:29:28');

-- Listage de la structure de table bdprojet. document_activites
CREATE TABLE IF NOT EXISTS `document_activites` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_activite` bigint unsigned NOT NULL,
  `fichier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom_fichier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.document_activites : ~7 rows (environ)
INSERT INTO `document_activites` (`id`, `id_activite`, `fichier`, `nom_fichier`, `created_at`, `updated_at`) VALUES
	(3, 1, 'code.docx', '1751280316_68626abccf8fa_code.docx', '2025-06-30 08:45:16', '2025-06-30 08:45:16'),
	(8, 2, 'bd_zenox.xlsx', '1751632753_6867cb71d153c_bd_zenox.xlsx', '2025-07-04 10:39:13', '2025-07-04 10:39:13'),
	(9, 2, 'documentation.docx', '1751632753_6867cb71d264f_documentation.docx', '2025-07-04 10:39:13', '2025-07-04 10:39:13'),
	(10, 2, 'famba.pdf', '1751632753_6867cb71d35f6_famba.pdf', '2025-07-04 10:39:13', '2025-07-04 10:39:13'),
	(11, 6, 'question.docx', '1751633322_6867cdaa3a3c2_question.docx', '2025-07-04 10:48:42', '2025-07-04 10:48:42'),
	(12, 6, 'base de donnees archive.xlsx', '1751633627_6867cedbd6a12_base de donnees archive.xlsx', '2025-07-04 10:53:47', '2025-07-04 10:53:47'),
	(14, 3, 'bd_zenox (1) (1).xlsx', '1751637281_6867dd21b4e6c_bd_zenox (1) (1).xlsx', '2025-07-04 11:54:41', '2025-07-04 11:54:41'),
	(15, 3, 'famba (1).pdf', '1751637281_6867dd21bf16d_famba (1).pdf', '2025-07-04 11:54:41', '2025-07-04 11:54:41'),
	(16, 10, 'bdprojet.sql', '1752240913_687113111704a_bdprojet.sql', '2025-07-11 11:35:14', '2025-07-11 11:35:14'),
	(17, 12, 'Rapport_Gestion_Imprimes_Valeur.docx', '1753029289_687d1aa911883_Rapport_Gestion_Imprimes_Valeur.docx', '2025-07-20 14:34:49', '2025-07-20 14:34:49');

-- Listage de la structure de table bdprojet. document_couts
CREATE TABLE IF NOT EXISTS `document_couts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_cout` bigint unsigned NOT NULL,
  `fichier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom_fichier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.document_couts : ~4 rows (environ)
INSERT INTO `document_couts` (`id`, `id_cout`, `fichier`, `nom_fichier`, `created_at`, `updated_at`) VALUES
	(2, 1, 'bd_zenox.xlsx', '1751277552_68625ff02ccfc_bd_zenox.xlsx', '2025-06-30 07:59:12', '2025-06-30 07:59:12'),
	(3, 1, 'code.docx', '1751277552_68625ff02ee0f_code.docx', '2025-06-30 07:59:12', '2025-06-30 07:59:12'),
	(4, 1, 'famba.pdf', '1751277552_68625ff0311bb_famba.pdf', '2025-06-30 07:59:12', '2025-06-30 07:59:12');

-- Listage de la structure de table bdprojet. document_entrees
CREATE TABLE IF NOT EXISTS `document_entrees` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_entree` int NOT NULL,
  `fichier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom_fichier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.document_entrees : ~6 rows (environ)
INSERT INTO `document_entrees` (`id`, `id_entree`, `fichier`, `nom_fichier`, `created_at`, `updated_at`) VALUES
	(3, 1, 'bd_zenox (1).xlsx', '1751635764_6867d7343ce7c_bd_zenox (1).xlsx', '2025-07-04 11:29:24', '2025-07-04 11:29:24'),
	(4, 1, 'base de donnees archive.xlsx', '1751635793_6867d7518a7eb_base de donnees archive.xlsx', '2025-07-04 11:29:53', '2025-07-04 11:29:53'),
	(5, 2, 'question.docx', '1751635850_6867d78a5e038_question.docx', '2025-07-04 11:30:50', '2025-07-04 11:30:50'),
	(6, 9, 'monimage (3).jpg', '1752241005_6871136de3d6f_monimage (3).jpg', '2025-07-11 11:36:45', '2025-07-11 11:36:45'),
	(7, 7, 'GS-ARCHIVES_Presentation_Etat_Avancement_FicheUnique.docx', '1752959187_687c08d3585da_GS-ARCHIVES_Presentation_Etat_Avancement_FicheUnique.docx', '2025-07-19 19:06:27', '2025-07-19 19:06:27'),
	(9, 11, 'GS-ARCHIVES_Presentation_Etat_Avancement_FicheUnique (1).docx', '1753020154_687cf6fa15aa4_GS-ARCHIVES_Presentation_Etat_Avancement_FicheUnique (1).docx', '2025-07-20 12:02:34', '2025-07-20 12:02:34');

-- Listage de la structure de table bdprojet. document_personels
CREATE TABLE IF NOT EXISTS `document_personels` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_personel` bigint unsigned NOT NULL,
  `fichier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom_fichier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.document_personels : ~0 rows (environ)

-- Listage de la structure de table bdprojet. document_personnels
CREATE TABLE IF NOT EXISTS `document_personnels` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_personnel` int NOT NULL,
  `fichier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom_fichier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.document_personnels : ~4 rows (environ)
INSERT INTO `document_personnels` (`id`, `id_personnel`, `fichier`, `nom_fichier`, `created_at`, `updated_at`) VALUES
	(2, 1, 'bd_zenox (1).xlsx', '1751638983_6867e3c7006ba_bd_zenox (1).xlsx', '2025-07-04 12:23:03', '2025-07-04 12:23:03'),
	(4, 3, 'question (1).docx', '1751639152_6867e47014ed1_question (1).docx', '2025-07-04 12:25:52', '2025-07-04 12:25:52'),
	(5, 3, 'bd_zenox (1) (2).xlsx', '1751639152_6867e4701f1fd_bd_zenox (1) (2).xlsx', '2025-07-04 12:25:52', '2025-07-04 12:25:52'),
	(6, 6, 'image.jpg', '1751639596_6867e62c33caf_image.jpg', '2025-07-04 12:33:16', '2025-07-04 12:33:16'),
	(7, 6, 'Note_Technique_Logiciel_Archivage_FINAL_V2.docx', '1751639596_6867e62c40d56_Note_Technique_Logiciel_Archivage_FINAL_V2.docx', '2025-07-04 12:33:16', '2025-07-04 12:33:16'),
	(8, 14, 'Dynamic .NET TWAIN Developer\'s Guide.pdf', '1752240974_6871134eeef72_Dynamic .NET TWAIN Developer\'s Guide.pdf', '2025-07-11 11:36:15', '2025-07-11 11:36:15');

-- Listage de la structure de table bdprojet. document_projets
CREATE TABLE IF NOT EXISTS `document_projets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_projet` int NOT NULL,
  `fichier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom_fichier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.document_projets : ~2 rows (environ)
INSERT INTO `document_projets` (`id`, `id_projet`, `fichier`, `nom_fichier`, `created_at`, `updated_at`) VALUES
	(4, 1, 'monimage.jpg', '1751641130_6867ec2a55833_monimage.jpg', '2025-07-04 12:58:50', '2025-07-04 12:58:50'),
	(5, 1, 'Note_Technique_Logiciel_Archivage_FINAL.docx', '1751641130_6867ec2a5f2e3_Note_Technique_Logiciel_Archivage_FINAL.docx', '2025-07-04 12:58:50', '2025-07-04 12:58:50'),
	(6, 18, 'bd_zenox (1) (3).xlsx', '1752240949_687113358a541_bd_zenox (1) (3).xlsx', '2025-07-11 11:35:49', '2025-07-11 11:35:49');

-- Listage de la structure de table bdprojet. document_sorties
CREATE TABLE IF NOT EXISTS `document_sorties` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_sortie` bigint unsigned NOT NULL,
  `fichier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom_fichier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.document_sorties : ~2 rows (environ)
INSERT INTO `document_sorties` (`id`, `id_sortie`, `fichier`, `nom_fichier`, `created_at`, `updated_at`) VALUES
	(3, 1, 'famba (1).pdf', '1751636938_6867dbcab8275_famba (1).pdf', '2025-07-04 11:48:58', '2025-07-04 11:48:58'),
	(4, 1, 'bd_zenox (1) - Copie.xlsx', '1751636938_6867dbcab971b_bd_zenox (1) - Copie.xlsx', '2025-07-04 11:48:58', '2025-07-04 11:48:58'),
	(5, 6, 'famba (1).pdf', '1751637012_6867dc14d2187_famba (1).pdf', '2025-07-04 11:50:12', '2025-07-04 11:50:12'),
	(6, 11, 'Dynamic .NET TWAIN Developer\'s Guide (1).pdf', '1752241045_687113955b0ac_Dynamic .NET TWAIN Developer\'s Guide (1).pdf', '2025-07-11 11:37:25', '2025-07-11 11:37:25'),
	(7, 2, 'attest edmond.jpg', '1753007821_687cc6cd0bd9f_attest edmond.jpg', '2025-07-20 08:37:02', '2025-07-20 08:37:02');

-- Listage de la structure de table bdprojet. entrees
CREATE TABLE IF NOT EXISTS `entrees` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_user` int NOT NULL,
  `id_projet` int NOT NULL,
  `montant_recu` decimal(15,2) NOT NULL,
  `date_approvisionnement` date NOT NULL,
  `source` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `libelle` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.entrees : ~8 rows (environ)
INSERT INTO `entrees` (`id`, `id_user`, `id_projet`, `montant_recu`, `date_approvisionnement`, `source`, `libelle`, `statut`, `created_at`, `updated_at`) VALUES
	(1, 1, 1, 150000.00, '2025-07-17', 'Banque', 'reste quelques choses', '1', '2025-07-03 14:21:58', '2025-07-09 14:54:44'),
	(2, 1, 2, 3000000.00, '2025-02-13', 'Banque', 'ok', '1', '2025-07-03 14:26:02', '2025-07-09 14:55:53'),
	(3, 1, 8, 200000.00, '2025-07-04', 'Banque', 'ok', '1', '2025-07-04 14:32:36', '2025-07-09 15:06:45'),
	(7, 1, 2, 2300.00, '2025-07-19', 'Banque', 'ok', '1', '2025-07-09 14:57:42', '2025-07-10 12:22:31'),
	(9, 4, 17, 12000.00, '2025-07-20', 'Banque', 'ok', '1', '2025-07-10 14:12:48', '2025-07-20 13:40:53'),
	(10, 2, 18, 20000.00, '2025-07-18', 'Banque', 'ok', '1', '2025-07-18 14:00:48', '2025-07-18 14:00:48'),
	(11, 2, 12, 200000.00, '2025-07-20', 'Banque', 'Financement maximal', '1', '2025-07-20 11:58:28', '2025-07-20 11:58:28'),
	(12, 2, 12, 5000.00, '2025-07-20', 'Banque', 'OK', '1', '2025-07-20 14:31:33', '2026-07-10 18:25:11');

-- Listage de la structure de table bdprojet. equipements
CREATE TABLE IF NOT EXISTS `equipements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `equipement` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `equipements_equipement_unique` (`equipement`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.equipements : ~7 rows (environ)
INSERT INTO `equipements` (`id`, `equipement`, `statut`, `created_at`, `updated_at`) VALUES
	(1, 'Ordinateur', '1', '2025-07-03 11:48:21', '2025-07-08 14:09:50'),
	(2, 'Hache', '1', '2025-07-03 11:48:59', '2025-07-03 11:48:59'),
	(3, 'Table', '1', '2025-07-03 11:52:12', '2025-07-03 11:52:12'),
	(4, 'Chaise', '1', '2025-07-08 14:10:13', '2025-07-10 12:24:43'),
	(14, 'Stylo', '1', '2025-07-19 21:09:10', '2026-07-10 14:31:23'),
	(15, 'h', '0', '2025-07-20 14:03:58', '2025-07-20 14:04:04'),
	(16, 'Télévision', '1', '2025-07-20 14:35:13', '2025-07-20 14:35:13');

-- Listage de la structure de table bdprojet. failed_jobs
CREATE TABLE IF NOT EXISTS `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.failed_jobs : ~0 rows (environ)

-- Listage de la structure de table bdprojet. fonctions
CREATE TABLE IF NOT EXISTS `fonctions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom_fonction` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fonctions_nom_fonction_unique` (`nom_fonction`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.fonctions : ~4 rows (environ)
INSERT INTO `fonctions` (`id`, `nom_fonction`, `statut`, `created_at`, `updated_at`) VALUES
	(1, 'Mecanicien', '1', '2025-06-29 14:45:27', '2025-06-29 14:54:39'),
	(2, 'Chauffeur', '1', '2025-07-02 13:14:47', '2025-07-02 13:15:05'),
	(3, 'Logisticien', '1', '2025-07-02 13:20:21', '2025-07-02 13:20:21'),
	(4, 'Informaticien', '1', '2025-07-02 14:02:27', '2025-07-10 12:20:40'),
	(7, 'Comptable', '1', '2025-07-20 14:30:13', '2025-07-20 14:30:13');

-- Listage de la structure de table bdprojet. logistiques
CREATE TABLE IF NOT EXISTS `logistiques` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_user` int NOT NULL,
  `id_equipement` int NOT NULL,
  `id_projet` int NOT NULL,
  `quantite` int NOT NULL,
  `desciption` text COLLATE utf8mb4_unicode_ci,
  `statut` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.logistiques : ~9 rows (environ)
INSERT INTO `logistiques` (`id`, `id_user`, `id_equipement`, `id_projet`, `quantite`, `desciption`, `statut`, `created_at`, `updated_at`) VALUES
	(1, 1, 1, 1, 15, 'ancien', '1', '2025-07-03 12:32:59', '2025-07-09 16:28:37'),
	(2, 1, 3, 1, 10, 'en bon etat', '1', '2025-07-03 12:37:23', '2025-07-03 12:37:23'),
	(3, 1, 2, 1, 50, 'bon état', '1', '2025-07-03 12:47:34', '2025-07-03 12:48:45'),
	(4, 1, 1, 2, 17, 'mauvais état', '1', '2025-07-03 13:02:59', '2025-07-07 09:33:08'),
	(5, 1, 4, 1, 12, 'bon état', '1', '2025-07-08 14:14:56', '2025-07-10 12:25:04'),
	(8, 1, 2, 10, 12, 'hj', '0', '2025-07-09 16:28:31', '2025-07-09 16:28:52'),
	(11, 4, 4, 18, 10, 'mauvais état', '1', '2025-07-11 11:17:44', '2025-07-11 11:17:44'),
	(12, 2, 3, 2, 4, 'bon état', '1', '2025-07-19 20:52:26', '2025-07-19 20:52:26'),
	(13, 2, 14, 2, 10, 'ok', '1', '2025-07-19 21:09:55', '2025-07-19 21:09:55'),
	(14, 2, 2, 12, 10, 'bon état', '1', '2025-07-20 12:04:04', '2025-07-20 12:04:04'),
	(15, 2, 16, 12, 2, 'bon etat', '1', '2025-07-20 14:36:32', '2026-07-10 14:10:37');

-- Listage de la structure de table bdprojet. logs
CREATE TABLE IF NOT EXISTS `logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_user` int DEFAULT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.logs : ~27 rows (environ)
INSERT INTO `logs` (`id`, `id_user`, `action`, `entity_type`, `entity_id`, `description`, `created_at`, `updated_at`) VALUES
	(1, 2, 'login', 'utilisateur', 2, 'Connexion de FAMBA NGOY', '2026-07-10 14:00:30', '2026-07-10 14:00:30'),
	(2, 2, 'login', 'utilisateur', 2, 'Connexion de FAMBA NGOY', '2026-07-10 14:01:25', '2026-07-10 14:01:25'),
	(3, 2, 'login', 'utilisateur', 2, 'Connexion de FAMBA NGOY', '2026-07-10 14:09:24', '2026-07-10 14:09:24'),
	(4, 2, 'update', 'logistique', 15, 'Modification de la logistique', '2026-07-10 14:10:37', '2026-07-10 14:10:37'),
	(5, 2, 'update', 'personnel', 16, 'Modification du personnel', '2026-07-10 14:11:47', '2026-07-10 14:11:47'),
	(6, 2, 'update', 'personnel', 16, 'Modification du personnel', '2026-07-10 14:12:00', '2026-07-10 14:12:00'),
	(7, 2, 'update', 'projet', 24, 'Modification du projet', '2026-07-10 14:12:31', '2026-07-10 14:12:31'),
	(8, 2, 'update', 'activite', 12, 'Modification de l\'activité', '2026-07-10 14:12:48', '2026-07-10 14:12:48'),
	(9, 2, 'update', 'equipement', 14, 'Modification de l\'équipement', '2026-07-10 14:31:15', '2026-07-10 14:31:15'),
	(10, 2, 'update', 'equipement', 14, 'Modification de l\'équipement', '2026-07-10 14:31:23', '2026-07-10 14:31:23'),
	(11, 2, 'update', 'utilisateur', 4, 'Modification d\'un utilisateur', '2026-07-10 14:32:14', '2026-07-10 14:32:14'),
	(12, 2, 'update', 'utilisateur', 4, 'Modification d\'un utilisateur', '2026-07-10 14:32:29', '2026-07-10 14:32:29'),
	(13, 4, 'login', 'utilisateur', 4, 'Connexion de Patrick BOLA', '2026-07-10 14:32:43', '2026-07-10 14:32:43'),
	(14, 2, 'login', 'utilisateur', 2, 'Connexion de FAMBA NGOY', '2026-07-10 14:33:50', '2026-07-10 14:33:50'),
	(15, 2, 'login', 'utilisateur', 2, 'Connexion de FAMBA NGOY', '2026-07-10 15:41:29', '2026-07-10 15:41:29'),
	(16, 2, 'login', 'utilisateur', 2, 'Connexion de FAMBA NGOY', '2026-07-10 18:08:33', '2026-07-10 18:08:33'),
	(17, 2, 'update', 'district', 4, 'Modification du district', '2026-07-10 18:23:44', '2026-07-10 18:23:44'),
	(18, 2, 'update', 'district', 4, 'Modification du district', '2026-07-10 18:24:03', '2026-07-10 18:24:03'),
	(19, 2, 'update', 'entree', 12, 'Modification d\'une entrée financière', '2026-07-10 18:25:11', '2026-07-10 18:25:11'),
	(20, 2, 'update', 'sortie', 12, 'Modification d\'une sortie financière', '2026-07-10 18:25:42', '2026-07-10 18:25:42'),
	(21, 2, 'update', 'activite', 2, 'Modification de l\'activité', '2026-07-10 18:58:15', '2026-07-10 18:58:15'),
	(22, 2, 'login', 'utilisateur', 2, 'Connexion de FAMBA NGOY', '2026-07-11 06:09:04', '2026-07-11 06:09:04'),
	(23, 2, 'login', 'utilisateur', 2, 'Connexion de FAMBA NGOY', '2026-07-16 07:08:57', '2026-07-16 07:08:57'),
	(24, 2, 'create', 'province', 18, 'Création de la province : mm', '2026-07-16 13:02:21', '2026-07-16 13:02:21'),
	(25, 2, 'delete', 'province', 18, 'Suppression de la province', '2026-07-16 13:02:27', '2026-07-16 13:02:27'),
	(26, 2, 'login', 'utilisateur', 2, 'Connexion de FAMBA NGOY', '2026-07-17 09:37:30', '2026-07-17 09:37:30'),
	(27, 2, 'login', 'utilisateur', 2, 'Connexion de FAMBA NGOY', '2026-07-17 09:50:03', '2026-07-17 09:50:03');

-- Listage de la structure de table bdprojet. migrations
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.migrations : ~24 rows (environ)
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(1, '2014_10_12_000000_create_users_table', 1),
	(2, '2014_10_12_100000_create_password_resets_table', 1),
	(3, '2019_08_19_000000_create_failed_jobs_table', 1),
	(4, '2019_12_14_000001_create_personal_access_tokens_table', 1),
	(5, '2025_06_26_162240_create_provinces_table', 1),
	(6, '2025_06_27_200512_create_districts_table', 1),
	(7, '2025_06_28_093101_create_logistiques_table', 1),
	(8, '2025_06_29_162710_create_fonctions_table', 2),
	(9, '2025_06_29_165901_create_personnels_table', 3),
	(10, '2025_06_29_200113_create_document_personels_table', 4),
	(11, '2025_06_30_090141_create_cout_budgets_table', 5),
	(12, '2025_06_30_093323_create_document_couts_table', 6),
	(13, '2025_06_30_101558_create_activites_table', 7),
	(14, '2025_06_30_103620_create_document_activites_table', 8),
	(15, '2025_07_03_103810_create_projets_table', 9),
	(16, '2025_07_03_132820_create_equipements_table', 10),
	(17, '2025_07_03_140346_create_logistiques_table', 11),
	(18, '2025_07_03_151329_create_activites_table', 12),
	(19, '2025_07_03_160330_create_entrees_table', 13),
	(20, '2025_07_03_163849_create_sorties_table', 14),
	(21, '2025_07_04_130231_create_document_entrees_table', 15),
	(22, '2025_07_04_133759_create_document_sorties_table', 16),
	(23, '2025_07_04_140154_create_document_personnels_table', 17),
	(24, '2025_07_04_143952_create_document_projets_table', 18),
	(25, '2025_07_07_114945_create_utilisateurs_table', 19),
	(26, '2025_07_18_162949_create_partenaires_table', 20),
	(27, '2025_07_10_000000_create_logs_table', 21);

-- Listage de la structure de table bdprojet. partenaires
CREATE TABLE IF NOT EXISTS `partenaires` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom_partenaire` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `partenaires_nom_partenaire_unique` (`nom_partenaire`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.partenaires : ~2 rows (environ)
INSERT INTO `partenaires` (`id`, `nom_partenaire`, `statut`, `created_at`, `updated_at`) VALUES
	(3, 'REGIDESO', '1', '2025-07-18 15:11:04', '2025-07-18 15:11:04'),
	(4, 'CNSS', '1', '2025-07-18 15:11:13', '2025-07-18 15:11:13'),
	(5, 'HH', '0', '2025-07-18 15:13:44', '2025-07-18 15:14:15'),
	(6, 'USAID', '1', '2025-07-20 14:30:30', '2025-07-20 14:30:30');

-- Listage de la structure de table bdprojet. password_resets
CREATE TABLE IF NOT EXISTS `password_resets` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  KEY `password_resets_email_index` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.password_resets : ~0 rows (environ)

-- Listage de la structure de table bdprojet. personal_access_tokens
CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB AUTO_INCREMENT=117 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.personal_access_tokens : ~97 rows (environ)
INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `created_at`, `updated_at`) VALUES
	(1, 'App\\Models\\Utilisateur', 2, 'API Token', '32bdf002d3a087a041f8f265728396902d88355d5f4a36faa2bd8013097a6a3f', '["*"]', NULL, '2025-07-07 11:15:19', '2025-07-07 11:15:19'),
	(2, 'App\\Models\\Utilisateur', 2, 'API Token', '0772a1afe41724e93df19426861e4d2fc15c0e6cecc2f7ff0aaf8579ad8a1418', '["*"]', NULL, '2025-07-07 11:15:35', '2025-07-07 11:15:35'),
	(3, 'App\\Models\\Utilisateur', 2, 'API Token', '5682909e284de0b23debc9cfc36e70dce0533c4ad26816778ce39fc1be74861a', '["*"]', NULL, '2025-07-07 11:16:27', '2025-07-07 11:16:27'),
	(4, 'App\\Models\\Utilisateur', 2, 'API Token', '5c0e1fa8c3c77b95af4e61f04a2fc43b2c591e1ee41c50a281e72e71b9599281', '["*"]', NULL, '2025-07-07 11:16:35', '2025-07-07 11:16:35'),
	(5, 'App\\Models\\Utilisateur', 2, 'API Token', 'fa50ec57e961ccc980e443fcd3f73a4bed117a07aad8f401a9003267f0208c72', '["*"]', NULL, '2025-07-07 11:17:29', '2025-07-07 11:17:29'),
	(6, 'App\\Models\\Utilisateur', 2, 'API Token', '440209df24aaa76e5fd4dd18b212fb0208c0c521150bfcaf8c68efe2b5d18d7a', '["*"]', '2025-07-07 11:25:34', '2025-07-07 11:18:33', '2025-07-07 11:25:34'),
	(7, 'App\\Models\\Utilisateur', 2, 'API Token', '6fcbd007716936a5a4e18cba6da373ebbe437ccef6449a75c153e0eb058bddf7', '["*"]', '2025-07-07 11:38:20', '2025-07-07 11:33:30', '2025-07-07 11:38:20'),
	(8, 'App\\Models\\Utilisateur', 2, 'API Token', 'cc9efa489b27ba04f5c8e1f3fcaf474d7c52f87203ada8d0e299d3e06a6fe96a', '["*"]', '2025-07-07 11:55:31', '2025-07-07 11:39:08', '2025-07-07 11:55:31'),
	(9, 'App\\Models\\Utilisateur', 2, 'API Token', '5e3b4a30f6d6fd9349f57007ab016e6a12a04bd7f59925a364f21c95ca08acf3', '["*"]', '2025-07-07 19:59:55', '2025-07-07 18:10:07', '2025-07-07 19:59:55'),
	(10, 'App\\Models\\Utilisateur', 2, 'API Token', '89b2e4f0c83d9bd4f2c5524d3412ae52af4869d611918f5ed7d3b22261ccf6c1', '["*"]', '2025-07-08 08:44:42', '2025-07-08 07:37:52', '2025-07-08 08:44:42'),
	(11, 'App\\Models\\Utilisateur', 2, 'API Token', 'ecf524a426396214cdd544160d8a6923effb4fc1924040a122b3967d9c444589', '["*"]', NULL, '2025-07-09 07:56:42', '2025-07-09 07:56:42'),
	(12, 'App\\Models\\Utilisateur', 2, 'API Token', '54818495a03b35f3764923f874e1268f7b7d3e09d8328ff8602c85a5a55b0fd6', '["*"]', NULL, '2025-07-09 12:18:25', '2025-07-09 12:18:25'),
	(13, 'App\\Models\\Utilisateur', 2, 'API Token', 'e5bdb2f835e576e4dc0ba9ff592797c45a9da129b6e27b9cc65f6e052b89a27b', '["*"]', NULL, '2025-07-10 09:13:58', '2025-07-10 09:13:58'),
	(14, 'App\\Models\\Utilisateur', 2, 'API Token', 'a403eda2925c766aa62485e4ee62b804c363756051475bc8908378fc7cb6f23b', '["*"]', NULL, '2025-07-10 10:39:06', '2025-07-10 10:39:06'),
	(15, 'App\\Models\\Utilisateur', 2, 'API Token', '07f8a2c675c0be2b7bef43d62c89adceaca0677f221673bd504379f45283a437', '["*"]', NULL, '2025-07-10 10:39:30', '2025-07-10 10:39:30'),
	(16, 'App\\Models\\Utilisateur', 2, 'API Token', '4b7f50facaf92f4053585fc06c4f37737da520c8e3701d056c5feaa97c2eabc4', '["*"]', NULL, '2025-07-10 10:46:11', '2025-07-10 10:46:11'),
	(17, 'App\\Models\\Utilisateur', 2, 'API Token', '1f5e93ab0c8ad0c8d0e8bed48174051e353d2d05f603a4cd86b9732a48ea1a72', '["*"]', NULL, '2025-07-10 11:08:08', '2025-07-10 11:08:08'),
	(18, 'App\\Models\\Utilisateur', 2, 'API Token', 'cc8274b72994590d1a4339b5cd114a3424f64561b9c44e10370e06b17f53b2c7', '["*"]', NULL, '2025-07-10 12:32:27', '2025-07-10 12:32:27'),
	(19, 'App\\Models\\Utilisateur', 2, 'API Token', 'a0a99c006ced135d819c9ccc1e63ae1c39e5914c06192b51d2125dd3b1a3900c', '["*"]', NULL, '2025-07-10 12:40:05', '2025-07-10 12:40:05'),
	(20, 'App\\Models\\Utilisateur', 2, 'API Token', 'd33736c29537acda1099bda78025eafd5ab9c9fe3351d2b07cc931693703e692', '["*"]', NULL, '2025-07-10 12:43:38', '2025-07-10 12:43:38'),
	(21, 'App\\Models\\Utilisateur', 4, 'API Token', 'e7c334e568c6c1953b18feacfb4ed07585838a5195e3838a79a57f74324cf32c', '["*"]', NULL, '2025-07-10 13:06:10', '2025-07-10 13:06:10'),
	(22, 'App\\Models\\Utilisateur', 2, 'API Token', '1f614fa79eaa2e677909d884779426b06097ce4a82154de3c7f2b7c52d5d56d1', '["*"]', NULL, '2025-07-10 13:54:05', '2025-07-10 13:54:05'),
	(23, 'App\\Models\\Utilisateur', 4, 'API Token', '4d6bd2ff3a5c0d6c99f371edfd6f777bc617f28d8f837d3b0458df7cfee52ffb', '["*"]', NULL, '2025-07-10 13:54:45', '2025-07-10 13:54:45'),
	(24, 'App\\Models\\Utilisateur', 2, 'API Token', '6bf2f2478b70f0cc4c650c99883da63ac5bce3b4f6453afb6aedfa8eec21e1a4', '["*"]', NULL, '2025-07-10 13:58:05', '2025-07-10 13:58:05'),
	(25, 'App\\Models\\Utilisateur', 2, 'API Token', '586668e3e2c31f1fd52ca686a99a801dc41bae49d6e42ea087160718393a29a9', '["*"]', NULL, '2025-07-10 14:10:06', '2025-07-10 14:10:06'),
	(26, 'App\\Models\\Utilisateur', 4, 'API Token', 'cba4a0f8fcf8b1f43da13c3ab3cbabb4d60714990b52f09db7182d506418d047', '["*"]', NULL, '2025-07-10 14:10:51', '2025-07-10 14:10:51'),
	(27, 'App\\Models\\Utilisateur', 2, 'API Token', '670c28f6d505385ab0259515cabbcf936f99277277d7cfac5a9aeb6461e9cac5', '["*"]', NULL, '2025-07-10 14:28:37', '2025-07-10 14:28:37'),
	(28, 'App\\Models\\Utilisateur', 4, 'API Token', 'fb5b6b9b8c61e7302a9c79e70d7a65c83007b30239f651b00ad127c6729afede', '["*"]', NULL, '2025-07-10 14:36:00', '2025-07-10 14:36:00'),
	(29, 'App\\Models\\Utilisateur', 2, 'API Token', '1990836167086fb54c0baa04c5643609b2daebbaa7e3ba57beb9a41a1da59757', '["*"]', NULL, '2025-07-10 14:39:24', '2025-07-10 14:39:24'),
	(30, 'App\\Models\\Utilisateur', 4, 'API Token', '74daf03921923253821fec37aa9c172f5c3b24bb6dafa824b2e39ed5a0cc852a', '["*"]', NULL, '2025-07-10 14:48:16', '2025-07-10 14:48:16'),
	(31, 'App\\Models\\Utilisateur', 2, 'API Token', '8fe678c1b0a4bd3a1df7c8d6867aa1246c6ef9825fb4f80b16e865390381d741', '["*"]', NULL, '2025-07-10 14:56:58', '2025-07-10 14:56:58'),
	(32, 'App\\Models\\Utilisateur', 4, 'API Token', 'a855ab17e9057cd858e4edec72d96afe983ff6ef62f9bf9056d0eae17c4cf5e9', '["*"]', NULL, '2025-07-10 15:23:05', '2025-07-10 15:23:05'),
	(33, 'App\\Models\\Utilisateur', 4, 'API Token', 'a2748e2ef0cbac32c50befd8c49fef2836c434f0aa4335c6a563725c9ff520af', '["*"]', NULL, '2025-07-10 15:24:26', '2025-07-10 15:24:26'),
	(34, 'App\\Models\\Utilisateur', 2, 'API Token', 'ee7331c3178232e74dc735526666368b92af37f3837b5bc529f741af96cd53fc', '["*"]', NULL, '2025-07-10 15:25:59', '2025-07-10 15:25:59'),
	(35, 'App\\Models\\Utilisateur', 4, 'API Token', 'fec0c9c89addebe07d1eed3b5ee7ca3185b1ffa148e70dfee969922ffea71602', '["*"]', NULL, '2025-07-10 15:31:21', '2025-07-10 15:31:21'),
	(36, 'App\\Models\\Utilisateur', 2, 'API Token', '87e2faddfa8ed3a30a39aa246c5e8eab39bcc5d3380e67e67a91df202e6c5090', '["*"]', NULL, '2025-07-10 15:57:56', '2025-07-10 15:57:56'),
	(37, 'App\\Models\\Utilisateur', 4, 'API Token', '8fc895d9c2d46ece83553132192f1abaca63fc946a60fe6f1cbfaa4321969f6d', '["*"]', NULL, '2025-07-10 15:58:45', '2025-07-10 15:58:45'),
	(38, 'App\\Models\\Utilisateur', 2, 'API Token', '65b45e4ee2785029d80517cc31b7ab3db9f9dc60a514744ddb21eb067a71bb6e', '["*"]', NULL, '2025-07-10 16:02:51', '2025-07-10 16:02:51'),
	(39, 'App\\Models\\Utilisateur', 2, 'API Token', '38fe655d7fbaf53e2d8cc583efc6c521f2580cb6d1a5476ea8032625f3c672c5', '["*"]', NULL, '2025-07-10 16:06:52', '2025-07-10 16:06:52'),
	(40, 'App\\Models\\Utilisateur', 4, 'API Token', '4a0a26aab153dc005ed33354ea80018665c7abeee50d3f8e98a997b2ba6cb325', '["*"]', NULL, '2025-07-10 16:13:42', '2025-07-10 16:13:42'),
	(41, 'App\\Models\\Utilisateur', 2, 'API Token', 'a5c31bd8d17332966787256508032e0def76b40537752cb7fa03c2ec877c88c8', '["*"]', NULL, '2025-07-11 06:40:15', '2025-07-11 06:40:15'),
	(42, 'App\\Models\\Utilisateur', 4, 'API Token', 'b12721b8fa8bc199f9d07855c10cfa2a70ed18a38c91dd7934ff2294bbf78212', '["*"]', NULL, '2025-07-11 06:40:43', '2025-07-11 06:40:43'),
	(43, 'App\\Models\\Utilisateur', 2, 'API Token', 'bbb16041e0171b2d5f1e9c914f4dcd945e7933f1d63ba48042307c0aa02ae0d4', '["*"]', NULL, '2025-07-11 06:42:18', '2025-07-11 06:42:18'),
	(44, 'App\\Models\\Utilisateur', 4, 'API Token', '5b5404a46500491b412a226d098c34caab724491458ed1906d4199ed32bc3e07', '["*"]', NULL, '2025-07-11 06:43:29', '2025-07-11 06:43:29'),
	(45, 'App\\Models\\Utilisateur', 4, 'API Token', '10bbee2895906462f109e326c7b7e602384887df9475bd5cef3fc87227ecfdb7', '["*"]', NULL, '2025-07-11 07:16:39', '2025-07-11 07:16:39'),
	(46, 'App\\Models\\Utilisateur', 4, 'API Token', 'ed048c9a0500e02d9770d4c5a0cc63330ac3bd30aaab671f6e30233b4f9d3d1e', '["*"]', NULL, '2025-07-11 07:43:37', '2025-07-11 07:43:37'),
	(47, 'App\\Models\\Utilisateur', 2, 'API Token', 'd26b281a40e3c5a7c2c56faf5b492db194153de03ac48c0010f3947f171c3918', '["*"]', NULL, '2025-07-11 07:44:02', '2025-07-11 07:44:02'),
	(48, 'App\\Models\\Utilisateur', 4, 'API Token', '1afe4e31419e57a806fab73dc402d118f82c28ff5f4a89cb72ed4ad0aefb2496', '["*"]', NULL, '2025-07-11 07:47:24', '2025-07-11 07:47:24'),
	(49, 'App\\Models\\Utilisateur', 4, 'API Token', 'e2d608e13d72ff93f9857def52801994f7aef010d588aa6fb69f03800be3a95f', '["*"]', NULL, '2025-07-11 09:02:14', '2025-07-11 09:02:14'),
	(50, 'App\\Models\\Utilisateur', 2, 'API Token', '553cf809ed91efc59c572af9518f56702215c22497ce17d5d50a1a64d20c22bd', '["*"]', NULL, '2025-07-11 09:12:23', '2025-07-11 09:12:23'),
	(51, 'App\\Models\\Utilisateur', 4, 'API Token', '0cf30b9d29ce1e5e7fa6e30d387e20ed78835a40f552c72ea1e11e1b7f6b2767', '["*"]', NULL, '2025-07-11 09:13:54', '2025-07-11 09:13:54'),
	(52, 'App\\Models\\Utilisateur', 4, 'API Token', '56b524087cd39969727af8f37ae9c332680f4eb593b10ec5dc3adf3e2a9e0db7', '["*"]', NULL, '2025-07-11 09:42:17', '2025-07-11 09:42:17'),
	(53, 'App\\Models\\Utilisateur', 2, 'API Token', '7e8a6ea1f6e5470a6b26ab0747fe462b40856d2421d577a8e4910882e892f1f5', '["*"]', NULL, '2025-07-11 09:57:33', '2025-07-11 09:57:33'),
	(54, 'App\\Models\\Utilisateur', 4, 'API Token', 'b5e33a9cc2bfcbe98123284eb435ea41f02ada58180c63da5f35878d63dc852e', '["*"]', NULL, '2025-07-11 10:51:56', '2025-07-11 10:51:56'),
	(55, 'App\\Models\\Utilisateur', 2, 'API Token', 'b7d9556efdd1a72486a9da0faec935fbc32b5d973b7546a29ce8f099416b6e07', '["*"]', '2025-07-11 11:22:29', '2025-07-11 11:22:27', '2025-07-11 11:22:29'),
	(56, 'App\\Models\\Utilisateur', 4, 'API Token', '437adaa7803bb3786529069c23e730d7ed0b44cec4abed5b66c52c7c4fd529a8', '["*"]', '2025-07-12 18:22:20', '2025-07-11 11:23:00', '2025-07-12 18:22:20'),
	(57, 'App\\Models\\Utilisateur', 2, 'API Token', '1adfe7933a780a877c46da4da8447772690de9c48d4dbaf2873ef916d7940766', '["*"]', '2025-07-11 11:52:13', '2025-07-11 11:51:39', '2025-07-11 11:52:13'),
	(58, 'App\\Models\\Utilisateur', 2, 'API Token', '8d9084d27a9dfd7d088d5aacaa1b8079af43f124b3cd9eeeea1e7152c2120236', '["*"]', '2025-07-12 17:15:45', '2025-07-12 17:11:13', '2025-07-12 17:15:45'),
	(59, 'App\\Models\\Utilisateur', 2, 'API Token', 'bd1416e61bb506f99da695eb2e7cd445ccb5d50389bc3ebaddc2254742e9ac3e', '["*"]', '2025-07-12 18:27:18', '2025-07-12 18:00:17', '2025-07-12 18:27:18'),
	(60, 'App\\Models\\Utilisateur', 2, 'API Token', 'f96d655b7aa7f078d531df531d88ca5327cbcb06fd7cf25e907542858c248a72', '["*"]', '2025-07-12 18:46:13', '2025-07-12 18:22:41', '2025-07-12 18:46:13'),
	(61, 'App\\Models\\Utilisateur', 2, 'API Token', 'dfc6a07a679fd01966ac7b4921eb44c2b5dc2a2d575e3683e7de6c0b5a4fd0a4', '["*"]', '2025-07-12 18:28:36', '2025-07-12 18:27:50', '2025-07-12 18:28:36'),
	(62, 'App\\Models\\Utilisateur', 4, 'API Token', '8d4342cc8bad68f2d4546b7abb4b0fb0f1563621e3595ecda9383bf69f505940', '["*"]', '2025-07-12 18:47:52', '2025-07-12 18:47:28', '2025-07-12 18:47:52'),
	(63, 'App\\Models\\Utilisateur', 2, 'API Token', '2d874d6796db7b1d4fc0939d9f15baba41fbf9d340eefe4595327817a28ba392', '["*"]', NULL, '2025-07-18 09:13:07', '2025-07-18 09:13:07'),
	(64, 'App\\Models\\Utilisateur', 2, 'API Token', '74ee4fe7120593433fb7bbd1cd3addf1f2f48f9aecccd661e9a1032d2fd62f94', '["*"]', '2025-07-18 11:05:33', '2025-07-18 09:13:09', '2025-07-18 11:05:33'),
	(65, 'App\\Models\\Utilisateur', 2, 'API Token', 'eafa6e1b1a33b9ceacf9077d46b0c3a147523cd96f6734b0d5100422da951fef', '["*"]', '2025-07-18 13:02:31', '2025-07-18 11:15:24', '2025-07-18 13:02:31'),
	(66, 'App\\Models\\Utilisateur', 2, 'API Token', '9e363088deb2ec2e3753e69322e5c8c1c87373eb0ef9f05dd7a3b8ea10fe5858', '["*"]', '2025-07-18 12:18:48', '2025-07-18 11:38:27', '2025-07-18 12:18:48'),
	(67, 'App\\Models\\Utilisateur', 2, 'API Token', '488d5a717cadf54602987431ef02534b416c969bfc389ddb9e1e3bfc133ab79a', '["*"]', '2025-07-18 12:26:05', '2025-07-18 12:25:55', '2025-07-18 12:26:05'),
	(68, 'App\\Models\\Utilisateur', 2, 'API Token', '9c44caa73bd8777a7f3fc95877950778d5ec29948213a7eff0165c261df9ff4c', '["*"]', '2025-07-18 14:16:47', '2025-07-18 12:32:34', '2025-07-18 14:16:47'),
	(69, 'App\\Models\\Utilisateur', 2, 'API Token', 'c9b72a336fbd55f8656d2fbd756ef8fc55b8231f8fa6c3daf06ea8efca20d0a0', '["*"]', '2025-07-18 15:01:11', '2025-07-18 15:01:10', '2025-07-18 15:01:11'),
	(70, 'App\\Models\\Utilisateur', 2, 'API Token', '7dbb86437270abdd5c8c17469e7aef1251f014680ac5143abbd707d3f2392611', '["*"]', '2025-07-18 15:03:37', '2025-07-18 15:03:36', '2025-07-18 15:03:37'),
	(71, 'App\\Models\\Utilisateur', 2, 'API Token', '60399ff8b18bc81cfe99e30a24363f3fb8eaff9a138e6363c23d84f0c68e1898', '["*"]', '2025-07-18 16:02:28', '2025-07-18 15:07:42', '2025-07-18 16:02:28'),
	(72, 'App\\Models\\Utilisateur', 2, 'API Token', 'b6e27bffeb049f8dcae41aa42b1683ffef12ac92b9056cadff049584f93397cf', '["*"]', '2025-07-18 16:07:40', '2025-07-18 16:02:51', '2025-07-18 16:07:40'),
	(73, 'App\\Models\\Utilisateur', 2, 'API Token', '7e8d15968330b6d247600ccdb04593c827e8a1ff71664728d772d20cb8c1895e', '["*"]', '2025-07-19 13:25:59', '2025-07-18 16:08:04', '2025-07-19 13:25:59'),
	(74, 'App\\Models\\Utilisateur', 2, 'API Token', '7e7a23039a0dc3ecc87228e59c69db7eaa7b8ee13c4b68b09ddd30cd9cda75b2', '["*"]', '2025-07-19 14:07:15', '2025-07-19 13:25:53', '2025-07-19 14:07:15'),
	(75, 'App\\Models\\Utilisateur', 2, 'API Token', '60b8420f6ff6f36c8a78fbe7e2b58d20ab9d604a3b6c3607bbd81e437470c5d5', '["*"]', '2025-07-20 13:23:38', '2025-07-19 14:07:57', '2025-07-20 13:23:38'),
	(76, 'App\\Models\\Utilisateur', 2, 'API Token', '46165a00b482b99ffe9ee795b85e61333369a5166bd68ec88e45056e52f563fb', '["*"]', '2025-07-20 08:23:49', '2025-07-19 14:20:08', '2025-07-20 08:23:49'),
	(77, 'App\\Models\\Utilisateur', 2, 'API Token', '8256a7ad69bcc84bb02d40da3ef6e85a0a6ec0cd7a7488e019215f69e13b5fd1', '["*"]', '2025-07-20 11:30:18', '2025-07-20 08:23:52', '2025-07-20 11:30:18'),
	(78, 'App\\Models\\Utilisateur', 2, 'API Token', 'c819b526113b613c1a07a717aa8a83f63635a08bad8ae1c9ce28e4bdcab7ca0f', '["*"]', '2025-07-20 12:42:03', '2025-07-20 11:30:22', '2025-07-20 12:42:03'),
	(79, 'App\\Models\\Utilisateur', 2, 'API Token', '147960058039fe56eed8d6cce426689f7d9f89b2aa0067c0357ec6df4f56a264', '["*"]', '2025-07-20 13:14:43', '2025-07-20 13:14:42', '2025-07-20 13:14:43'),
	(80, 'App\\Models\\Utilisateur', 2, 'API Token', '3ce90f5e4e14c34885bba73ac9bf261423718c59ddbff8bcf6bef905fe9b3699', '["*"]', '2025-07-20 13:19:21', '2025-07-20 13:19:19', '2025-07-20 13:19:21'),
	(81, 'App\\Models\\Utilisateur', 2, 'API Token', '658474d413d3ce9303a2343468e8e177daf654eedb54760752a8629a6a04d507', '["*"]', '2025-07-20 13:19:43', '2025-07-20 13:19:42', '2025-07-20 13:19:43'),
	(82, 'App\\Models\\Utilisateur', 2, 'API Token', 'c952bc9e69605d13f7281e716305a4c4ef0fcee3a55effe6a122c0c58e378e84', '["*"]', '2025-07-20 13:22:57', '2025-07-20 13:22:56', '2025-07-20 13:22:57'),
	(83, 'App\\Models\\Utilisateur', 2, 'API Token', '7e774599c19d5debcdd061c34b890ca675d8638f4850595b5ca3978819293207', '["*"]', '2025-07-20 13:23:58', '2025-07-20 13:23:57', '2025-07-20 13:23:58'),
	(84, 'App\\Models\\Utilisateur', 2, 'API Token', '64d526d562d726421f01b6fe2ed0d81010eb63066cc9847b9a5ad330d89651f8', '["*"]', '2025-07-20 13:24:59', '2025-07-20 13:24:49', '2025-07-20 13:24:59'),
	(85, 'App\\Models\\Utilisateur', 2, 'API Token', '472c0c3744d242530f20eef049a23a26a854ca5b335416be00a632c049e98b78', '["*"]', '2025-07-20 13:25:17', '2025-07-20 13:25:16', '2025-07-20 13:25:17'),
	(86, 'App\\Models\\Utilisateur', 2, 'API Token', 'ae2376cf3d65a5b94b8d79c8aaf3d1795c29761a2830412193d096413c22827d', '["*"]', '2025-07-20 13:27:59', '2025-07-20 13:27:59', '2025-07-20 13:27:59'),
	(87, 'App\\Models\\Utilisateur', 2, 'API Token', '6b70f865ca61752e09aa2a220b796e11e5ab52c4f012787b8b63cac1dc63344c', '["*"]', '2025-07-20 13:34:59', '2025-07-20 13:28:36', '2025-07-20 13:34:59'),
	(88, 'App\\Models\\Utilisateur', 2, 'API Token', '207d60d89ca1a1d41728a1967aa55bbcee0a5d94c233f9eade6784820dd018b0', '["*"]', '2025-07-20 14:36:33', '2025-07-20 13:35:27', '2025-07-20 14:36:33'),
	(89, 'App\\Models\\Utilisateur', 2, 'API Token', 'a195ed0004c7936ebf504155721f5da6fd63220afc40654fe978e070b0da92d9', '["*"]', '2025-07-20 13:38:54', '2025-07-20 13:38:53', '2025-07-20 13:38:54'),
	(90, 'App\\Models\\Utilisateur', 4, 'API Token', '8f50b9d3d1dc3d78131be32688a7cfc2ae24946d74c465fa8fba7b2f7d9460d4', '["*"]', '2025-07-20 13:49:17', '2025-07-20 13:39:14', '2025-07-20 13:49:17'),
	(91, 'App\\Models\\Utilisateur', 2, 'API Token', 'ef1480f4825fa32cb31651fd27a592a8e282371d46ce27ddac4fdd0f745a5457', '["*"]', '2025-07-20 13:49:28', '2025-07-20 13:49:22', '2025-07-20 13:49:28'),
	(92, 'App\\Models\\Utilisateur', 4, 'API Token', 'c19fa3458fff4450cc3699b56babe3ad94557ca406298a45f704c89b3f58459c', '["*"]', '2025-07-20 14:45:00', '2025-07-20 13:49:51', '2025-07-20 14:45:00'),
	(93, 'App\\Models\\Utilisateur', 4, 'API Token', 'cb4d1aaca6f43ea21b2110ca5ddbed97c5d71e33b86f58503e3a16ef72eb93ec', '["*"]', '2025-07-20 17:20:55', '2025-07-20 15:04:30', '2025-07-20 17:20:55'),
	(94, 'App\\Models\\Utilisateur', 2, 'API Token', 'af082c638977302f5bb33841baf1c980b43ee4ac0c8e53f8022021259845d6a7', '["*"]', '2025-07-20 16:18:11', '2025-07-20 15:05:02', '2025-07-20 16:18:11'),
	(95, 'App\\Models\\Utilisateur', 4, 'API Token', 'eb7109613769d115e9b4682ca7bf7105381a560a248121f53bce12722b51265e', '["*"]', '2025-07-20 16:19:47', '2025-07-20 16:18:23', '2025-07-20 16:19:47'),
	(96, 'App\\Models\\Utilisateur', 2, 'API Token', '6ea4ee94273d31041ea0a4ef182069e0889f162c766ccdebb4bd64ad39bcacd4', '["*"]', '2025-07-20 16:26:14', '2025-07-20 16:20:02', '2025-07-20 16:26:14'),
	(97, 'App\\Models\\Utilisateur', 2, 'API Token', 'd2d0f46c918b55bcf8beb355d67931e18a609a358ec8c7d2700ca1bf1051dc6c', '["*"]', '2025-07-20 17:18:38', '2025-07-20 17:17:55', '2025-07-20 17:18:38'),
	(98, 'App\\Models\\Utilisateur', 2, 'API Token', 'be12ac9f1d20e171853a7d9734facd61612b5d095c046809e3bbb2d36db80cba', '["*"]', '2025-07-21 13:23:41', '2025-07-21 11:10:57', '2025-07-21 13:23:41'),
	(99, 'App\\Models\\Utilisateur', 2, 'API Token', 'fe32f8d00bffa9d28bd15d6440bb91b322a31ad1717997038c611dc22e9655cd', '["*"]', '2025-07-22 06:25:22', '2025-07-22 06:25:09', '2025-07-22 06:25:22'),
	(100, 'App\\Models\\Utilisateur', 4, 'API Token', 'c08c3d4b5ea0059ad4be18e26030bdcc1e7275b0fcf1ac6c080d3683b4ab0b0a', '["*"]', '2025-07-22 06:28:36', '2025-07-22 06:25:35', '2025-07-22 06:28:36'),
	(101, 'App\\Models\\Utilisateur', 4, 'API Token', '15b9c3567490cb51d59b95109e195ee0a1cb6900cd2f9b643cb5dfb84e3540e0', '["*"]', '2025-07-22 07:17:16', '2025-07-22 06:29:27', '2025-07-22 07:17:16'),
	(102, 'App\\Models\\Utilisateur', 2, 'API Token', '43646d43f0e1521a3388e8e3ce1c08a5c1f560dbeec3a96f058eea9f45dbbbf6', '["*"]', '2025-07-22 07:22:25', '2025-07-22 07:17:36', '2025-07-22 07:22:25'),
	(103, 'App\\Models\\Utilisateur', 2, 'API Token', '7c5c3a5b2160ff5bd92af4868e4df137b36066986aea3fd96eb181ee433987d7', '["*"]', '2025-07-22 07:37:17', '2025-07-22 07:32:27', '2025-07-22 07:37:17'),
	(104, 'App\\Models\\Utilisateur', 2, 'API Token', '5af682ec39fde7cef802f20b7d71ca9f3ff05513461e89cbf0f1a2855fd6d003', '["*"]', '2026-07-09 10:12:59', '2026-07-08 21:22:32', '2026-07-09 10:12:59'),
	(105, 'App\\Models\\Utilisateur', 2, 'API Token', '0d82c3fc6f94f5ea52c82d423013529fdbb8b1be2e6d3d127d202cb0bf058c2f', '["*"]', '2026-07-10 14:58:08', '2026-07-10 13:55:54', '2026-07-10 14:58:08'),
	(106, 'App\\Models\\Utilisateur', 2, 'API Token', 'cafc54a8ab7f8694e9b1a023fd0a6a6fc6ca22bb6a746b99c687ff259291b6ba', '["*"]', '2026-07-10 14:01:16', '2026-07-10 14:00:30', '2026-07-10 14:01:16'),
	(107, 'App\\Models\\Utilisateur', 2, 'API Token', '09f337eb5d33b73e78c6cf5b1b004e796f4abe042c39cd49d5f47dec4327dd8e', '["*"]', '2026-07-10 14:08:59', '2026-07-10 14:01:25', '2026-07-10 14:08:59'),
	(108, 'App\\Models\\Utilisateur', 2, 'API Token', '625562e34f931803def4dec5e58d452c03f7244541e52259db615dddf5f1d1bd', '["*"]', '2026-07-10 14:32:30', '2026-07-10 14:09:24', '2026-07-10 14:32:30'),
	(109, 'App\\Models\\Utilisateur', 4, 'API Token', '731b79ba33469b2eeaeccc8acd2c332f673b671e57552ed9f32033c953f583a8', '["*"]', '2026-07-10 14:33:38', '2026-07-10 14:32:43', '2026-07-10 14:33:38'),
	(110, 'App\\Models\\Utilisateur', 2, 'API Token', '3659d7f55b772b4f2978feccc545f3722f16fe90e17869f530124b2eb0905f28', '["*"]', '2026-07-10 14:36:23', '2026-07-10 14:33:50', '2026-07-10 14:36:23'),
	(111, 'App\\Models\\Utilisateur', 2, 'API Token', 'e27bc73a2e1d7013dfead7db142f5962e497730df861127833e465cdeae6cd4e', '["*"]', '2026-07-10 15:55:07', '2026-07-10 15:41:29', '2026-07-10 15:55:07'),
	(112, 'App\\Models\\Utilisateur', 2, 'API Token', 'e75d9185f2300359d24c273e471790fea35cfe87bf7f33cba994c1396c6bcec8', '["*"]', '2026-07-10 19:00:29', '2026-07-10 18:08:33', '2026-07-10 19:00:29'),
	(113, 'App\\Models\\Utilisateur', 2, 'API Token', '82c38ad1eca93c472ab09a26c6f6858097ddd826e8cc2ac0ff6cbf6aa6532fce', '["*"]', '2026-07-11 06:10:24', '2026-07-11 06:09:04', '2026-07-11 06:10:24'),
	(114, 'App\\Models\\Utilisateur', 2, 'API Token', '68b40a4e09f19f730b331fe7687ced82b8f657f3a0519350457bf22699f8361f', '["*"]', '2026-07-16 13:04:34', '2026-07-16 07:08:57', '2026-07-16 13:04:34'),
	(115, 'App\\Models\\Utilisateur', 2, 'API Token', 'd6b72724f51e29064481a180703df3519ffde655701812d1c7ef003ee4231042', '["*"]', '2026-07-17 09:37:48', '2026-07-17 09:37:30', '2026-07-17 09:37:48'),
	(116, 'App\\Models\\Utilisateur', 2, 'API Token', '4449b37a0b1cb56e05e280f62ea06a8c70c29f34d203322249539d829e461cec', '["*"]', '2026-07-17 10:04:00', '2026-07-17 09:50:03', '2026-07-17 10:04:00');

-- Listage de la structure de table bdprojet. personnels
CREATE TABLE IF NOT EXISTS `personnels` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_user` bigint unsigned NOT NULL,
  `id_fonction` bigint unsigned NOT NULL,
  `nom` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `adresse` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duree_contrat` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0',
  `telephone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `id_projet` int unsigned DEFAULT NULL,
  `etat` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personnels_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.personnels : ~8 rows (environ)
INSERT INTO `personnels` (`id`, `id_user`, `id_fonction`, `nom`, `prenom`, `adresse`, `email`, `duree_contrat`, `telephone`, `statut`, `created_at`, `updated_at`, `id_projet`, `etat`) VALUES
	(3, 1, 1, 'MATONDO', 'Pierre', 'KINGU 45', 'pierrpapy@gmail.com', '30 Jours', '+24389856478', '1', '2025-07-03 11:17:22', '2025-07-08 14:18:43', 1, '1'),
	(4, 1, 3, 'NGOY', 'FAMBA', 'Av Kasavubu 23', 'pierrepapy@gmail.com', '12 mois', '+24389856478', '1', '2025-07-03 11:19:46', '2025-07-03 11:19:46', 1, '1'),
	(5, 1, 4, 'KAKULE', 'Jean-Pierre', 'KATAKU 23', 't@gmail.com', '6 mois', '0898596521', '1', '2025-07-04 08:28:39', '2025-07-04 08:28:39', 1, '1'),
	(6, 1, 3, 'KALOMA', 'Papy', 'Kaisa 45', 'kaisa@gmail.com', '3 mois', '0898596521', '1', '2025-07-04 12:32:51', '2025-07-04 12:32:51', 2, '1'),
	(8, 1, 2, 'LANDU', 'David', 'KINGU 45', 'landu@gmail.com', '12 mois', '+24389856478', '1', '2025-07-08 14:24:02', '2025-07-10 12:22:09', 2, '1'),
	(14, 4, 4, 'ALINGONA', 'Paul', 'KINGU 45', 'alingo@gmail.com', '4 mois', '0898596501', '0', '2025-07-11 09:18:12', '2025-07-11 11:32:47', 18, '1'),
	(15, 2, 2, 'BABALI', 'BAOLI', 'KIONGA 45', 'babali@gmail.com', '12 mois', '0898596501', NULL, '2025-07-20 12:00:48', '2025-07-20 12:00:48', 12, '1'),
	(16, 2, 7, 'ALI', 'Paul', 'KUIPA 47', 'ali@gmail.com', '12 mois', '0985965421', NULL, '2025-07-20 14:33:25', '2026-07-10 14:12:00', 12, '1');

-- Listage de la structure de table bdprojet. projets
CREATE TABLE IF NOT EXISTS `projets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom_projet` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_district` bigint unsigned NOT NULL,
  `cout_total` decimal(15,2) NOT NULL,
  `duree_projet` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `etat` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `id_user` int unsigned DEFAULT NULL,
  `id_partenaire` int DEFAULT NULL,
  `date_debut` date DEFAULT NULL,
  `date_fin` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `projets_id_district_foreign` (`id_district`),
  CONSTRAINT `projets_id_district_foreign` FOREIGN KEY (`id_district`) REFERENCES `districts` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.projets : ~14 rows (environ)
INSERT INTO `projets` (`id`, `nom_projet`, `id_district`, `cout_total`, `duree_projet`, `statut`, `etat`, `created_at`, `updated_at`, `id_user`, `id_partenaire`, `date_debut`, `date_fin`) VALUES
	(1, 'P1', 3, 123000.00, '49 jours', 'En cours', '1', '2025-07-03 10:32:54', '2025-07-19 16:10:09', 2, 3, '2025-07-19', '2025-09-06'),
	(2, 'P2', 4, 450000.00, '10 jours', 'Suspendu', '1', '2025-07-03 10:41:09', '2025-07-19 15:27:29', 2, 4, '2025-07-19', '2025-07-29'),
	(3, 'P3', 2, 250000.00, '17 jours', 'En cours', '1', '2025-07-04 13:21:29', '2025-07-19 15:23:37', 2, 4, '2025-07-19', '2025-08-05'),
	(4, 'P4', 1, 150000.00, '5 jours', 'En cours', '1', '2025-07-04 13:23:33', '2025-07-19 15:27:08', 2, 4, '2025-07-19', '2025-07-24'),
	(5, 'P44', 5, 20000.00, '37 jours', 'En cours', '1', '2025-07-04 13:24:19', '2025-07-19 15:26:48', 2, 4, '2025-07-19', '2025-08-25'),
	(6, 'Projet ADC', 1, 200000.00, '3 jours', 'En cours', '1', '2025-07-04 13:25:22', '2025-07-19 15:25:01', 2, 4, '2025-07-19', '2025-07-22'),
	(7, 'Construction de Pont', 4, 125000.00, '20 jours', 'En cours', '1', '2025-07-04 13:26:31', '2025-07-19 15:24:41', 2, 4, '2025-07-19', '2025-08-08'),
	(8, 'Construction d\'une école', 6, 125000.00, '6 jours', 'Suspendu', '1', '2025-07-04 13:28:52', '2025-07-19 15:22:55', 2, 3, '2025-07-19', '2025-07-25'),
	(9, 'P5', 1, 120000.00, '215 jours', 'Suspendu', '1', '2025-07-04 13:33:14', '2025-07-19 15:22:10', 2, 4, '2025-07-19', '2026-02-19'),
	(10, 'P6', 5, 25000.00, '125 jours', 'Terminé', '1', '2025-07-04 13:34:04', '2025-07-19 15:21:44', 2, 4, '2025-07-19', '2025-11-21'),
	(12, 'Pont Mayindombe', 6, 25000.00, '252 jours', 'En cours', '1', '2025-07-08 14:02:36', '2025-07-19 15:21:21', 2, 3, '2025-07-19', '2026-03-28'),
	(17, 'P12', 4, 120000.00, '24 mois jours', 'En cours', '1', '2025-07-10 14:12:04', '2025-07-19 15:15:35', 2, 3, NULL, NULL),
	(18, 'Réhabilitations de maison communale', 6, 120000.00, '237 jours', 'En cours', '1', '2025-07-11 07:40:06', '2025-07-19 17:14:39', 2, 3, '2025-07-18', '2026-03-12'),
	(23, 'K4', 5, 1200.00, '39 jours', 'Terminé', '0', '2025-07-19 17:08:57', '2025-07-19 17:09:06', 2, 4, '2025-07-01', '2025-08-09'),
	(24, 'Construction d\'une hopital', 7, 1000000.00, '107 jours', 'En cours', '1', '2025-07-20 14:01:36', '2026-07-10 14:12:31', 2, 6, '2025-04-10', '2025-07-20');

-- Listage de la structure de table bdprojet. provinces
CREATE TABLE IF NOT EXISTS `provinces` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `nom` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.provinces : ~12 rows (environ)
INSERT INTO `provinces` (`id`, `created_at`, `updated_at`, `nom`, `statut`) VALUES
	(1, '2025-06-28 11:52:05', '2025-07-08 11:53:06', 'Kinshasa', '1'),
	(2, '2025-07-02 09:36:15', '2025-07-09 13:14:47', 'Equateur', '1'),
	(3, '2025-07-02 09:53:10', '2025-07-09 13:13:30', 'Maniema', '1'),
	(4, '2025-07-02 10:05:55', '2025-07-09 13:16:53', 'Sankuru', '1'),
	(5, '2025-07-02 10:30:29', '2025-07-09 13:16:47', 'Kongo Central', '1'),
	(6, '2025-07-02 10:31:00', '2025-07-02 10:31:00', 'Haut Katanga', '1'),
	(7, '2025-07-02 10:31:10', '2025-07-02 10:31:10', 'Lualaba', '1'),
	(9, '2025-07-02 10:34:32', '2025-07-02 10:39:05', 'Tanganyika', '1'),
	(10, '2025-07-02 10:34:55', '2025-07-02 10:34:55', 'Ituri', '1'),
	(11, '2025-07-02 10:35:04', '2025-07-02 10:35:04', 'Tshopo', '1'),
	(12, '2025-07-02 10:35:17', '2025-07-02 10:35:17', 'Haut Uele', '1'),
	(13, '2025-07-08 08:11:31', '2025-07-10 12:21:03', 'Bas Uélé', '1'),
	(15, '2025-07-09 12:50:53', '2025-07-09 12:50:53', 'Kwilu', '0'),
	(16, '2025-07-09 14:04:07', '2025-07-09 14:04:12', 'aaa', '0'),
	(17, '2025-07-20 14:29:00', '2025-07-20 14:29:05', 'rr', '0'),
	(18, '2026-07-16 13:02:21', '2026-07-16 13:02:27', 'mm', '0');

-- Listage de la structure de table bdprojet. sorties
CREATE TABLE IF NOT EXISTS `sorties` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_user` int NOT NULL,
  `id_projet` int NOT NULL,
  `montant_sortie` decimal(15,2) NOT NULL,
  `date_sortie` date NOT NULL,
  `source` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `libelle` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `statut` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.sorties : ~8 rows (environ)
INSERT INTO `sorties` (`id`, `id_user`, `id_projet`, `montant_sortie`, `date_sortie`, `source`, `libelle`, `created_at`, `updated_at`, `statut`) VALUES
	(1, 1, 1, 150.00, '2025-07-19', 'Caisse', 'ok', '2025-07-03 15:03:37', '2025-07-08 13:05:10', '1'),
	(2, 1, 2, 150.00, '2025-07-20', 'Caisse', 'ok', '2025-07-03 15:52:03', '2025-07-08 13:40:10', '1'),
	(3, 1, 2, 100.00, '2025-07-25', 'Caisse', 'ff', '2025-07-03 15:52:58', '2025-07-08 12:58:39', '1'),
	(4, 1, 2, 100.00, '2025-07-18', 'Caisse', 'ok', '2025-07-03 16:02:53', '2025-07-03 16:02:53', '1'),
	(5, 1, 1, 350.00, '2025-07-11', 'Caisse', 'ok', '2025-07-04 09:00:44', '2025-07-04 09:01:13', '1'),
	(6, 1, 1, 50.00, '2025-07-19', 'Caisse', 'Ok', '2025-07-04 09:17:05', '2025-07-08 13:09:10', '1'),
	(7, 1, 1, 200.00, '2025-07-07', 'Caisse', 'ok', '2025-07-07 08:42:38', '2025-07-10 12:22:59', '1'),
	(8, 1, 1, 1000.00, '2025-07-18', 'Banque', 'ok', '2025-07-09 15:15:47', '2025-07-09 15:18:27', '0'),
	(11, 4, 17, 120000.00, '2025-07-16', 'Banque', 'ok', '2025-07-11 07:42:54', '2025-07-11 07:43:11', '1'),
	(12, 2, 12, 500.00, '2025-07-21', 'Banque', 'OK', '2025-07-20 14:32:30', '2026-07-10 18:25:42', '1');

-- Listage de la structure de table bdprojet. users
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.users : ~0 rows (environ)

-- Listage de la structure de table bdprojet. utilisateurs
CREATE TABLE IF NOT EXISTS `utilisateurs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `statut` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `utilisateurs_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bdprojet.utilisateurs : ~2 rows (environ)
INSERT INTO `utilisateurs` (`id`, `nom`, `prenom`, `email`, `password`, `role`, `created_at`, `updated_at`, `statut`) VALUES
	(2, 'NGOY', 'FAMBA', 'pierrpapy@gmail.com', '$2y$10$3zIs85ZzjH5jBeEo4O1xXO0mw1AxmWnG9eebn0zhkXTGD7Hpi4ik2', 'admin', '2025-07-07 10:21:24', '2025-07-07 10:21:24', '1'),
	(4, 'BOLA', 'Patrick', 'bola@gmail.com', '$2y$10$jLyBRCVHunYQMapd5KXiVOAj9BpLKCDTtizTormTpkBg59CMQOxbK', 'user', '2025-07-10 13:05:51', '2026-07-10 14:32:29', '1');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
