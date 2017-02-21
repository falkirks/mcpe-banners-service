var express = require('express');
var router = express.Router();
var mcpeping = require('mcpe-ping');
var mcpebanners = require('mcpe-banners');
var fs = require('fs');

function readFiles(dirname, onFileContent, onError) {
    fs.readdir(dirname, function(err, filenames) {
        if (err) {
            onError(err);
            return;
        }
        filenames.forEach(function(filename) {
            fs.readFile(dirname + filename, 'utf-8', function(err, content) {
                if (err) {
                    onError(err);
                    return;
                }
                onFileContent(filename, content);
            });
        });
    });
}

var loadedStyles = {};
readFiles(appRoot + '/private/styles/', function(filename, content) {
    if(filename.indexOf('.json') != -1) {
        var name = filename.replace('.json', '');
        content = JSON.parse(content);
        content.image = appRoot + '/private/styles/' + content.image;
        content.font = appRoot + '/private/styles/' + content.font;
        loadedStyles[name] = content;
        console.log("Loaded " + name + " banner style.");
        console.log(loadedStyles);
    }

}, function(err) {
    throw err;
});

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
                }, 5000);
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
                }, 5000);
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
    if(req.params.serverIP.indexOf(".") >= 0 && loadedStyles['default'] != null){
        var styleId = req.query.style || 'default';
        if(loadedStyles[styleId] == null){
            styleId = 'default';
        }
        var serverURI = req.params.serverIP.split(":");
        if(serverURI[1] == null) serverURI[1] = 19132;
        mcpebanners(serverURI[0], serverURI[1], loadedStyles[styleId], function (err, buffer) {
            if(err){
                console.log(err);
            }
            res.writeHead(200, {'Content-Type': 'image/png' });
            res.end(buffer, 'binary');
        });
    }
    else {
        next();
    }
});

module.exports = router;

