CREATE DATABASE  IF NOT EXISTS `hui` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `hui`;
-- MySQL dump 10.13  Distrib 5.6.24, for osx10.8 (x86_64)
--
-- Host: 127.0.0.1    Database: hui
-- ------------------------------------------------------
-- Server version	5.6.21

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
-- Table structure for table `chatcontentlist`
--

DROP TABLE IF EXISTS `chatcontentlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chatcontentlist` (
  `r_index` int(11) NOT NULL,
  `roomID` int(11) NOT NULL,
  `chatTime` varchar(50) NOT NULL,
  `chatMsgList` varchar(20000) NOT NULL DEFAULT '{ }',
  KEY `r_index` (`r_index`),
  KEY `roomID` (`roomID`),
  CONSTRAINT `ChatContentList_ibfk_1` FOREIGN KEY (`r_index`) REFERENCES `roomlist` (`r_index`),
  CONSTRAINT `ChatContentList_ibfk_2` FOREIGN KEY (`roomID`) REFERENCES `roomlist` (`roomID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chatcontentlist`
--

LOCK TABLES `chatcontentlist` WRITE;
/*!40000 ALTER TABLE `chatcontentlist` DISABLE KEYS */;
/*!40000 ALTER TABLE `chatcontentlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chatlist`
--

DROP TABLE IF EXISTS `chatlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chatlist` (
  `m_index` int(11) NOT NULL,
  `roomID` varchar(500) NOT NULL,
  `chatList` varchar(20000) NOT NULL DEFAULT '{ }',
  PRIMARY KEY (`m_index`),
  UNIQUE KEY `roomID` (`roomID`),
  CONSTRAINT `ChatList_ibfk_1` FOREIGN KEY (`m_index`) REFERENCES `memberinfo` (`m_index`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chatlist`
--

LOCK TABLES `chatlist` WRITE;
/*!40000 ALTER TABLE `chatlist` DISABLE KEYS */;
/*!40000 ALTER TABLE `chatlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `friendlist`
--

DROP TABLE IF EXISTS `friendlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `friendlist` (
  `m_index` int(11) NOT NULL,
  `memID` varchar(255) NOT NULL,
  `fList` varchar(20000) NOT NULL DEFAULT '{number: 0, list: { } }',
  PRIMARY KEY (`m_index`),
  UNIQUE KEY `memID` (`memID`),
  CONSTRAINT `FriendList_ibfk_1` FOREIGN KEY (`m_index`) REFERENCES `memberinfo` (`m_index`),
  CONSTRAINT `FriendList_ibfk_2` FOREIGN KEY (`memID`) REFERENCES `memberinfo` (`memID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friendlist`
--

LOCK TABLES `friendlist` WRITE;
/*!40000 ALTER TABLE `friendlist` DISABLE KEYS */;
INSERT INTO `friendlist` VALUES (24,'jeta','{number: 0, list: { } }'),(26,'test','{number: 0, list: { } }');
/*!40000 ALTER TABLE `friendlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `memberinfo`
--

DROP TABLE IF EXISTS `memberinfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `memberinfo` (
  `m_index` int(11) NOT NULL AUTO_INCREMENT,
  `memID` varchar(255) NOT NULL,
  `memPW` varchar(500) NOT NULL,
  `nickname` varchar(20) NOT NULL,
  `photo` varchar(20000) DEFAULT NULL,
  `personalSetting` varchar(300) NOT NULL DEFAULT '{ }',
  `r_indexList` varchar(500) DEFAULT '"{num: 0}"',
  PRIMARY KEY (`m_index`),
  UNIQUE KEY `memID` (`memID`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `memberinfo`
--

LOCK TABLES `memberinfo` WRITE;
/*!40000 ALTER TABLE `memberinfo` DISABLE KEYS */;
INSERT INTO `memberinfo` VALUES (24,'jeta','160efd3faadf4ec245d6313806e03deb335d2fde71ae93b2d89e54e9f1ac9025','jETA','null','{\"Alert\":{\"DesktopAlert\":true,\"MessagePreview\":false,\"AlertWithSound\":true},\"General\":{\"SendType\":0}}','\"{num: 0}\"'),(26,'test','293899b2e2eb8889e42fa0d13050f7b6df45d24f32d7acf36b9506a1517771ad','test','null','{\"Alert\":{\"DesktopAlert\":true,\"MessagePreview\":false,\"AlertWithSound\":true},\"General\":{\"SendType\":0}}','\"{num: 0}\"');
/*!40000 ALTER TABLE `memberinfo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roomlist`
--

DROP TABLE IF EXISTS `roomlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roomlist` (
  `r_index` int(11) NOT NULL AUTO_INCREMENT,
  `roomID` int(11) NOT NULL,
  `joinedMem` varchar(2000) NOT NULL DEFAULT '{ }',
  `roomName` varchar(100) NOT NULL,
  PRIMARY KEY (`r_index`),
  UNIQUE KEY `roomID` (`roomID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roomlist`
--

LOCK TABLES `roomlist` WRITE;
/*!40000 ALTER TABLE `roomlist` DISABLE KEYS */;
/*!40000 ALTER TABLE `roomlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userparticipatelist`
--

DROP TABLE IF EXISTS `userparticipatelist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `userparticipatelist` (
  `m_index` int(11) NOT NULL,
  `userID` varchar(50) NOT NULL,
  `participateList` varchar(20000) NOT NULL DEFAULT '{ }',
  PRIMARY KEY (`m_index`),
  CONSTRAINT `UserParticipateList_ibfk_1` FOREIGN KEY (`m_index`) REFERENCES `memberinfo` (`m_index`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userparticipatelist`
--

LOCK TABLES `userparticipatelist` WRITE;
/*!40000 ALTER TABLE `userparticipatelist` DISABLE KEYS */;
/*!40000 ALTER TABLE `userparticipatelist` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2015-10-05 23:19:24
