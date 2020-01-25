module.exports = {
    eq: function(v1, v2, options)
    {
        return v1 == v2;
    },
    gt: function(v1, v2, options)
    {
        return v1 > v2;
    },
    ternary: function(b, valTrue, valFalse, options)
    {
        return b ? valTrue : valFalse;
    },
    inc: function(value, options)
    {
        return parseInt(value) + 1;
    },
    div: function(v1, v2, options)
    {
        return Math.floor(v1/v2);
    },
    mod: function(v1, v2, options)
    {
        return v1 % v2;
    },
    sign: function(value, options)
    {
        return value >= 0 ? "+" + value : "" + value;
    },
    not: function(value, options)
    {
        return !value;
    },
    twodig: function(value, options)
    {
        return value < 10 ? "0" + value : "" + value;
    },
    isnumber: function(value, options)
    {
        return value !== undefined && value !== null && !isNaN(value);
    },
    repeat: function(value, options)
    {
        return Array.from(Array(value).keys())
    },
    prettydate: function(dateStr, options)
    {
        const d = new Date(dateStr);
        return (d.getYear()+1900) + "-" + (d.getMonth() < 9 ? "0" : "") + (d.getMonth()+1) + "-" + (d.getDate() < 10 ? "0" : "") + d.getDate();
    },
    prettydatetime: function(dateStr, options)
    {
        const days = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];
        const months = ["Jan", "Feb", "Mar", "Apr", "Maj", "Juni", "Juli", "Aug", "Sep", "Okt", "Nov", "Dec"];
        const d = new Date(dateStr);
        return days[d.getDay()] + " " + d.getDate() + " " + months[d.getMonth()] + " " + (d.getHours() < 10 ? "0" : "") + d.getHours() + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
    },
    camera: function(camera_index, options)
    {
        return "C" + camera_index;
    },
    score: function(value, options)
    {
        return module.exports.isnumber(value) ? value : "?"; 
    },
    validvideo: function(videos, options)
    {
        return videos.filter(x => x.link).length > 0;
    },
    gameresult: function(score1, score2, options)
    {
        if (score1 > score2) return "winner";
        else if (score1 < score2) return "loser";
        else return "eq";
    },
    thumbnail: function(platform, videoId, options)
    {
        if (platform == "youtube") return "https://img.youtube.com/vi/" + videoId + "/1.jpg";
        else return "";
    },
    videolink: function(platform, videoId, options){
        if (platform == "youtube") return "https://youtube.com/watch?v=" + videoId;
        else return (videoId ? videoId : ""); 
    },
    lastgame: function(t1Name, t1Score, t2Name, t2Score, options)
    {
        if (t1Score > t2Score){
            return t1Name + " vann med " + t1Score + " - " + t2Score + " senast."
        } else if (t2Score > t1Score){
            return t2Name + " vann med " + t2Score + " - " + t1Score + " senast.";
        } else {
            return "Det slutade lika i senaste mötet (" + t1Score + " - " + t2Score + ").";
        }
    },
    vsstats: function(t1Name, t1ScoreG2, t1ScoreG1, t2Name, t2ScoreG2, t2ScoreG1, options)
    {
        const win = function(v1, v2) {return v1 > v2};
        const played = function(v1, v2) {return v1 !== undefined && v1 !== null && !isNaN(v1) && v2 !== undefined && v2 !== null && !isNaN(v2);}
        
        if (!played(t1ScoreG1, t2ScoreG1)){
            return "Det här är första gången de här lagen möts i år.";
        } else {
            if (win(t1ScoreG1, t2ScoreG1)){
                if (win(t1ScoreG2, t2ScoreG2)){
                    return t1Name + " tar andra vinsten mot " + t2Name + ".";
                } else if (win(t2ScoreG2, t1ScoreG2)){
                    return t2Name + " kvitterar serien med en vinst.";
                } else {
                    return t1Name + "'s vinst följdes upp en oavgjord match.";
                }
            } else if (win(t2ScoreG1, t1ScoreG1)){
                if (win(t1ScoreG2, t2ScoreG2)){
                    return t1Name + " kvitterar serien med en vinst.";
                } else if (win(t2ScoreG2, t1ScoreG2)){
                    return t2Name + " tar andra vinsten mot " + t1Name + ".";
                } else {
                    return t2Name + "'s vinst följdes upp en oavgjord match.";
                }
            } else {
                if (win(t1ScoreG2, t2ScoreG2)){
                    return "Första matchen blev oavgjord men nu blev det vinst för " + t1Name + ".";
                } else if (win(t2ScoreG2, t1ScoreG2)){
                    return "Första matchen blev oavgjord men nu blev det vinst för " + t2Name + ".";
                } else {
                    return "Andra oavgjorda matchen mellan dessa lag i år, vilken rysare!";
                }
            }
        }
    }
};