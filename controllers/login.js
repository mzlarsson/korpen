
module.exports = function(model){
    
    const express = require("express");
    const router = express.Router();

    router.get("/", (req, res) => {
        res.send("L [from code]");
    });

    return router;
}

