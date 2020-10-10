
const db = require('./db');

const request = require('request');
const crypto = require('crypto');

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

exports.updateData = function(){
    db.query("SELECT id, homepage, last_fetched_page FROM series", {}, function(result){
        for(var i in result){
            updateSeries(result[i]);
        }
    });
}

function updateSeries(series){
    const url = series['homepage'];
    request(url, {encoding: 'binary'}, (err, res, body) => {
        if (err) {
            console.log("Could not update series: " + err);
            return;
        }
        
        const page_hash = crypto.createHash('md5').update(body).digest("hex");
        if (series['last_fetched_page'] != page_hash){
            console.log("Found updated information on series page. Syncing...");
            db.query("UPDATE series SET last_fetched_page = ? WHERE id = ?", [page_hash, series['id']]);
            db.query("SELECT T.id AS id, T.name AS name FROM team T WHERE series_id = ?", [series['id']], function(teams){
                updateSeriesWithData(series['id'], teams, body.toString('latin1'));
            });
        }
    });
}

function splitIntoLines(data){
    return data.innerHTML.split("<br>").map(el => el.trim());
}

function findTeamId(teams, team_name){
    const team = teams.filter(t => t.name == team_name);
    if (team.length != 1) console.log("Warning: Could not find team with name '" + team_name + "'");
    return team.length == 1 ? team[0].id : -1;
}

function updateSeriesWithData(series_id, teams, html_data){
    const dom = new JSDOM(html_data).window.document;
    const schedule = dom.querySelectorAll("table")[3].querySelector("tbody").querySelectorAll("tr")[2].querySelectorAll("td");
    
    const homeTeams = splitIntoLines(schedule[1]).map(name => findTeamId(teams, name));
    const awayTeams = splitIntoLines(schedule[3]).map(name => findTeamId(teams, name));
    const dates = splitIntoLines(schedule[4]);
    const times = splitIntoLines(schedule[5]);
    const locations = splitIntoLines(schedule[6]).map(el => el.length > 0 ? el.substring(el.indexOf("\">")+2, el.indexOf("</a>")) : el);
    const homeScores = splitIntoLines(schedule[7]);
    const awayScores = splitIntoLines(schedule[9]);
    
    for(var i in homeTeams){
        if (homeTeams[i] != -1 && awayTeams[i] != -1){
            var date = "20" + dates[i] + " " + times[i] + ":00";
            var homeScore = homeScores[i].length == 0 ? null : parseInt(homeScores[i]);
            var awayScore = awayScores[i].length == 0 ? null : parseInt(awayScores[i]);
            db.query("INSERT INTO game (playdate, location, teamhome_id, teamaway_id, teamhome_score, teamaway_score) VALUES(?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE playdate=?, location=?, teamhome_score=?, teamaway_score=?", [date, locations[i], homeTeams[i], awayTeams[i], homeScore, awayScore, date, locations[i], homeScore, awayScore]);
        }
    }
}