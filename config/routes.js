var db = require("../models");

module.exports = function (router) {
    router.get('/', function (req, res) {
        db.Article.find({})
            .then(function (dbArticle) {
                var articlesObj = {
                    articles: dbArticle
                };
                console.log(articlesObj)
                res.render('index', articlesObj);
            })
    });

    router.get('/saved', function (req, res) {
        res.render('saved');
    });

}