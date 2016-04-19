var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('faq', {faq: require("../private/faq.js")});
});

module.exports = router;

