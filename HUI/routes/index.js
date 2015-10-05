var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    var sess = req.session;
    res.render('index', { title: 'HUI' });
    if(sess.userId){
        res.end('done');
    }
});

module.exports = router;