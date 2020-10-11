

function selectSeries(series_name){
    location.href = "/series/" + series_name;
}

function selectTeam(series_name, team_name){
    location.href = "/series/" + series_name + "/" + team_name;
}

function gotoUploadPage(series_name, team_name, game_id){
    location.href = "/series/" + series_name + "/" + team_name + "/upload/" + game_id;
}

function editGameEvents(series_name, team_name, game_id){
    location.href = "/series/" + series_name + "/" + team_name + "/events/" + game_id;
}

function loadPlayersInTeam(team_name, callback){
    $.getJSON("/api/team/players/" + team_name, callback);
}

function reloadEventsPreview(series_name, team_name, game_id, element_id){
    const url = "/series/" + series_name + "/" + team_name + "/events/ " + game_id + "/editpanel?editable";
    $.get(url, function(data){
        document.getElementById(element_id).innerHTML = data;
    });
}

function reloadTroops(series_name, team_name, game_id, element_id){
    const url = "/series/" + series_name + "/" + team_name + "/troops/ " + game_id;
    $.get(url, function(data){
        document.getElementById(element_id).innerHTML = data;
    });
}

function updateOrAddVideo(game_id, video_id, index, name, offset, service, link, callback){
    
    if (link != "" && isValidLink(service, link)){
        let data = {"game_id": game_id, "video_id": video_id, "video_index": index,
                    "name": name, "offset": offset, "service": service, "link": getVideoId(service, link)};
                    
        $.post("/api/video/update", data, function(data){
            if (callback) callback(data["error"]);
        }).fail(function(e){
            callback("Okänt kommunikationsfel.");
        });
    } else {
        callback("Länken för videon är felaktig.");
    }
}

function updateOrAddGoal(event_id, game_id, video_id, timestamp, t1_goals, t2_goals, scorer_team_id, scorer_id, assist_id, callback){
    let data = {"type": "goal", "event_id": event_id, "game_id": game_id, "video_id": video_id, "timestamp": timestamp, "t1_goals": t1_goals, "t2_goals": t2_goals,
                "scorer_team_id": scorer_team_id, "scorer_id": scorer_id, "assist_id": assist_id};

    $.post("/api/event/update", data, function(data){
        if (callback) callback(data["error"]);
    }).fail(function(e){
        if (callback) callback("Unknown communication error.");
    });
}

function updateOrAddComment(event_id, game_id, video_id, timestamp, comment, callback){
    let data = {"type": "comment", "event_id": event_id, "game_id": game_id, "video_id": video_id, "timestamp": timestamp, "comment": comment};

    $.post("/api/event/update", data, function(data){
        if (callback) callback(data["error"]);
    }).fail(function(e){
        if (callback) callback("Unknown communication error.");
    });
}

function addParticipationFromGame(game_id, player_id, callback){
    let data = {"game_id": game_id, "player_id": player_id};

    $.post("/api/participation/add", data, function(data){
        if (callback) callback(data["error"]);
    }).fail(function(e){
        if (callback) callback("Unknown communication error.");
    });
}



function removeGoal(event_id, callback){
    let data = {"type": "goal", "event_id": event_id};

    $.post("/api/event/remove", data, function(data){
        if (callback) callback(data["error"]);
    }).fail(function(e){
        if (callback) callback("Unknown communication error.");
    });
}

function removeComment(event_id, callback){
    let data = {"type": "comment", "event_id": event_id};

    $.post("/api/event/remove", data, function(data){
        if (callback) callback(data["error"]);
    }).fail(function(e){
        if (callback) callback("Unknown communication error.");
    });
}

function removeParticipationFromGame(game_id, player_id, callback){
    let data = {"game_id": game_id, "player_id": player_id};

    $.post("/api/participation/remove", data, function(data){
        if (callback) callback(data["error"]);
    }).fail(function(e){
        if (callback) callback("Unknown communication error.");
    });
}

function isValidLink(service, link){
    if (service == "youtube"){
        const YT_LINK_REGEX = /.*v=(.{11})($|&.*$)/g;
        return YT_LINK_REGEX.test(link);
    }
    
    return false;
}

function getVideoId(service, link){
    if (service == "youtube"){
        const YT_LINK_REGEX = /.*v=(.{11})($|&.*$)/g;
        const matches = YT_LINK_REGEX.exec(link);
        if (matches){
            return matches[1];
        }
    }
    
    return link;
}

function loadVideoIntoElement(service, element_id, video_id, on_player_ready){
    
    if (service == "youtube") {
        return new YT.Player(element_id, { width: "100%", height: "100%", videoId: video_id, events: { 'onReady': on_player_ready }	});
    } else {
        return {"error": "Invalid service"};
    }
}




/* ---------- Moved from Watch page --------------- */
var currVideoOffset = 0;
var watchPlayer;

function initWatchPlayer(element_id){
    const firstCamera = document.getElementsByClassName("camera")[0];
    watchPlayer = loadVideoIntoElement("youtube", element_id, firstCamera.getAttribute("filename"), onWatchPlayerReady);
}

function getWatchPlayerVideoIndex(){
    var cameras = document.getElementsByClassName("camera");
    for (let i = 0; i<cameras.length; i++){
        if (cameras[i].classList.contains("selected")){
            return i;
        }
    }
    
    return -1;
}

function getWatchPlayerTime(){
    return watchPlayer ? watchPlayer.getCurrentTime() : 0;
}

function setTimeAndView(camera_index, offset){
    var cameras = document.getElementsByClassName("camera");
    if (cameras.length > camera_index && !cameras[camera_index].classList.contains("selected")){
        setCamera(cameras[camera_index], parseInt(offset));
    } else {
        watchPlayer.seekTo(parseInt(offset), true);
    }
}

function onWatchPlayerReady(){
    console.log("Watch player is ready");
}

function setCameraRaw(service, elementId, videoId, startTime){
    if (service == "youtube"){
        if (watchPlayer){
            watchPlayer.loadVideoById({'videoId': videoId, 'startSeconds': parseInt(startTime)});
        } else {
            watchPlayer = loadVideoIntoElement(service, elementId, videoId, function(){
                watchPlayer.seekTo(parseInt(startTime), true);
            });
        }
    }
}

function setCamera(selectedEl, timeToJumpTo){
    // Fix graphical stuffs
    var oldSelection = document.getElementsByClassName("multioption camera selected");
    if(oldSelection){
        oldSelection[0].className = "multioption camera";
    }
    selectedEl.className = "multioption camera selected";
    
    if (!timeToJumpTo && timeToJumpTo !== 0){
        timeToJumpTo = watchPlayer.getCurrentTime() + (parseInt(selectedEl.getAttribute("offset")) - currVideoOffset);
    }
    
    currVideoOffset = parseInt(selectedEl.getAttribute("offset"));

    // Change video element
    watchPlayer.loadVideoById({'videoId': selectedEl.getAttribute("filename"), 'startSeconds': timeToJumpTo});
}