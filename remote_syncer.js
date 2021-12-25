
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
                updateSeriesWithData(url, series['id'], teams, body.toString('latin1'));
            });
        }
    });
}

function splitIntoLines(data){
    return data.innerHTML.split("<br>").map(el => el.trim());
}

function findTeamId(teams, team_name){
    const team = teams.filter(t => t.name == team_name);
    if (team.length != 1) {
        console.log("Warning: Could not find team with name '" + team_name + "'");
    }
    return team.length == 1 ? team[0].id : -1;
}

function updateSeriesWithData(url, series_id, teams, html_data){

    let games = [];
    if (url.startsWith("http://www.korpengbg.se")) {
        games = getGamesFromKorpenGBG(teams, html_data);
    }
    else if (url.startsWith("https://korpengoteborg.zoezi.se/")) {
        games = getGamesFromSoezi(teams, html_data);
    }
    else {
        console.log(`The given URL has no handler: ${url}`);
    }

    for (let g of games) {
        // You can use the following line for debugging when creating a new syncer function
        // Comment out the db.query lines and uncomment the console.log one.
        //console.log(`${g.date}\t${g.location}\t${g.homeTeam}\t${g.awayTeam}\t${g.homeScore}\t${g.awayScore}`);
        db.query(`INSERT INTO game (playdate, location, teamhome_id, teamaway_id, teamhome_score, teamaway_score)
                  VALUES(?, ?, ?, ?, ?, ?)
                  ON DUPLICATE KEY UPDATE playdate=?, location=?, teamhome_score=?, teamaway_score=?`,
                  [g.date, g.location, g.homeTeam, g.awayTeam, g.homeScore, g.awayScore, g.date, g.location, g.homeScore, g.awayScore]
                );
    }
}

function getGamesFromKorpenGBG(teams, html_data) {
    const dom = new JSDOM(html_data).window.document;
    const schedule = dom.querySelectorAll("table")[3].querySelector("tbody").querySelectorAll("tr")[2].querySelectorAll("td");
    
    const homeTeams = splitIntoLines(schedule[1]).map(name => findTeamId(teams, name));
    const awayTeams = splitIntoLines(schedule[3]).map(name => findTeamId(teams, name));
    const dates = splitIntoLines(schedule[4]);
    const times = splitIntoLines(schedule[5]);
    const locations = splitIntoLines(schedule[6]).map(el => el.length > 0 ? el.substring(el.indexOf("\">")+2, el.indexOf("</a>")) : el);
    const homeScores = splitIntoLines(schedule[7]);
    const awayScores = splitIntoLines(schedule[9]);
    
    let result = [];
    for(var i in homeTeams){
        if (homeTeams[i] != -1 && awayTeams[i] != -1){
            if (dates[i].trim() != "" && times[i].trim() != "") {
                var date = "20" + dates[i] + " " + times[i] + ":00";
                var homeScore = homeScores[i].length == 0 ? null : parseInt(homeScores[i]);
                var awayScore = awayScores[i].length == 0 ? null : parseInt(awayScores[i]);
                
                result.push({
                    date: date,
                    location: locations[i],
                    homeTeam: homeTeams[i],
                    awayTeam: awayTeams[i],
                    homeScore: homeScore,
                    awayScore: awayScore
                });
            }
            else {
                console.log("Warning: Could not find date for game. Skipping to insert");
            }
        }
        else {
            console.log("Warning: Could not find one (or both) teams in database. Skipping to insert");
        }
    }

    return result;
}

function getGamesFromSoezi(teams, html_data) {
    let data = JSON.parse(html_data);
    
    let count = 0;
    return data.map(gameData => {

        let homeTeamScore = null;
        let awayTeamScore = null;
        if (gameData.result != null && gameData.finished) {
            homeTeamScore = parseInt(gameData.result.filter(r => r.team_id == gameData.teams[0].id)[0].result);
            awayTeamScore = parseInt(gameData.result.filter(r => r.team_id == gameData.teams[1].id)[0].result);
        }

        if (Number.isNaN(homeTeamScore)) {
            homeTeamScore = 0; // walk over?
        }
        if (Number.isNaN(awayTeamScore)) {
            awayTeamScore = 0; // walk over?
        }

        count++;
        if (gameData.activity == null) {
            console.log(`Skipping game with index ${count-1} due to no activity`);
            return null;
        }

        return {
            date: gameData.activity.startTime,
            location: gameData.activity.resources[0].lastname,
            homeTeam: findTeamId(teams, gameData.teams[0].name),
            awayTeam: findTeamId(teams, gameData.teams[1].name),
            homeScore: homeTeamScore,
            awayScore: awayTeamScore
        };
    })
    .filter(game => game != null);
}
