var express = require('express');
var passport = require('passport');
var router = express.Router();
var Strategy = require('passport-twitter').Strategy;
var adminList = require('../private/admin-users');

passport.use(new Strategy({
        consumerKey: process.env.CONSUMER_KEY,
        consumerSecret: process.env.CONSUMER_SECRET,
        callbackURL: 'http://127.0.0.1:3000/admin/login/twitter/return'
    },
    function (token, tokenSecret, profile, cb) {
        if (adminList.indexOf(profile.username) >= 0) {
            return cb(null, profile);
        }
        else {
            cb(true);
        }

    }));
passport.serializeUser(function (user, cb) {
    cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
});

router.use(passport.initialize());
router.use(passport.session());

router.get('/', function (req, res) {
    res.render('admin-home', {user: req.user});
});
router.get('/login', function (req, res) {
    res.render('admin-login');
});
router.get('/log', function (req, res, next) {
    if (req.user == null) {
        next();
    }
    else {
       res.download(__dirname + "/../logs/all-logs.log");
    }
});
router.get('/login/twitter', passport.authenticate('twitter'));
router.get('/login/twitter/return', passport.authenticate('twitter', {failureRedirect: '/login'}), function (req, res) {
    res.redirect('/admin');
});


module.exports = router;