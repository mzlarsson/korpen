const fs = require('fs');
const ytdl = require('ytdl-core');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffprobePath = require('@ffprobe-installer/ffprobe').path
const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath)
ffmpeg.setFfprobePath(ffprobePath)

const db = require('./db');
db.connect_with_defaults();

const TEMP_FOLDER = "public/tmp";

// Example of choosing a video format.
function downloadVideo(videoID, outputFolder, callback) {
    
    let outPath = outputFolder+'/video_'+videoID+'.mp4';
    if (!fs.existsSync(outPath)) {
        ytdl('http://www.youtube.com/watch?v='+videoID)
          .pipe(fs.createWriteStream(outPath).on('finish', function(err){
                if (!err) callback(outPath);
                else callback("");
           }));
    } else {
        callback(outPath);
    }
}

function downloadAllVideos(videos, callback){
    
    console.log("Downlading videos from YT...");
    let downloadedVideos = {};
    let finishedDownloads = 0;
    for (const video of videos) {
        const videoId = video.id;
        downloadVideo(video.link, TEMP_FOLDER, (path) => {
            console.log("Downloaded file to path " + path);
            downloadedVideos[videoId] = path;
            if (++finishedDownloads >= videos.length){
                callback(downloadedVideos);
            }
        });
    }
}

function createSubVideo(downloadedVideos, event, callback){
    let videoPath = downloadedVideos[event.video_id];
    let outPath = TEMP_FOLDER + '/happening_' + event.type + '_' + event.event_id + '.mp4';
    
    ffmpeg(videoPath)
      .setStartTime(event.timestamp)
      .setDuration(10)
      .videoFilters({
          filter: 'drawtext',
          options: {
              fontfile: 'public/fonts/JosefinSans-Regular.ttf',
              text: (event.type == "goal" ? event.t1_name + " " + event.t1_goals + " - " + event.t2_goals + " " + event.t2_name : event.comment),
              fontsize: 16,
              fontcolor: 'white',
              x: 30,
              y: 25,
              shadowcolor: 'black',
              shadowx: 2,
              shadowy: 2
          }
      })
      .videoFilters({
          filter: 'drawtext',
          options: {
              fontfile: 'public/fonts/JosefinSans-Regular.ttf',
              text: (event.type == "goal" ? (event.scorer_name ? event.scorer_name : "") + (event.assist_name ? " (" + event.assist_name + ")" : "") : ""),
              fontsize: 14,
              fontcolor: 'white',
              x: 30,
              y: 45,
              shadowcolor: 'black',
              shadowx: 2,
              shadowy: 2
          }
      })
      .on('end', function(err) {
          if(!err) { callback(event.event_id, outPath); }
          else { callback(event.event_id, ""); }
      })
      .on('error', function(err){
          console.log('error: ', err)
          callback(event.event_id, "");
      })
      .save(outPath);
}

function createSubVideoNoOverlay(outName, videoPath, timestamp, duration, callback){
    let outPath = TEMP_FOLDER + '/' + outName + '.mp4';
    
    ffmpeg(videoPath)
      .setStartTime(timestamp)
      .setDuration(duration)
      .on('end', function(err) {
          if(!err) { callback(outPath); }
          else { callback(""); }
      })
      .on('error', function(err){
          console.log('error: ', err)
          callback("");
      })
      .save(outPath);
}

function createSubVideos(downloadedVideos, events, callback){
    
    console.log("Creating subvideos...");
    let conversionsFinished = 0;
    let subVideos = [];
    
    // Prefill result array to retain order
    for (const event of events){
        subVideos.push({"event": event, "video": ""});
    }
    
    for (const event of events) {
        createSubVideo(downloadedVideos, event, (event_id, path) => {
            console.log('Created sub video ' + path)
            // Update path entry
            subVideos.filter(x => x.event.event_id == event_id)[0].video = path;
            if (++conversionsFinished == events.length){
                callback(subVideos);
            }
        });
    }
}

function mergeVideos(outputName, subVideos, callback){
    let outputPath = TEMP_FOLDER + "/" + outputName;
    let mergedVideo = ffmpeg();
    for (const video of subVideos){
        mergedVideo = mergedVideo.addInput(video["video"]);
    }
    mergedVideo.mergeToFile(outputPath, TEMP_FOLDER)
    .on('end', function(err){
        callback(outputPath);
    })
    .on('error', function(err){
        console.log("Error: " + err);
        callback("");
    });
}

function createHighlights(outputName, videos, events, callback) {
    
    console.log("Creating highlights video...");
    
    downloadAllVideos(videos, downloadedVideos => {
        createSubVideos(downloadedVideos, events, (subVideos) => {    
            console.log("Merging into one video...");
            mergeVideos(outputName, subVideos, (output) => {
                console.log("Created file: " + output);
            });
        });
    });
}


function getGameData(gameId, callback){
    const query_goals = "SELECT 'goal' AS type, G.id AS event_id, G.timestamp-V.offset AS refTime, V.id AS video_id, G.timestamp AS timestamp, G.teamhome_goals AS t1_goals, G.teamaway_goals AS t2_goals, \
                                    P1.name AS scorer_name, P2.name AS assist_name, T1.name AS t1_name, T2.name AS t2_name, NULL AS comment \
                             FROM goal G \
                             LEFT JOIN game GA ON GA.id = G.game_id \
                             LEFT JOIN player P1 ON P1.id = G.goal_player_id \
                             LEFT JOIN player P2 ON P2.id = G.assist_player_id \
                             LEFT JOIN team T1 ON T1.id = GA.teamhome_id \
                             LEFT JOIN team T2 ON T2.id = GA.teamaway_id \
                             LEFT JOIN video V ON V.id = G.video_id \
                             WHERE G.game_id = ?";
                             
    const query_comments = "SELECT 'comment' AS type, C.id AS event_id, C.timestamp-V.offset AS refTime, V.id AS video_id, C.timestamp AS timestamp, \
                                   NULL AS t1_goals, NULL AS t2_goals, NULL AS scorer_name, NULL AS assist_name, NULL AS t1_name, NULL AS t2_name, C.comment AS comment \
                            FROM comment C \
                            LEFT JOIN video V ON V.id = C.video_id \
                            WHERE C.game_id = ?";
                            
    const query = "SELECT * FROM (" + query_goals + " UNION " + query_comments + ") U ORDER BY refTime";
    
    db.query(query, [gameId, gameId], function(result){
        let events = JSON.parse(JSON.stringify(result));
        db.query("SELECT id, link FROM video WHERE game_id = ?", [gameId], function(videoResult){
            let videos = JSON.parse(JSON.stringify(videoResult));
            let data = {"videos": videos, "events": events};
            callback(data);
        });
    });
}

function createHighlightsForGame(gameId){
    getGameData(gameId, (data) => {
        console.log("Producing highlights from " + data.videos.length + " videos and " + data.events.length + " highlights");
        createHighlights("highlights_game" + gameId + ".mp4", data.videos, data.events);
    });
}

function getSmallClip(outName, videoId, timestamp, duration){
    downloadVideo(videoId, TEMP_FOLDER, (videoPath) => {
        createSubVideoNoOverlay(outName, videoPath, timestamp, duration, (outPath) => {
            console.log("Video created at " + outPath);
        });
    });
}

function waitForEnd(showInfoMessage){
    if (showInfoMessage){
        console.log('Waiting for completion. Pressing a key will kill the program.');
    }

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', process.exit.bind(process, 0));
}

// createHighlightsForGame(94);
// getSmallClip("jens_reason", "hFhp92Zp_QA", 3410, 9);

const { ArgumentParser } = require('argparse');
const { version } = require('./package.json');
 
const parser = new ArgumentParser({
  description: 'Argparse example'
});

parser.add_argument('-v', '--version', { action: 'version', version });
subparsers = parser.add_subparsers({ dest: 'feature', help: 'Functions' });

parser_highlights = subparsers.add_parser('highlight', { help: 'Generate highlight clip' });
parser_highlights.add_argument('game', { type: 'int', help: 'ID of the game (see URL on watch page)' });

parser_clip = subparsers.add_parser('clip', { help: 'Generate clip from game' });
parser_clip.add_argument('video', { type: 'string', help: 'Video ID of youtube clip (what comes after ?v=....)' });
parser_clip.add_argument('-b', '--begin', { type: 'int', default: 0, help: 'Start second in the clip' });
parser_clip.add_argument('-d', '--duration', { type: 'int', default: 10, help: 'Duration of generated clip (in seconds)' });
parser_clip.add_argument('-o', '--output', { type: 'string', default: 'clip', help: 'Output name of file (excluding extension)' });
 
args = parser.parse_args();

if (args.feature == "highlight"){
    createHighlightsForGame(args.game);
    waitForEnd(true);
}
else if(args.feature == "clip"){
    getSmallClip(args.output, args.video, args.begin, args.duration);
    waitForEnd(true);
}
else {
    waitForEnd(true);
}


