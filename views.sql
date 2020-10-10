

DROP VIEW IF EXISTS game_bidirectional;
CREATE VIEW game_bidirectional AS
SELECT
 	G1.teamhome_id AS team_id,
 	G1.teamaway_id AS opponent_id,
 	G1.teamhome_score AS team_score,
 	G1.teamaway_score AS opponent_score
 FROM game G1
 UNION ALL
 SELECT
 	G2.teamaway_id AS team_id,
 	G2.teamhome_id AS opponent_id,
 	G2.teamaway_score AS team_score,
 	G2.teamhome_score AS opponent_score
 FROM game G2;


DROP VIEW IF EXISTS standings;
CREATE VIEW standings AS
(SELECT 
	series_id, team_id, name, games, wins, eq, losses, goals, antigoals,
    goals-antigoals AS diff,
    wins*3 + eq AS points
FROM 
(SELECT
	S.id AS series_id,
    T.id AS team_id,
    T.name AS name,
    sum(if(G.team_id = T.id, 1, 0)) AS games,
    sum(if(G.team_id = T.id AND G.team_score > G.opponent_score, 1, 0)) AS wins,
    sum(if(G.team_id = T.id AND G.team_score = G.opponent_score, 1, 0)) AS eq,
    sum(if(G.team_id = T.id AND G.team_score < G.opponent_score, 1, 0)) AS losses,
    coalesce(sum(if(G.team_id = T.id, G.team_score, 0)), 0) AS goals,
    coalesce(sum(if(G.team_id = T.id, G.opponent_score, 0)), 0) AS antigoals
FROM team T
LEFT JOIN series S ON S.id = T.series_id
LEFT JOIN game_bidirectional G ON G.team_id = T.id AND G.team_score IS NOT NULL
GROUP BY T.id) Q);

DROP VIEW IF EXISTS players;
CREATE VIEW playerscore AS
(SELECT team_id, pagename, name, games, goals, assists, goals+assists AS points
 FROM
    (SELECT P.team_id AS team_id,
            P.pagename AS pagename,
            P.name AS name,
            count(PA.id) AS games,
            count(G.id) AS goals,
            count(G2.id) AS assists
     FROM player P
     LEFT JOIN goal G ON G.goal_player_id = P.id
     LEFT JOIN goal G2 ON G2.assist_player_id = P.id
     LEFT JOIN participation PA ON PA.player_id = P.id
     GROUP BY P.id) T);