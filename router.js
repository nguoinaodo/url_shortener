var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var router = express.Router();
var mongoURI = process.env.MONGOLAB_URI;

router.use('/new', function(req, res, next) {
    var str = req.url.substr(1);
    // nếu url hợp lệ thì tạo một short url, lưu trữ dữ liệu bằng mongodb
    // khi truy cập short url thì sẽ được điều hướng đến url ban đầu
    // một url có thể được điều hướng đến bởi các short url khác nhau
    // response dạng json 
    // nếu url không hợp lệ thì response error
    //
    if (!validURL(str)) 
        res.json({error: "Wrong url format."});
    else {
        var count = 0;
        
        MongoClient.connect(mongoURI, function(err, db) {
            if (err) throw err;
            var collection = db.collection('urls');
            collection.find({_id: 1}).toArray(function(err, items) {
                if (err) throw err;
                else {
                    count = items[0].count + 1;
                    collection.insert({original: str, short: count}, function(err) {
                        if (err) throw err;
                        collection.update({_id: 1}, {$set: {count: count}}, function(err) {
                            if (err) throw err;
                            res.json({original_url: str, short_url: 'https://url-shortener-nguoinaodo.herokuapp.com/' + count});
                            db.close();
                        });
                    });
                }
            });
        });
    }
});

router.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/home.html'); 
});

router.use(function(req, res, next) {
    var str = Number(req.url.substr(1));
    
    if (isNaN(str)) 
        res.json({error: "This url is not on the database."});
    else {
        MongoClient.connect(mongoURI, function(err, db) {
            if (err) throw err;
            var collection = db.collection('urls');
            collection.find({_id: 1}).toArray(function(err, items) {
                if (err) throw err;
                var count = items[0].count;
                if (str > count || str < 1) 
                    res.json({error: "This url is not on the database."});
                else {
                    collection.find({short: str}).toArray(function(err, items) {
                        if (err) throw err;
                        res.redirect(items[0].original);
                        db.close();
                    });
                }
            });
        });
    }
});

//////
// validate url
function validURL(str) {
    var ex = /^((http|https|ftp):\/{2})|(\w+:\w+\@)|(www\.)((\w+\.)+\w+)(:\d+)?((\/(\w+)?)+(\?(\w+=\w+\&)*(\w+=\w+)?)?)?/;
    
    if (ex.test(str)) 
        return true;
    return false;
}

module.exports = router;