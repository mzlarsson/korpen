-- MySQL dump 10.13  Distrib 5.7.28, for Linux (x86_64)
--
-- Host: localhost    Database: korpen
-- ------------------------------------------------------
-- Server version	5.7.28-0ubuntu0.18.04.4

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `comment`
--

DROP TABLE IF EXISTS `comment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `comment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `game_id` int(11) DEFAULT NULL,
  `video_id` int(11) NOT NULL,
  `timestamp` int(11) NOT NULL,
  `comment` varchar(1024) NOT NULL,
  `created_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `game`
--

DROP TABLE IF EXISTS `game`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `game` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `playdate` datetime NOT NULL,
  `location` varchar(128) DEFAULT NULL,
  `teamhome_id` int(11) NOT NULL,
  `teamaway_id` int(11) NOT NULL,
  `teamhome_score` int(11) DEFAULT NULL,
  `teamaway_score` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_game` (`teamhome_id`,`teamaway_id`)
) ENGINE=InnoDB AUTO_INCREMENT=271 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary table structure for view `game_bidirectional`
--

DROP TABLE IF EXISTS `game_bidirectional`;
/*!50001 DROP VIEW IF EXISTS `game_bidirectional`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `game_bidirectional` AS SELECT 
 1 AS `team_id`,
 1 AS `opponent_id`,
 1 AS `team_score`,
 1 AS `opponent_score`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `goal`
--

DROP TABLE IF EXISTS `goal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `goal` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `game_id` int(11) DEFAULT NULL,
  `video_id` int(11) NOT NULL,
  `timestamp` int(11) NOT NULL,
  `teamhome_goals` smallint(6) NOT NULL,
  `teamaway_goals` smallint(6) NOT NULL,
  `scorer_team_id` int(11) DEFAULT NULL,
  `goal_player_id` int(11) NOT NULL,
  `assist_player_id` int(11) NOT NULL,
  `created_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `participation`
--

DROP TABLE IF EXISTS `participation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `participation` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `game_id` int(11) NOT NULL,
  `player_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `OneTimePerGame` (`game_id`,`player_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `permission`
--

DROP TABLE IF EXISTS `permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permission` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `property` varchar(64) NOT NULL,
  `access` smallint(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `player`
--

DROP TABLE IF EXISTS `player`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `player` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `team_id` int(11) NOT NULL,
  `pagename` varchar(128) DEFAULT NULL,
  `name` varchar(128) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary table structure for view `playerscore`
--

DROP TABLE IF EXISTS `playerscore`;
/*!50001 DROP VIEW IF EXISTS `playerscore`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `playerscore` AS SELECT 
 1 AS `team_id`,
 1 AS `pagename`,
 1 AS `name`,
 1 AS `games`,
 1 AS `goals`,
 1 AS `assists`,
 1 AS `points`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `series`
--

DROP TABLE IF EXISTS `series`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `series` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pagename` varchar(128) DEFAULT NULL,
  `name` varchar(128) NOT NULL,
  `year` smallint(6) NOT NULL,
  `homepage` varchar(256) DEFAULT NULL,
  `last_fetched_page` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_pagenames` (`pagename`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary table structure for view `standings`
--

DROP TABLE IF EXISTS `standings`;
/*!50001 DROP VIEW IF EXISTS `standings`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `standings` AS SELECT 
 1 AS `series_id`,
 1 AS `team_id`,
 1 AS `name`,
 1 AS `games`,
 1 AS `wins`,
 1 AS `eq`,
 1 AS `losses`,
 1 AS `goals`,
 1 AS `antigoals`,
 1 AS `diff`,
 1 AS `points`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `team`
--

DROP TABLE IF EXISTS `team`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `team` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `series_id` int(11) NOT NULL,
  `pagename` varchar(128) DEFAULT NULL,
  `name` varchar(128) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_pagenames` (`pagename`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mail` varchar(200) NOT NULL,
  `realname` varchar(100) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `hash` varchar(100) NOT NULL,
  `hash_valid_until` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `video`
--

DROP TABLE IF EXISTS `video`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `video` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `game_id` int(11) NOT NULL,
  `video_index` tinyint(4) NOT NULL,
  `name` varchar(100) NOT NULL,
  `offset` int(11) NOT NULL,
  `created_by` int(11) NOT NULL,
  `platform` varchar(100) NOT NULL,
  `link` varchar(400) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Final view structure for view `game_bidirectional`
--

/*!50001 DROP VIEW IF EXISTS `game_bidirectional`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`korpen`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `game_bidirectional` AS select `G1`.`teamhome_id` AS `team_id`,`G1`.`teamaway_id` AS `opponent_id`,`G1`.`teamhome_score` AS `team_score`,`G1`.`teamaway_score` AS `opponent_score` from `game` `G1` union all select `G2`.`teamaway_id` AS `team_id`,`G2`.`teamhome_id` AS `opponent_id`,`G2`.`teamaway_score` AS `team_score`,`G2`.`teamhome_score` AS `opponent_score` from `game` `G2` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `playerscore`
--

/*!50001 DROP VIEW IF EXISTS `playerscore`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`korpen`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `playerscore` AS (select min(`T`.`team_id`) AS `team_id`,`T`.`pagename` AS `pagename`,min(`T`.`name`) AS `name`,count(`PA`.`id`) AS `games`,min(`T`.`goals`) AS `goals`,min(`T`.`assists`) AS `assists`,(min(`T`.`goals`) + min(`T`.`assists`)) AS `points` from (((select `P`.`id` AS `player_id`,`P`.`team_id` AS `team_id`,`P`.`pagename` AS `pagename`,`P`.`name` AS `name`,coalesce(sum(if((`G`.`type` = 'goal'),1,0)),0) AS `goals`,coalesce(sum(if((`G`.`type` = 'assist'),1,0)),0) AS `assists` from (`korpen`.`player` `P` left join (select 'goal' AS `type`,`korpen`.`goal`.`goal_player_id` AS `player_id`,`korpen`.`goal`.`game_id` AS `game_id` from `korpen`.`goal` union all select 'assist' AS `type`,`korpen`.`goal`.`assist_player_id` AS `player_id`,`korpen`.`goal`.`game_id` AS `game_id` from `korpen`.`goal`) `G` on((`G`.`player_id` = `P`.`id`))) group by `P`.`id`)) `T` left join `korpen`.`participation` `PA` on((`PA`.`player_id` = `T`.`player_id`))) group by `T`.`pagename`) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `standings`
--

/*!50001 DROP VIEW IF EXISTS `standings`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`korpen`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `standings` AS (select `Q`.`series_id` AS `series_id`,`Q`.`team_id` AS `team_id`,`Q`.`name` AS `name`,`Q`.`games` AS `games`,`Q`.`wins` AS `wins`,`Q`.`eq` AS `eq`,`Q`.`losses` AS `losses`,`Q`.`goals` AS `goals`,`Q`.`antigoals` AS `antigoals`,(`Q`.`goals` - `Q`.`antigoals`) AS `diff`,((`Q`.`wins` * 3) + `Q`.`eq`) AS `points` from (select `S`.`id` AS `series_id`,`T`.`id` AS `team_id`,`T`.`name` AS `name`,sum(if((`G`.`team_id` = `T`.`id`),1,0)) AS `games`,sum(if(((`G`.`team_id` = `T`.`id`) and (`G`.`team_score` > `G`.`opponent_score`)),1,0)) AS `wins`,sum(if(((`G`.`team_id` = `T`.`id`) and (`G`.`team_score` = `G`.`opponent_score`)),1,0)) AS `eq`,sum(if(((`G`.`team_id` = `T`.`id`) and (`G`.`team_score` < `G`.`opponent_score`)),1,0)) AS `losses`,coalesce(sum(if((`G`.`team_id` = `T`.`id`),`G`.`team_score`,0)),0) AS `goals`,coalesce(sum(if((`G`.`team_id` = `T`.`id`),`G`.`opponent_score`,0)),0) AS `antigoals` from ((`korpen`.`team` `T` left join `korpen`.`series` `S` on((`S`.`id` = `T`.`series_id`))) left join `korpen`.`game_bidirectional` `G` on(((`G`.`team_id` = `T`.`id`) and (`G`.`team_score` is not null)))) group by `T`.`id`) `Q`) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-01-25 23:28:29
