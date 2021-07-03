'use strict';
const express = require('express');
const path = require('path');
const serverless = require('serverless-http');
const app = express();
var fetch = require("node-fetch")
const $ = require('node-html-parser');

const router = express.Router();
app.get("/api/dic/:word", async (req, res, next) => {
  try {
    var baseurl = 'https://www.rekhta.org/urdudictionary/?keyword='
    var word = req.params.word
    console.log(word);
    var url = encodeURI(baseurl + word)
    const response = await fetch(url);
    const text = await response.text();
    var document = $.parse(text);
    var el = document.querySelector('div.rekhtaDic');
    var msg;
    var data;
    if (el == null) {
      msg = "failed"
      data = "لفظ نہیں ملا۔"
    }
    else {
      msg = "success";
      var arr = [];
      el.querySelectorAll('.rekhtaDicSrchWord').forEach((e, i) => {

        var en = e.querySelector('.dicSrchWord').innerText;
        var hiUr = e.querySelector('.dicSrchMnng').innerText;
        var enMeaning = e.querySelectorAll('p.dicSrchWrdSyno')[0].innerText;
        var hiMeaning = "";
        if (e.querySelectorAll('p.dicSrchWrdSyno')[1])
          hiMeaning = e.querySelectorAll('p.dicSrchWrdSyno')[1].innerText;
        arr[i] = { en, hiUr, enMeaning, hiMeaning };
      });
      console.log(arr);
      data = arr;
    }
    res.json({
      "message": msg,
      "data": data
    })
  }
  catch (err) {
    throw err;
    res.json({
      "message": "failed",
      "data": err
    })
  }
});
app.get("/api/dic2", async (req, res, next) => {
  try {
    var method = req.query.method;
    var word = req.query.word;
    var lang = req.query.lang;
    var id = req.query.id;
    var baseurl = '';
    console.table({ word, lang, method, id });
    switch (method) {
      case 'getWords':
        baseurl = 'https://rekhtadictionary.com/GetWordsSuggestions?q=';
        break;
      case 'briefMeaning':
        baseurl = 'https://rekhtadictionary.com/search?keyword=';
        break;
      case 'compound':
        baseurl = `https://rekhtadictionary.com/compound-words-containing-${id}?keyword=`;
        break;
      case 'idiom':
        baseurl = `https://rekhtadictionary.com/idioms-containing-${id}?keyword=`;
        break;
      case 'detail':
        baseurl = `https://rekhtadictionary.com/meaning-of-${id}?`;
        break;

      default:
        baseurl = 'https://rekhtadictionary.com/search?keyword=';
        break;
    }
    var url = encodeURI(baseurl + word + '&lang=' + lang);
    var msg;
    var data;
    console.log(url);
    const response = await fetch(url);
    if (method == 'getWords') {
      msg = "success";
      data = await response.json();
      // data = JSON.stringify(temp); 
    }
    else {
      console.log("Executing else of getWords. Method:" + method);
      const text = await response.text();
      var document = $.parse(text);
      msg = "success";
      switch (method) {
        case 'briefMeaning':
          var meanings = []
          var el = document.querySelector('.rdSrchResultCrdListng');
          if (el == null) {
            msg = "failed"
            data = "لفظ نہیں ملا۔"
          }
          el.querySelectorAll('.rdWordCard').forEach(e => {
            var w = e.querySelector('h3').innerText;
            var m = e.querySelector('.rdWrdCrdMeaning').innerText.trim();
            var slug = e.id
            meanings.push({ w, slug, m });
          });
          data = meanings;
          break;

        case 'compound':
          var compounds = []
          var more = []
          document.querySelectorAll('.rdWrdRelatedtags a').forEach(l => {
            var slug = l.outerHTML.trim().match(/<a href="\/meaning-of-(.*?)\?/)[1];
            compounds.push({ "w": l.innerText, slug });
          });
          document.querySelectorAll('.relatedWordContent .rdWordCard').forEach(e => {
            var w = e.querySelector('h3').innerText;
            var m = e.querySelector('.rdWrdCrdMeaning').innerText.trim();
            var slug = e.id
            more.push({ w, slug, m });
          });
          data = { compounds, more };
          break;

        case 'idiom':
          var idiom = []
          var more = []
          document.querySelectorAll('.rdSimilarVocub .rdSmWordVocub').forEach(e => {
            var w = e.querySelector('h4').innerText;
            var m = e.querySelector('p').innerText.trim();
            var slug = e.innerHTML.trim().match(/<a href="\/meaning-of-(.*?)\?/)[1];
            idiom.push({ w, slug, m });
          });
          document.querySelectorAll('.relatedWordContent .rdWordCard').forEach(e => {
            var w = e.querySelector('h3').innerText;
            var m = e.querySelector('.rdWrdCrdMeaning').innerText.trim();
            var slug = e.id
            more.push({ w, slug, m });
          });
          data = { compounds, more };
          break;


        case 'detail':
          var arr = [];
          var word = document.querySelector('.rdActiveWordBlock .rdWordDsplyFormat').innerHTML.replace(/[\r?\n ]+/g, ' ');;
          var originAndWazn = document.querySelector('.rdActiveWordBlock .rdbasicWrdDetail').innerHTML.replace(/[\r?\n ]+/g, ' ');;
          if(document.querySelector('.rdActiveWordBlock .rdSmediaIcons .rdWrdAudio a')) var audioId = document.querySelector('.rdActiveWordBlock .rdSmediaIcons .rdWrdAudio a').getAttribute('data-srcId');
          if(audioId) var audio = 'https://www.rekhta.org/Images/SiteImages/DictionaryAudio/' + audioId + '.mp3';
          document.querySelectorAll('.rdWordExpContainer .rdPartsofSpeechContainer').forEach(e => {
            arr.push(e.innerHTML.replace(/[\r?\n ]+/g, ' ').trim());
          });
          data = { "basicInfo": { word, originAndWazn, audio }, "detailArr": arr };
          break;

        default:
          data = 'Parameters are not proper. Check again!';
          break;
      }
    }
    res.json({
      "message": msg,
      "data": data
    })
  }
  catch (err) {
    res.json({
      "message": "failed",
      "data": err
    })
    throw err;
  }
});
app.get("/api/rekhta/:input", async (req, res, next) => {
  try {
    var input = req.params.input
    var url = decodeURIComponent(input)
    console.log(url);
    const response = await fetch(url);
    const text = await response.text();
    var document = $.parse(text);
    var _bookUrl = url;
    var pageContents = document + ''; //or document.head.innerHTML as scripts are only in <head>.
    var bookName = document.querySelector('span.c-book-name').innerText.trim();
    console.log(bookName);
    var author = document.querySelector('span.faded').innerText.replace(/\r?\n/g, '').replace(/ +/g, ' ').replace('by ', '').trim();
    var fileName = `${bookName} by ${author}`.trim().replace(/ +/g, ' ').replace(/ /g, '-');
    //var BookName = actualUrl.toLowerCase().replace("'/ebooks/", "").replace(/-ebooks'/g, '').trim().replace(/\//g, '-');

    var _bookId = FindTextBetween(pageContents, `var bookId = "`, `";`);
    var actualUrl = FindTextBetween(pageContents, "var actualUrl =", ";");

    var _pageCount = parseInt(FindTextBetween(pageContents, "var totalPageCount =", ";").trim());
    var pages = StringToStringArray(FindTextBetween(pageContents, "var pages = [", "];"));
    var pageIds = StringToStringArray(FindTextBetween(pageContents, "var pageIds = [", "];"));
    console.table({ bookName, author, fileName, _bookId, _bookUrl });

    //Fetching parameters
    var scrambledImages = [];
    var keys = [];
    var scrambleMap = [];
    for (var i = 0; i < _pageCount; i++) {
      var imgUrl = `https://ebooksapi.rekhta.org/images/${_bookId}/${pages[i]}`;
      var key = `https://ebooksapi.rekhta.org/api_getebookpagebyid/?pageid=${pageIds[i]}`;
      scrambledImages.push(imgUrl);
      keys.push(key);
      scrambleMap.push({ imgUrl, key });
    }
    var data = { bookName, author, _pageCount, _bookUrl, fileName, _bookId, actualUrl, pages, pageIds, scrambleMap };
    res.json({
      "message": "success",
      data
    })

    function FindTextBetween(source, start, end) {
      return source.split(start)[1].split(end)[0].trim();
    }
    function StringToStringArray(input) {
      return input.split(",").map(item => item.replace(/"/g, "").trim());
    }
  }
  catch (err) {
    throw err;
    res.json({
      "message": "failed",
      "data": err
    })
  }
});
//Root path
app.get("/", (req, res, next) => {
  res.json({ "message": "Ok" })
});
app.get('/another', (req, res) => res.json({ route: req.originalUrl }));
app.post('/', (req, res) => res.json({ postBody: req.body }));

app.use('/.netlify/functions/server', router);  // path must route to lambda
app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

module.exports = app;
module.exports.handler = serverless(app);
