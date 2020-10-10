
const db = require('./db');
db.connect_with_defaults();

const remote_syncer = require('./remote_syncer');

const cron = require('node-cron');
cron.schedule('*/5 * * * *', remote_syncer.updateData);

const PERMISSION_ADD = 4;
const PERMISSION_UPDATE = 2;
const PERMISSION_REMOVE = 1;

exports.getBaseData = function(){
    return getAllSeries({});
}

exports.getSeriesData = function(seriesName){

    var info = {};
    info["seriesName"] = seriesName;

    return getAllSeries(info).then(getStandings).then(getUpcomingGames).then(getLatestGames).then(getPlayedGames).then(function(result){
        // Finish up
        if (result["standings"].length == 0){
            result["error"] = "Kunde inte hitta den sökta serien";
        } else{
            result["seriesDisplayName"] = result["standings"][0].series_name + " (" + result["standings"][0].year + ")";
        }
        return result;
    });
};

exports.getTeamData = function(seriesName, teamName){
    
    var info = {};
    info["seriesName"] = seriesName;
    info["teamName"] = teamName;
    
    return getAllSeries(info).then(getStandings).then(getUpcomingGames).then(getPreviousGames).then(function(result){
        // Finish up
        if (result["standings"].length == 0){
            result["error"] = "Kunde inte hitta den sökta serien";
        } else{
            result["seriesDisplayName"] = result["standings"][0].series_name + " (" + result["standings"][0].year + ")";
        }
        return result;
    });

};

exports.getPlayerData = function(seriesName, teamName, playerName){
    
    var info = {};
    info["seriesName"] = seriesName;
    info["teamName"] = teamName;
    info["playerName"] = playerName;
    
    return getAllSeries(info).then(getStandings).then(getPlayerInfo).then(getPlayerHighlights).then(getPlayerParticipation).then(function(result){
        // Finish up
        if (result["standings"].length == 0){
            result["error"] = "Kunde inte hitta den sökta serien";
        } else if (!result["player"]){
            result["error"] = "Spelaren du angav kunde inte hittas";
        } else{
            result["seriesDisplayName"] = result["standings"][0].series_name + " (" + result["standings"][0].year + ")";
            result["yt_api"] = true;
        }
        return result;
    });

};

exports.getWatchData = function(seriesName, teamName, gameId){
    
    var info = {};
    info["seriesName"] = seriesName;
    info["teamName"] = teamName;
    info["gameId"] = gameId;
    
    return getAllSeries(info).then(getStandings).then(getVideoInfoForGame).then(getVideoHighlights).then(function(result){
        // Finish up
        if (result["standings"].length == 0){
            result["error"] = "Kunde inte hitta den sökta serien";
        } else{
            result["seriesDisplayName"] = result["standings"][0].series_name + " (" + result["standings"][0].year + ")";
        }
        
        if (!gameId){
            result["error"] = "Ingen video angiven, försök igen.";
        } else if (result["videoinfo"].length == 0){
            result["error"] = "Videon kunde inte hittas. Försök igen.";
        } else {
            result["yt_api"] = true;
        }
        
        return result;
    });
};

exports.getPlayerScoreData = function(seriesName, teamName){

    var info = {};
    info["seriesName"] = seriesName;
    info["teamName"] = teamName;
    
    return getAllSeries(info).then(getStandings).then(getPlayerScores).then(function(result){
        // Finish up
        if (result["standings"].length == 0){
            result["error"] = "Kunde inte hitta den sökta serien";
        } else{
            result["seriesDisplayName"] = result["standings"][0].series_name + " (" + result["standings"][0].year + ")";
        }
        
        return result;
    });
};

exports.getAddVideoData = function(seriesName, teamName, gameId){

    var info = {};
    info["seriesName"] = seriesName;
    info["teamName"] = teamName;
    info["gameId"] = gameId;
    
    return getAllSeries(info).then(getStandings).then(getGamesAvailableForVideo).then(function(result){
        
        if (!info["gameId"]){
            info["gameId"] = info["videogames"].length > 0 ? info["videogames"][0]["game_id"] : -1;
        }
        return info;
        
    }).then(getVideoFromGame).then(getVideoHighlights).then(getPlayersInGame).then(getTeamsInGame).then(getAvailableVideoServices).then(function(result){
        // Finish up
        if (result["standings"].length == 0){
            result["error"] = "Kunde inte hitta den sökta serien";
        } else{
            result["seriesDisplayName"] = result["standings"][0].series_name + " (" + result["standings"][0].year + ")";
        }
        
        // Always have at least one entry in videos
        if (info["videos"].length == 0){
            info["videos"] = [{}];
        }
        
        // Load YT Iframe API
        result["yt_api"] = true;
        
        return result;
    });
};

exports.getEditEventsData = function(seriesName, teamName, gameId){
    
    return exports.getAddVideoData(seriesName, teamName, gameId);
    
}

exports.getVideos = function(gameId){
    
    var info = {};
    info["gameId"] = gameId;
    
    return getVideoFromGame(info).then(function(result){
        
        // Cleanup
        return result;
    });
};

exports.getPlayers = function(teamName){
    
    var info = {};
    info["teamName"] = teamName;
    
    return getPlayersFromTeam(info);
}

exports.updateOrAddVideo = function(authKey, gameId, videoId, videoIndex, name, offset, service, link){
    
    var info = {};
    info["gameId"] = gameId;
    info["videoId"] = videoId;
    info["newData"] = {"gameId": gameId, "videoId": videoId, "videoIndex": videoIndex,
                       "name": name, "offset": offset, "service": service, "link": link, "userHash": authKey};
    
    return getVideoInfo(info).then(getGameInfo).then(function(result){
        // Setup verification
        result["verification"] = {
            "auth": authKey,
            "action": result["video"] ? PERMISSION_UPDATE : PERMISSION_ADD,
            "property": "videos",
            "team1": result["game"] ? result["game"]["teamhome_id"] : -1,
            "team2": result["game"] ? result["game"]["teamaway_id"] : -1
        };
        return result;
    }).then(verifyPermissions).then(updateOrAddVideo).then(function(result){
        // TODO: Reformat before sending to user.
        return result["query_result"];
    });
    
};

exports.updateOrAddGoal = function(authKey, eventId, gameId, videoId, timestamp, t1Goals, t2Goals, scorerTeamId, scorerId, assistId){
    
    var info = {};
    info["gameId"] = gameId;
    info["eventId"] = eventId;
    info["teamId"] = scorerTeamId;
    info["newData"] = {"eventId": eventId, "gameId": gameId, "videoId": videoId, "timestamp": timestamp,
                       "t1Goals": t1Goals, "t2Goals": t2Goals, "scorerTeamId": scorerTeamId, "scorerId": scorerId, "assistId": assistId, "userHash": authKey};
    
    return getGoalInfo(info).then(getGameInfo).then(function(result){
        // Setup verification
        result["verification"] = {
            "auth": authKey,
            "action": result["goal"] ? PERMISSION_UPDATE : PERMISSION_ADD,
            "property": "events",
            "team1": result["game"] ? result["game"]["teamhome_id"] : -1,
            "team2": result["game"] ? result["game"]["teamaway_id"] : -1
        };
        return result;
    }).then(verifyPermissions).then(verifyTeamCorrectness).then(updateOrAddGoal).then(function(result){
        // TODO: Reformat before sending to user.
        return result["query_result"];
    });
};

exports.updateOrAddComment = function(authKey, eventId, gameId, videoId, timestamp, comment){
    
    var info = {};
    info["gameId"] = gameId;
    info["eventId"] = eventId;
    info["newData"] = {"eventId": eventId, "gameId": gameId, "videoId": videoId, "timestamp": timestamp, "comment": comment, "userHash": authKey};
    
    return getCommentInfo(info).then(getGameInfo).then(function(result){
        // Setup verification
        result["verification"] = {
            "auth": authKey,
            "action": result["comment"] ? PERMISSION_UPDATE : PERMISSION_ADD,
            "property": "events",
            "team1": result["game"] ? result["game"]["teamhome_id"] : -1,
            "team2": result["game"] ? result["game"]["teamaway_id"] : -1
        };
        return result;
    }).then(verifyPermissions).then(updateOrAddComment).then(function(result){
        // TODO: Reformat before sending to user.
        return result["query_result"];
    });
};

exports.addParticipation = function(authKey, gameId, playerId){
    
    var info = {};
    info["gameId"] = gameId;
    info["playerId"] = playerId;
    
    return getGameInfo(info).then(function(result){
        // Setup verification
        result["verification"] = {
            "auth": authKey,
            "action": PERMISSION_ADD,
            "property": "participation",
            "team1": result["game"] ? result["game"]["teamhome_id"] : -1,
            "team2": result["game"] ? result["game"]["teamaway_id"] : -1
        };
        return result;
    }).then(verifyPermissions).then(addParticipation).then(function(result){
        // TODO: Reformat before sending to user.
        return result["query_result"];
    });
};


exports.removeGoal = function(authKey, eventId){
    
    var info = {};
    info["eventId"] = eventId;
    
    return getGoalInfo(info).then(function(result){
        info["gameId"] = info["goal"] ? info["goal"]["game_id"] : -1;
        return info;
    }).then(getGameInfo).then(function(result){
        // Setup verification
        result["verification"] = {
            "auth": authKey,
            "action": PERMISSION_REMOVE,
            "property": "events",
            "team1": result["game"] ? result["game"]["teamhome_id"] : -1,
            "team2": result["game"] ? result["game"]["teamaway_id"] : -1
        };
        return result;
    }).then(verifyPermissions).then(removeGoal).then(function(result){
        // TODO: Reformat before sending to user.
        return result["query_result"];
    });
};

exports.removeComment = function(authKey, eventId){
    
    var info = {};
    info["eventId"] = eventId;
    
    return getCommentInfo(info).then(function(result){
        info["gameId"] = info["comment"] ? info["comment"]["game_id"] : -1;
        return info;
    }).then(getGameInfo).then(function(result){
        // Setup verification
        result["verification"] = {
            "auth": authKey,
            "action": PERMISSION_REMOVE,
            "property": "events",
            "team1": result["game"] ? result["game"]["teamhome_id"] : -1,
            "team2": result["game"] ? result["game"]["teamaway_id"] : -1
        };
        return result;
    }).then(verifyPermissions).then(removeComment).then(function(result){
        // TODO: Reformat before sending to user.
        return result["query_result"];
    });
};

exports.removeParticipation = function(authKey, gameId, playerId){
    
    var info = {};
    info["gameId"] = gameId;
    info["playerId"] = playerId;
    
    return getGameInfo(info).then(function(result){
        // Setup verification
        result["verification"] = {
            "auth": authKey,
            "action": PERMISSION_REMOVE,
            "property": "participation",
            "team1": result["game"] ? result["game"]["teamhome_id"] : -1,
            "team2": result["game"] ? result["game"]["teamaway_id"] : -1
        };
        return result;
    }).then(verifyPermissions).then(removeParticipation).then(function(result){
        // TODO: Reformat before sending to user.
        return result["query_result"];
    });
};



function getAllSeries(info){
    
    return new Promise((resolve, reject) => {
        db.query("SELECT name, year, pagename FROM series ORDER BY year DESC", [], function(result){
            info["series"] = JSON.parse(JSON.stringify(result));
            resolve(info);
        });
    });
}

function getStandings(info){
    
    return new Promise((resolve, reject) => {
        
        const query = "SELECT S.name AS series_name, S.year AS year, T.pagename AS pagename, ST.name AS name, games, wins, eq, losses, goals, antigoals, diff, points \
                       FROM standings ST \
                       LEFT JOIN series S ON S.id = ST.series_id \
                       LEFT JOIN team T ON T.id = ST.team_id \
                       WHERE S.pagename = ? \
                       ORDER BY points DESC, diff DESC";
        
        db.query(query, [info["seriesName"]], function(result){
            info["standings"] = JSON.parse(JSON.stringify(result));
            resolve(info);
        });
    });
}

function getUpcomingGames(info){
    
    return new Promise((resolve, reject) => {
        
        var data = [info["seriesName"]];
        var extraSelectionParams = "";
        if (info["teamName"]){
            data = [info["seriesName"], info["teamName"], info["teamName"]];
            extraSelectionParams = "AND (T1.pagename = ? OR T2.pagename = ?) ";
        } else{
            extraSelectionParams = "AND (G.playdate < NOW() + INTERVAL 7 DAY) "; 
        }
        
        const query = "SELECT T1.name AS t1_name, T1.pagename AS t1_pagename, T2.name AS t2_name, T2.pagename AS t2_pagename, \
                              G.teamhome_score AS t1_score, G.teamaway_score AS t2_score, G2.teamhome_score AS t2_score_prev, G2.teamaway_score AS t1_score_prev, \
                              G.playdate AS playdate, G.location AS location, G.playdate < NOW() as started \
                       FROM game G \
                       LEFT JOIN team T1 ON T1.id = G.teamhome_id \
                       LEFT JOIN team T2 ON T2.id = G.teamaway_id \
                       LEFT JOIN series S ON S.id = T1.series_id \
                       LEFT JOIN game G2 ON G2.teamhome_id = G.teamaway_id AND G2.teamaway_id = G.teamhome_id \
                       WHERE S.pagename = ? AND (G.playdate > NOW() - INTERVAL 1 HOUR) " + extraSelectionParams + " \
                       ORDER BY playdate ASC";
        
        db.query(query, data, function(result){
            info["upcoming"] = JSON.parse(JSON.stringify(result));
            resolve(info);
        });
    });
}

function getLatestGames(info){
    
    return new Promise((resolve, reject) => {
        
        var data = [info["seriesName"]];
        var filterOnTeam = "";
        if (info["teamName"]){
            data = [info["seriesName"], info["teamName"], info["teamName"]];
            filterOnTeam = "AND (T1.pagename = ? OR T2.pagename = ?) ";
        }
        
        const query = "SELECT T1.name AS t1_name, T1.pagename AS t1_pagename, T2.name AS t2_name, T2.pagename AS t2_pagename, \
                              G.id AS game_id, G.teamhome_score AS t1_score, G.teamaway_score AS t2_score, G2.teamhome_score AS t2_score_prev, G2.teamaway_score AS t1_score_prev, \
                              G.playdate AS playdate, G.location AS location, \
                              V.platform AS video_platform, V.link AS video_link \
                       FROM game G \
                       LEFT JOIN team T1 ON T1.id = G.teamhome_id \
                       LEFT JOIN team T2 ON T2.id = G.teamaway_id \
                       LEFT JOIN series S ON S.id = T1.series_id \
                       LEFT JOIN game G2 ON G2.teamhome_id = G.teamaway_id AND G2.teamaway_id = G.teamhome_id AND G2.playdate < G.playdate \
                       LEFT JOIN (SELECT game_id, MIN(platform) AS platform, MIN(link) AS link FROM video V2 GROUP BY V2.game_id) V ON V.game_id = G.id \
                       WHERE S.pagename = ? AND (G.playdate < NOW() - INTERVAL 1 HOUR) AND (G.playdate > NOW() - INTERVAL 7 DAY) " + filterOnTeam + "\
                       ORDER BY G.playdate DESC, G.location ASC";
        
        db.query(query, data, function(result){
            info["latestgames"] = JSON.parse(JSON.stringify(result));
            resolve(info);
        });
    });
}

function getPreviousGames(info){
    
    return new Promise((resolve, reject) => {
        
        var data = [info["seriesName"]];
        var filterOnTeam = "";
        if (info["teamName"]){
            data = [info["seriesName"], info["teamName"], info["teamName"]];
            filterOnTeam = "AND (T1.pagename = ? OR T2.pagename = ?) ";
        }
        
        const query = "SELECT T1.name AS t1_name, T1.pagename AS t1_pagename, T2.name AS t2_name, T2.pagename AS t2_pagename, \
                              G.id AS game_id, G.teamhome_score AS t1_score, G.teamaway_score AS t2_score, G2.teamhome_score AS t2_score_prev, G2.teamaway_score AS t1_score_prev, \
                              G.playdate AS playdate, G.location AS location, V.platform AS video_platform, V.link AS video_link \
                       FROM game G \
                       LEFT JOIN team T1 ON T1.id = G.teamhome_id \
                       LEFT JOIN team T2 ON T2.id = G.teamaway_id \
                       LEFT JOIN series S ON S.id = T1.series_id \
                       LEFT JOIN game G2 ON G2.teamhome_id = G.teamaway_id AND G2.teamaway_id = G.teamhome_id AND G2.playdate < G.playdate \
                       LEFT JOIN (SELECT game_id, MIN(platform) AS platform, MIN(link) AS link FROM video V2 GROUP BY V2.game_id) V ON V.game_id = G.id \
                       WHERE S.pagename = ? AND (G.playdate < NOW() - INTERVAL 1 HOUR) " + filterOnTeam + " \
                       ORDER BY G.playdate DESC";
        
        db.query(query, data, function(result){
            info["previousgames"] = JSON.parse(JSON.stringify(result));
            resolve(info);
        });
    });
}

function getPlayedGames(info){
    
    return new Promise((resolve, reject) => {
        
        const query = "SELECT T1.name AS t1_name, T1.pagename AS t1_pagename, T2.name AS t2_name, T2.pagename AS t2_pagename, \
                              G.id AS game_id, G.teamhome_score AS t1_score, G.teamaway_score AS t2_score, G.playdate AS playdate, G.location AS location, \
                              V.platform AS video_platform, V.link AS video_link \
                       FROM game G \
                       LEFT JOIN team T1 ON T1.id = G.teamhome_id \
                       LEFT JOIN team T2 ON T2.id = G.teamaway_id \
                       LEFT JOIN series S ON S.id = T1.series_id \
                       LEFT JOIN (SELECT game_id, MIN(platform) AS platform, MIN(link) AS link FROM video V2 GROUP BY V2.game_id) V ON V.game_id = G.id \
                       WHERE S.pagename = ? AND G.teamhome_score IS NOT NULL \
                       ORDER BY playdate DESC";
        
        db.query(query, [info["seriesName"]], function(result){
            info["playedgames"] = JSON.parse(JSON.stringify(result));
            resolve(info);
        });
    });
}

function getVideoInfoForGame(info){
    
    return new Promise((resolve, reject) => {
        
        const query = "SELECT V.name AS camera_name, V.offset AS offset, U.username AS created_by, V.platform AS platform, V.link AS link \
                       FROM video V \
                       LEFT JOIN user U ON U.id = V.created_by \
                       WHERE V.game_id = ? \
                       ORDER BY video_index ASC";
        
        db.query(query, [info["gameId"]], function(result){
            info["videoinfo"] = JSON.parse(JSON.stringify(result));
            resolve(info);
        });
    });
}

function getVideoHighlights(info){
    
    return new Promise((resolve, reject) => {
        
        const query_goals = "SELECT 'goal' AS type, G.id AS event_id, G.timestamp-V.offset AS refTime, V.video_index AS video_index, G.timestamp AS timestamp, G.teamhome_goals AS t1_goals, G.teamaway_goals AS t2_goals, \
                                    P1.pagename AS scorer_pagename, P1.name AS scorer_name, P1.id AS scorer_id, P2.pagename AS assist_pagename, P2.name AS assist_name, P2.id AS assist_id, \
                                    T.name AS team_name, T.pagename AS team_pagename, T.id AS team_id, NULL AS comment \
                             FROM goal G \
                             LEFT JOIN player P1 ON P1.id = G.goal_player_id \
                             LEFT JOIN player P2 ON P2.id = G.assist_player_id \
                             LEFT JOIN team T ON T.id = G.scorer_team_id \
                             LEFT JOIN video V ON V.id = G.video_id \
                             WHERE G.game_id = ?";
                             
        const query_comments = "SELECT 'comment' AS type, C.id AS event_id, C.timestamp-V.offset AS refTime, V.video_index AS video_index, C.timestamp AS timestamp, \
                                       NULL AS t1_goals, NULL AS t2_goals, NULL AS scorer_pagename, NULL AS scorer_name, NULL AS scorer_id, \
                                       NULL AS assist_pagename, NULL AS assist_name, NULL AS assist_id, NULL AS team_name, NULL AS team_pagename, NULL AS team_id, \
                                       C.comment AS comment \
                                FROM comment C \
                                LEFT JOIN video V ON V.id = C.video_id \
                                WHERE C.game_id = ?";
                                
        const query = "SELECT * FROM (" + query_goals + " UNION " + query_comments + ") U ORDER BY refTime";
                                
        
        db.query(query, [info["gameId"], info["gameId"]], function(result){
            info["events"] = JSON.parse(JSON.stringify(result));
            resolve(info);
        });
    });
}

function getPlayerScores(info){
    
    return new Promise((resolve, reject) => {
        
        const query = "(SELECT 1 as prio, PS.pagename AS pagename, PS.name AS name, PS.games AS games, PS.goals AS goals, PS.assists AS assists, PS.points AS points \
                       FROM playerscore PS \
                       LEFT JOIN team T ON T.id = PS.team_id \
                       WHERE T.pagename = ? AND PS.games > 0) \
                       UNION \
                       (SELECT 0 as prio, PS.pagename AS pagename, PS.name AS name, PS.games AS games, PS.goals AS goals, PS.assists AS assists, PS.points AS points \
                       FROM playerscore PS \
                       LEFT JOIN team T ON T.id = PS.team_id \
                       WHERE T.pagename = ? AND PS.games = 0) \
                       ORDER BY prio DESC, points DESC, games ASC, goals DESC";
        
        db.query(query, [info["teamName"], info["teamName"]], function(result){
            info["playerscores"] = JSON.parse(JSON.stringify(result));
            resolve(info);
        });
    });
}

function getGamesAvailableForVideo(info){
    
    return new Promise((resolve, reject) => {

        const query = "SELECT T1.name AS t1_name, T1.pagename AS t1_pagename, T2.name AS t2_name, T2.pagename AS t2_pagename, \
                              G.id AS game_id, G.teamhome_score AS t1_score, G.teamaway_score AS t2_score, \
                              G.playdate AS playdate, G.location AS location \
                       FROM game G \
                       LEFT JOIN team T1 ON T1.id = G.teamhome_id \
                       LEFT JOIN team T2 ON T2.id = G.teamaway_id \
                       LEFT JOIN series S ON S.id = T1.series_id \
                       WHERE S.pagename = ? AND G.playdate < NOW() AND (T1.pagename = ? OR T2.pagename = ?)  \
                       ORDER BY G.playdate DESC";
        
        db.query(query, [info["seriesName"], info["teamName"], info["teamName"]], function(result){
            info["videogames"] = JSON.parse(JSON.stringify(result));
            resolve(info);
        });
    });
}

function getVideoFromGame(info){
    
    return new Promise((resolve, reject) => {
        
        const query = "SELECT id, game_id, video_index, name, offset, platform, link FROM video WHERE game_id = ? ORDER BY video_index";
        
        db.query(query, [info["gameId"]], function(result){
            info["videos"] = JSON.parse(JSON.stringify(result));
            resolve(info);
        });
    });
}

function getAvailableVideoServices(info){
    
    return new Promise((resolve, reject) => {
        
        info["services"] = [{"name": "youtube", "pretty_name": "Youtube"}];
        resolve(info);
    });
}

function getVideoInfo(info){

    return new Promise((resolve, reject) => {
        
        if (info["videoId"]){
            const query = "SELECT * FROM video WHERE id = ? LIMIT 1";

            db.query(query, [info["videoId"]], function(result){
                info["video"] = result.length > 0 ? JSON.parse(JSON.stringify(result[0])) : undefined;
                resolve(info);
            });
        } else {
            resolve(info);
        }
    });
}

function getGameInfo(info){
    
    return new Promise((resolve, reject) => {
        
        if (info["gameId"]){
            const query = "SELECT * FROM game WHERE id = ? LIMIT 1";

            db.query(query, [info["gameId"]], function(result){
                info["game"] = result.length > 0 ? JSON.parse(JSON.stringify(result[0])) : undefined;
                resolve(info);
            });
        } else {
            resolve(info);
        }
    });
}

function getGoalInfo(info){
    
    return new Promise((resolve, reject) => {
        
        if (info["eventId"]){
            const query = "SELECT * FROM goal WHERE id = ? LIMIT 1";

            db.query(query, [info["eventId"]], function(result){
                info["goal"] = result.length > 0 ? JSON.parse(JSON.stringify(result[0])) : undefined;
                resolve(info);
            });
        } else {
            resolve(info);
        }
    });
}

function getPlayerInfo(info){
    
    return new Promise((resolve, reject) => {
        
        if (info["playerName"]){
            const query = "SELECT * FROM player WHERE pagename = ? LIMIT 1";

            db.query(query, [info["playerName"]], function(result){
                info["player"] = result.length > 0 ? JSON.parse(JSON.stringify(result[0])) : undefined;
                resolve(info);
            });
        } else {
            resolve(info);
        }
    });
}

function getCommentInfo(info){
    
    return new Promise((resolve, reject) => {
        
        if (info["eventId"]){
            const query = "SELECT * FROM comment WHERE id = ? LIMIT 1";

            db.query(query, [info["eventId"]], function(result){
                info["comment"] = result.length > 0 ? JSON.parse(JSON.stringify(result[0])) : undefined;
                resolve(info);
            });
        } else {
            resolve(info);
        }
    });
}

function getTeamsInGame(info){
    
    return new Promise((resolve, reject) => {
        
        const query = "SELECT T1.id AS t1_id, T1.name AS t1_name, T1.pagename AS t1_pagename, \
                              T2.id AS t2_id, T2.name AS t2_name, T2.pagename AS t2_pagename \
                       FROM game G \
                       LEFT JOIN team T1 ON T1.id = G.teamhome_id \
                       LEFT JOIN team T2 ON T2.id = G.teamaway_id \
                       WHERE G.id = ? LIMIT 1";

        db.query(query, [info["gameId"]], function(result){
            info["teams"] = result.length > 0 ? JSON.parse(JSON.stringify(result[0])) : undefined;
            resolve(info);
        });
    });
}

function getPlayersFromTeam(info){

    return new Promise((resolve, reject) => {
        
        const query = "SELECT P.id AS player_id, P.pagename AS pagename, P.name AS name FROM player P LEFT JOIN team T ON T.id = P.team_id WHERE T.pagename = ?";

        db.query(query, [info["teamName"]], function(result){
            info["players"] = JSON.parse(JSON.stringify(result));
            resolve(info);
        });
    });
}

function getPlayersInGame(info){

    return new Promise((resolve, reject) => {
        
        const query = "SELECT PL.team_id AS team_id, PL.id AS player_id, PL.pagename AS pagename, PL.name AS name FROM participation PA LEFT JOIN player PL ON PL.id = PA.player_id WHERE PA.game_id = ?";

        db.query(query, [info["gameId"]], function(result){
            const data = JSON.parse(JSON.stringify(result));
            info["troops"] = {};
            for (let i = 0; i<data.length; i++){
                if (!info["troops"][data[i].team_id]){
                    info["troops"][data[i].team_id] = [];
                }
                info["troops"][data[i].team_id].push(data[i]);
            }
            resolve(info);
        });
    });
}

function getPlayerHighlights(info){

    return new Promise((resolve, reject) => {
        
        if (info["playerName"]){
            const query = "SELECT V.platform AS platform, V.link AS link, V.game_id AS game_id,  \
                                  G.timestamp AS timestamp, G.teamhome_goals AS t1_goals, G.teamaway_goals AS t2_goals, \
                                  P1.name AS p1_name, P1.pagename AS p1_pagename, P2.name AS p2_name, P2.pagename AS p2_pagename \
                           FROM goal G \
                           LEFT JOIN video V ON V.id = G.video_id \
                           LEFT JOIN player P1 ON P1.id = G.goal_player_id \
                           LEFT JOIN player P2 ON P2.id = G.assist_player_id \
                           WHERE P1.pagename = ? OR P2.pagename = ?";

            db.query(query, [info["playerName"], info["playerName"]], function(result){
                info["player_highlights"] = JSON.parse(JSON.stringify(result));
                resolve(info);
            });
        } else {
            resolve(info);
        }
    });
}

function getPlayerParticipation(info){

    return new Promise((resolve, reject) => {
        
        if (info["playerName"]){
            const query = "SELECT G.id AS game_id, T1.name AS t1_name, T1.pagename AS t1_pagename, T2.name AS t2_name, T2.pagename AS t2_pagename, G.teamhome_score AS t1_score, G.teamaway_score AS t2_score \
                           FROM participation PA \
                           LEFT JOIN player P ON P.id = PA.player_id \
                           LEFT JOIN game G ON G.id = PA.game_id \
                           LEFT JOIN team T1 ON T1.id = G.teamhome_id \
                           LEFT JOIN team T2 ON T2.id = G.teamaway_id \
                           WHERE P.pagename = ?";

            db.query(query, [info["playerName"]], function(result){
                info["player_participation"] = JSON.parse(JSON.stringify(result));
                resolve(info);
            });
        } else {
            resolve(info);
        }
    });
}


function verifyPermissions(info){
    
    return new Promise((resolve, reject) => {
        
        const data = info["verification"];
        const query = "SELECT access FROM permission P LEFT JOIN user U ON U.id = P.user_id WHERE U.hash = ? AND (team_id = ? OR team_id = ?) AND property = ? LIMIT 1";

        db.query(query, [data["auth"], data["team1"], data["team2"], data["property"]], function(result){
            const res = JSON.parse(JSON.stringify(result));
            if (res.length != 1 || (res[0].access & data["action"]) == 0){
                reject("Insufficient privileges for the requested action.");
            } else {
                resolve(info);
            }
        });
    });
}

function verifyTeamCorrectness(info){
    
    return new Promise((resolve, reject) => {
        
        if (info["teamId"] && info["verification"]["team1"] != info["teamId"] && info["verification"]["team2"] != info["teamId"]){
            reject("Trying to assign data to a team that was not even mentioned. Pls don't.");
        } else {
            resolve(info);
        }
    });
}

function updateOrAddVideo(info){
    
    return new Promise((resolve, reject) => {
        
        const data = info["newData"];
        if (!data["videoId"]){
            
            const query = "INSERT INTO video (game_id, video_index, name, offset, platform, link, created_by) VALUES (?, ?, ?, ?, ?, ?, (SELECT id FROM user WHERE hash = ? LIMIT 1))";
            
            db.query(query, [data["gameId"], data["videoIndex"], data["name"], data["offset"], data["service"], data["link"], data["userHash"]], function(result){
                info["query_result"] = JSON.parse(JSON.stringify(result));
                resolve(info);
            });
        }
        else{
            
            const query = "UPDATE video SET game_id = ?, video_index = ?, name = ?, offset = ?, platform = ?, link = ?, created_by = (SELECT id FROM user WHERE hash = ? LIMIT 1) WHERE id = ?";
            
            db.query(query, [data["gameId"], data["videoIndex"], data["name"], data["offset"], data["service"], data["link"], data["userHash"], data["videoId"]], function(result){
                info["query_result"] = JSON.parse(JSON.stringify(result));
                resolve(info);
            });
        }
    });
}

function updateOrAddGoal(info){
    
    return new Promise((resolve, reject) => {
        
        const data = info["newData"];
        if (!data["eventId"]){
            
            const query = "INSERT INTO goal (game_id, video_id, timestamp, teamhome_goals, teamaway_goals, scorer_team_id, goal_player_id, assist_player_id, created_by) \
                                            VALUES (?, ?, ?, ?, ?, ?, \
                                                    coalesce((SELECT P.id AS id FROM player P WHERE P.id = ? AND P.team_id = ? LIMIT 1), -1), \
                                                    coalesce((SELECT P.id AS id FROM player P WHERE P.id = ? AND P.team_id = ? LIMIT 1), -1), \
                                                    (SELECT id FROM user WHERE hash = ? LIMIT 1) \
                                                   )";
            const params = [data["gameId"], data["videoId"], data["timestamp"], data["t1Goals"], data["t2Goals"], data["scorerTeamId"],
                            data["scorerId"], data["scorerTeamId"], data["assistId"], data["scorerTeamId"], data["userHash"]];
            
            db.query(query, params, function(result){
                info["query_result"] = JSON.parse(JSON.stringify(result));
                resolve(info);
            });
        }
        else{
            
            const query = "UPDATE goal SET game_id = ?, video_id = ?, timestamp = ?, teamhome_goals = ?, teamaway_goals = ?, scorer_team_id = ?, \
                                           goal_player_id = coalesce((SELECT P.id AS id FROM player P WHERE P.id = ? AND P.team_id = ? LIMIT 1), -1), \
                                           assist_player_id = coalesce((SELECT P.id AS id FROM player P WHERE P.id = ? AND P.team_id = ? LIMIT 1), -1), \
                                           created_by = (SELECT id FROM user WHERE hash = ? LIMIT 1) \
                                       WHERE id = ?";
            const params = [data["gameId"], data["videoId"], data["timestamp"], data["t1Goals"], data["t2Goals"], data["scorerTeamId"],
                            data["scorerId"], data["scorerTeamId"], data["assistId"], data["scorerTeamId"], data["userHash"], data["eventId"]];
            
            db.query(query, params, function(result){
                info["query_result"] = JSON.parse(JSON.stringify(result));
                resolve(info);
            });
        }
    });
}

function updateOrAddComment(info){
    
    return new Promise((resolve, reject) => {
        
        const data = info["newData"];
        if (!data["eventId"]){
            
            const query = "INSERT INTO comment (game_id, video_id, timestamp, comment, created_by) VALUES (?, ?, ?, ?, (SELECT id FROM user WHERE hash = ? LIMIT 1))";
            const params = [data["gameId"], data["videoId"], data["timestamp"], data["comment"], data["userHash"]];
            
            db.query(query, params, function(result){
                info["query_result"] = JSON.parse(JSON.stringify(result));
                resolve(info);
            });
        }
        else{
            
            const query = "UPDATE comment SET game_id = ?, video_id = ?, timestamp = ?, comment = ?, created_by = (SELECT id FROM user WHERE hash = ? LIMIT 1) WHERE id = ?";
            const params = [data["gameId"], data["videoId"], data["timestamp"], data["comment"], data["userHash"], data["eventId"]];
            
            db.query(query, params, function(result){
                info["query_result"] = JSON.parse(JSON.stringify(result));
                resolve(info);
            });
        }
    });
}

function addParticipation(info){
    
    return new Promise((resolve, reject) => {
        
        if (info["gameId"] && info["playerId"]){
            const query = "INSERT INTO participation (game_id, player_id) VALUES (?, ?)";
            
            db.query(query, [info["gameId"], info["playerId"]], function(result){
                info["query_result"] = JSON.parse(JSON.stringify(result));
                resolve(info);
            });
        }
        else{
            reject("Could not find the player to add to game");
        }
    });
}

function removeGoal(info){
    
    return new Promise((resolve, reject) => {
        
        if (info["eventId"]){
            const query = "DELETE FROM goal WHERE id = ? LIMIT 1";
            
            db.query(query, info["eventId"], function(result){
                info["query_result"] = JSON.parse(JSON.stringify(result));
                resolve(info);
            });
        }
        else{
            reject("Could not find the event to remove");
        }
    });
}

function removeComment(info){
    
    return new Promise((resolve, reject) => {
        
        if (info["eventId"]){
            const query = "DELETE FROM comment WHERE id = ? LIMIT 1";
            
            db.query(query, info["eventId"], function(result){
                info["query_result"] = JSON.parse(JSON.stringify(result));
                resolve(info);
            });
        }
        else{
            reject("Could not find the event to remove");
        }
    });
}

function removeParticipation(info){
    
    return new Promise((resolve, reject) => {
        
        if (info["gameId"] && info["playerId"]){
            const query = "DELETE FROM participation WHERE game_id = ? AND player_id = ? LIMIT 1";
            
            db.query(query, [info["gameId"], info["playerId"]], function(result){
                info["query_result"] = JSON.parse(JSON.stringify(result));
                resolve(info);
            });
        }
        else{
            reject("Could not find the player/game to remove from participation");
        }
    });
}

