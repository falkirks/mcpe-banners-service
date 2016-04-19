var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var logger = require("./utils/logger");
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();
logger.debug("Overriding 'Express' logger");
app.use(require('morgan')("combined", { stream: logger.stream }));

logger.debug("Registering view engine");
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

logger.debug("Registering middleware");
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('express-session')({secret: 'keyboard cat', resave: true, saveUninitialized: true}));

app.use('/', require('./routes/index'));
app.use('/faq', require('./routes/faq'));
app.use('/generate', require('./routes/generate'));

var banners = require('./routes/banners');
app.use('/', banners);
app.use('/img', banners);
//app.use('/admin', require('./routes/admin'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
