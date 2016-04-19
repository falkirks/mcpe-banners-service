var express = require('express');
var fs = require('fs');
var router = express.Router();
var mcpeping = require('mcpe-ping');
var mcpebanners = require('mcpe-banners');

var CACHE_TTL = 10;

/**
 * This cache resembled the one in "mcpe-banners", but is kept seperate.
 * This allows us to refresh one faster than the other.
 * @type {{}}
 */
var cachedResponses = {};
function getCachedResponse(address, port){
    if(cachedResponses[address + ":" + port] != null){
        if(cachedResponses[address + ":" + port].time+20 >= Math.floor(Date.now() / 1000)){
            return cachedResponses[address + ":" + port].data;
        }
    }
    return null;
}
function setCachedResponse(address, port, data){
    cachedResponses[address + ":" + port] = {
        time: Math.floor(Date.now() / 1000),
        data: data
    };
}

/* GET home page. */
router.get('/:serverIP', function(req, res, next) {
    if(req.params.serverIP.indexOf(".") >= 0){
        var serverURI = req.params.serverIP.split(":");
        if(serverURI[1] == null) serverURI[1] = 19132;
        var pong = getCachedResponse(serverURI[0], serverURI[1]);
        if(pong !== null){
            res.render('server', {
                ip: serverURI[0],
                port: serverURI[1],
                pong: pong,
                error: pong.error,
                title: req.query.title
            });
        }
        else {
            try {
                mcpeping(serverURI[0], serverURI[1], function (err, pong) {
                    if(pong == null){
                        pong = {};
                        pong.offline = true;
                        pong.error = err;
                    }
                    setCachedResponse(serverURI[0], serverURI[1], pong);
                    res.render('server', {
                        ip: serverURI[0],
                        port: serverURI[1],
                        pong: pong,
                        error: err,
                        title: req.query.title
                    });
                }, 2000);
            }
            catch (e) {
                next();
            }
        }
    }
    else {
        next();
    }
});
router.get('/:serverIP/json', function(req, res, next) {
    if(req.params.serverIP.indexOf(".") >= 0){
        var serverURI = req.params.serverIP.split(":");
        if(serverURI[1] == null) serverURI[1] = 19132;
        var pong = getCachedResponse(serverURI[0], serverURI[1]);
        if(pong !== null){
            pong.ip = serverURI[0];
            pong.port = serverURI[1];
            pong.title = req.query.title; // Is this needed?
            res.jsonp(pong);
        }
        else {
            try {
                mcpeping(serverURI[0], serverURI[1], function (err, pong) {
                    if(pong == null){
                        pong = {};
                        pong.offline = true;
                        pong.error = err;
                    }
                    setCachedResponse(serverURI[0], serverURI[1], pong);
                    pong.ip = serverURI[0];
                    pong.port = serverURI[1];
                    pong.title = req.query.title; // Is this needed?
                    res.jsonp(pong);
                }, 2000);
            }
            catch (e) {
                next();
            }
        }
    }
    else {
        next();
    }
});
router.get('/:serverIP/banner', function(req, res, next) {
    if(req.params.serverIP.indexOf(".") >= 0){
        var serverURI = req.params.serverIP.split(":");
        if(serverURI[1] == null) serverURI[1] = 19132;
        mcpebanners(serverURI[0], serverURI[1], function (err, buffer) {
            if(err){
                console.log(err);
            }
            res.writeHead(200, {'Content-Type': 'image/png' });
            res.end(buffer, 'binary');
            fs.writeFileSync(__dirname + '/../out.png', buffer);
        });
    }
    else {
        next();
    }
});

module.exports = router;

