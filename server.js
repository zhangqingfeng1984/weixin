var port = 8080;
var host = 'localhost';
var http = require('http');
var url = require('url');
var querystring = require('querystring');
var https = require('https');

var express = require('express');
var bodyParser = require('body-parser');
var xmlparser = require('express-xml-bodyparser');
var wx = require('./wechat');

function logResponseBody(req, res, next) {
  var oldWrite = res.write,
      oldEnd = res.end;

  var chunks = [];

  res.write = function (chunk) {
  	
    chunks.push(new Buffer(chunk));

    oldWrite.apply(res, arguments);
  };

  res.end = function (chunk) {
    if (chunk)
      chunks.push(new Buffer(chunk));

    var body = Buffer.concat(chunks).toString('utf8');
    console.log(req.path, body);

    oldEnd.apply(res, arguments);
  };

  next();
}

function logRequest(req){
	var chunk = '';
	req.on('data', function(data){
		console.log('on req data ' + data)
		chunk += data;
	})
	req.on('end', function(){
		console.log('on req end')
		console.log(chunk)
	})
}

var app = express();
app.use(express.static(__dirname+'/public'));
//app.use(logResponseBody); //loging response body data
app.use(xmlparser());

app.get('/post', function(req, res){
	console.log('receive get request');
	res.end('done get')
})
app.post('/post', function(req, res){
	console.log('receive post request')
	
	res.end('done post')
});

app.get('/weixin/token', function(req, res){
	wx.getAccessToken().then(function(token){
		res.json(token);
	})
});

app.get('/weixin/ticket', function(req, res){
	wx.getJsSdkTicket().then(function(ticket){
		res.json(ticket);
	})
});

app.get('/weixin/sdkconfig', function(req, res){
	wx.generateJsSdkConfig().then(function(config){
		res.json(config)
	})
});
app.get('/weixin', function(req, res){
	console.log('receive wx GET request...');
	logRequest(req);
	var signature = req.query.signature;
	var timestamp = req.query.timestamp;
	var echostr = req.query.echostr;
	var nonce = req.query.nonce;
	console.log('receive from wx:' + req.query);
	res.send(echostr);
});
app.post('/weixin', function(req, res){
	console.log('receive wx POST request...');
	console.log(req.rawBody);


	var responseXML = "";
	// var message = req.body.xml || {};
	// var fromUserName = message.fromusername[0];
	// var toUserName = message.tousername[0];
	// var content = message.content[0];
	// if (content == '1'){
	// 	responseXML =  "<xml>" +
	// 		 "<ToUserName><![CDATA["+fromUserName+"]]></ToUserName>"+
	// 		 "<FromUserName><![CDATA["+toUserName+"]]></FromUserName>"+
	// 		 "<CreateTime>1456507336080</CreateTime>"+
	// 		 "<MsgType><![CDATA[text]]></MsgType>"+
	// 		 "<Content><![CDATA[this is a test, 1]]></Content>"+
	// 		 "<MsgId>2</MsgId>"+
	// 		 "</xml>";
	// }else if (content == "2"){
	// 	responseXML =  "<xml>" +
	// 		 "<ToUserName><![CDATA["+fromUserName+"]]></ToUserName>"+
	// 		 "<FromUserName><![CDATA["+toUserName+"]]></FromUserName>"+
	// 		 "<CreateTime>1456507336080</CreateTime>"+
	// 		 "<MsgType><![CDATA[text]]></MsgType>"+
	// 		 "<Content><![CDATA[Meng da Meng haha, 2]]></Content>"+
	// 		 "<MsgId>3</MsgId>"+
	// 		 "</xml>";
	// }
	
	res.send(responseXML)
})
app.listen(8080);
console.log('express start at 8080');