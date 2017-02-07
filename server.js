var port = 3000;
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

var app = express();
app.use(express.static(__dirname+'/public'));
//app.use(logResponseBody); //loging response body data
app.use(xmlparser());
app.use(bodyParser.json());

app.get('/post', function(req, res){
	console.log('receive get request');
	res.end('done get on local server')
})
app.post('/post', function(req, res){
	console.log('receive post request')
	console.log(req.body.name)
	res.end('done post')
});

app.get('/oauth', function(req, res){
	var code = req.query.code;
	if (code){
		console.log('code:'+req.query.code);
		var webOauthAccessTokenResult = wx.getWebOauthAccessToken(code);
		var userInfoResult = wx.getUserInfo(webOauthAccessTokenResult.access_token, webOauthAccessTokenResult.openid);
		console.log('webOauthAccessTokenResult:'+JSON.stringify(webOauthAccessTokenResult))
		console.log('userInfoResult:'+JSON.stringify(userInfoResult))
		console.log('oauth done')
		res.end(JSON.stringify(userInfoResult));
	}
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

app.post('/weixin/sdkconfig', function(req, res){
	var pageUrl = req.body.pageUrl;
	console.log(pageUrl);
	wx.generateJsSdkConfig(pageUrl).then(function(config){
		res.json(config)
	})
});

app.get('/weixin', function(req, res){
	console.log('receive wx GET request...');
	var signature = req.query.signature;
	var timestamp = req.query.timestamp;
	var echostr = req.query.echostr;
	var nonce = req.query.nonce;
	console.log('receive from wx:' + JSON.stringify(req.query));
	res.send(echostr);
});

app.post('/weixin', function(req, res){
	console.log('receive wx POST request...');
	console.log(req.rawBody);
	var message = req.body.xml || {};
	var fromUserName = message.fromusername[0];
	var toUserName = message.tousername[0];
	
	var responseXML = "";
	switch (message.msgtype[0]) {
		case 'text': {
			var content = message.content[0];
			responseXML =  "<xml>" +
			 "<ToUserName><![CDATA["+fromUserName+"]]></ToUserName>"+
			 "<FromUserName><![CDATA["+toUserName+"]]></FromUserName>"+
			 "<CreateTime>1456507336080</CreateTime>"+
			 "<MsgType><![CDATA[text]]></MsgType>"+
			 "<Content><![CDATA[你输入了文本:"+content+", 要不你发个图片我看看？]]></Content>"+
			 "<MsgId>2</MsgId>"+
			 "</xml>";
			break;
		}
		case 'image': {
			responseXML =  "<xml>" +
			 "<ToUserName><![CDATA["+fromUserName+"]]></ToUserName>"+
			 "<FromUserName><![CDATA["+toUserName+"]]></FromUserName>"+
			 "<CreateTime>1456507336080</CreateTime>"+
			 "<MsgType><![CDATA[text]]></MsgType>"+
			 "<Content><![CDATA[你的图片不错额，要不你和我说句话？长按语音按钮。。。]]></Content>"+
			 "<MsgId>3</MsgId>"+
			 "</xml>";
			 break;
		}
		case 'voice': {
			responseXML =  "<xml>" +
			 "<ToUserName><![CDATA["+fromUserName+"]]></ToUserName>"+
			 "<FromUserName><![CDATA["+toUserName+"]]></FromUserName>"+
			 "<CreateTime>1456507336080</CreateTime>"+
			 "<MsgType><![CDATA[text]]></MsgType>"+
			 "<Content><![CDATA[我听不懂你在说什么。。。等爸爸（sam）教会我，我再回复你吧]]></Content>"+
			 "<MsgId>4</MsgId>"+
			 "</xml>";
			 break;
		}

	}

	res.send(responseXML)
})
app.listen(port);
console.log(`express start at ${port}`);
