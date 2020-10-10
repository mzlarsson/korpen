

module.exports = function(model){

    const express = require("express");
    const router = express.Router();

    router.get("/", (req, res) => {
        model.getBaseData().then(function(data){
            res.render("home", data);
        });
    });
    
    router.get("/series/:seriesName", (req, res) => {
        model.getSeriesData(req.params.seriesName).then(function(data){
            res.render("series", data);
        });
    });
    
    router.get("/series/:seriesName/:teamName", (req, res) => {
        model.getTeamData(req.params.seriesName, req.params.teamName).then(function(data){
            res.render("team", data);
        });
    });
    
    router.get("/series/:seriesName/:teamName/watch", (req, res) => {
        model.getWatchData(req.params.seriesName, req.params.teamName, req.query.game).then(function(data){
            data["serviceName"] = "watch";
            res.render("watch", data);
        });
    });
    
    router.get("/series/:seriesName/:teamName/scores", (req, res) => {
        model.getPlayerScoreData(req.params.seriesName, req.params.teamName).then(function(data){
            data["serviceName"] = "scores";
            res.render("scores", data);
        });
    });
    
    router.get("/series/:seriesName/:teamName/upload/:gameId?", (req, res) => {
        model.getAddVideoData(req.params.seriesName, req.params.teamName, req.params.gameId).then(function(data){
            data["serviceName"] = "upload";
            res.render("upload", data);
        });
    });
    
    router.get("/series/:seriesName/:teamName/events/:gameId", (req, res) => {
        model.getEditEventsData(req.params.seriesName, req.params.teamName, req.params.gameId).then(function(data){
            data["serviceName"] = "upload";
            data["editable"] = true;
            res.render("events", data);
        });
    });
    
    router.get("/series/:seriesName/:teamName/events/:gameId/editpanel", (req, res) => {
        model.getEditEventsData(req.params.seriesName, req.params.teamName, req.params.gameId).then(function(data){
            data["serviceName"] = "upload";
            data["partialOnly"] = true;
            if ("editable" in req.query){
                data["editable"] = 5;
            }
            res.render("partials/preview_events", data);
        });
    });
    
    router.get("/series/:seriesName/:teamName/troops/:gameId", (req, res) => {
        model.getEditEventsData(req.params.seriesName, req.params.teamName, req.params.gameId).then(function(data){
            data["serviceName"] = "upload";
            data["partialOnly"] = true;
            res.render("partials/preview_troops", data);
        });
    });
    
    router.get("/series/:seriesName/:teamName/settings", (req, res) => {
        model.getTeamData(req.params.seriesName, req.params.teamName).then(function(data){
            data["serviceName"] = "settings";
            res.render("settings", data);
        });
    });
    
    router.get("/series/:seriesName/:teamName/player/:playerName", (req, res) => {
        model.getPlayerData(req.params.seriesName, req.params.teamName, req.params.playerName).then(function(data){
            res.render("player", data);
        });
    });
    
    
    router.post("/api/video/update", (req, res) => {
        const authKey = "hash";
        model.updateOrAddVideo(authKey, req.body.game_id, req.body.video_id, req.body.video_index, req.body.name, req.body.offset, req.body.service, req.body.link).then(function(success){
            res.json(success);
        }, function(errorMsg) {
            res.json({"error": errorMsg});
        });
    });
    
    router.post("/api/event/update", (req, res) => {
        const authKey = "hash";
        if (req.body.type == "goal"){
            model.updateOrAddGoal(authKey, req.body.event_id, req.body.game_id, req.body.video_id, req.body.timestamp, req.body.t1_goals, req.body.t2_goals, req.body.scorer_team_id, req.body.scorer_id, req.body.assist_id).then(function(result){
                res.json(result);
            }, function(errorMsg) {
                res.json({"error": errorMsg});
            });
        } else if (req.body.type == "comment"){
            model.updateOrAddComment(authKey, req.body.event_id, req.body.game_id, req.body.video_id, req.body.timestamp, req.body.comment).then(function(result){
                res.json(result);
            }, function(errorMsg) {
                res.json({"error": errorMsg});
            });
        } else {
            res.json({"error": "Invalid event type"});
        }
    });
    
    router.post("/api/event/remove", (req, res) => {
        const authKey = "hash";
        if (req.body.type == "goal"){
            model.removeGoal(authKey, req.body.event_id).then(function(result){
                res.json(result);
            }, function(errorMsg) {
                res.json({"error": errorMsg});
            });
        } else if (req.body.type == "comment"){
            model.removeComment(authKey, req.body.event_id).then(function(result){
                res.json(result);
            }, function(errorMsg) {
                res.json({"error": errorMsg});
            });
        } else {
            res.json({"error": "Invalid event type"});
        }
    });
    
    router.post("/api/participation/add", (req, res) => {
        const authKey = "hash";
        model.addParticipation(authKey, req.body.game_id, req.body.player_id).then(function(success){
            res.json(success);
        }, function(errorMsg) {
            res.json({"error": errorMsg});
        });
    });
    
    router.post("/api/participation/remove", (req, res) => {
        const authKey = "hash";
        model.removeParticipation(authKey, req.body.game_id, req.body.player_id).then(function(success){
            res.json(success);
        }, function(errorMsg) {
            res.json({"error": errorMsg});
        });
    });
    
    router.get("/api/team/players/:teamName", (req, res) => {
        model.getPlayers(req.params.teamName).then(function(data){
            res.json(data);
        });
    });
    
    router.get("/api/videos/:gameId", (req, res) => {
        model.getVideos(req.params.gameId).then(function(data){
            res.json(data);
        });
    });

    return router;
}