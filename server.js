var express = require('express');
var logger = require('morgan');
var mongoose = require('mongoose');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');

var axios = require('axios');
var cheerio = require('cheerio');

var db = require('./models');
var PORT = process.env.PORT || 3000;
var app = express();

var router = express.Router();

// Require our routes file pass our router object
require('./config/routes')(router);

app.use(logger('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname + '/public'));

app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({ extended: false }));

app.use(router);

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost:27017/newsdb", { useNewUrlParser: true });


app.get('/scrape', function (req, res) {
    axios.get('https://www.crunchyroll.com/news').then(function (response) {
        var $ = cheerio.load(response.data);

        $('.news-item').each(function (i, element) {
            var results = {};


            results.title = $(this)
                .find('h2')
                .text()
                .replace(/\s\s+/g, '');

            results.link = $(this)
                .find('a')
                .attr('href');

            results.summary = $(this)
                .find('.short')
                .text();

            // console.log(title, link, date)
            db.Article.create(results)
                .then(function (dbArticle) {
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    console.log(err)
                });
        });
    });
    res.send('Scrape Complete!');
});

app.get('/articles', function (req, res) {
    db.Article.find({})
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.get('/articles/:id', function (req, res) {
    db.Article.findOne({ _id: req.params.id })
        .populate('comment')
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.post('/articles/:id', function (req, res) {
    db.Comment.create(req.body)
        .then(function (dbComment) {
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { comment: dbComment._id }, { new: true });
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
