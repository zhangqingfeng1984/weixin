var path = require('path');
var https = require('https');
var fs = require('fs');
var Q = require('q');
var crypto = require('crypto');
var request = require('sync-request');

const TOKEN_CACHE_FILE = path.join(__dirname, '/cache/token.json');
const JS_SDK_TICKET_CACHE_FILE = path.join(__dirname + '/cache/jsticket.json');
const EXPIRE_RECORD_FILE = path.join(__dirname + '/cache/expire.json');
const EXPIRE_PERIOD = 1000 * 60 * 60 * 2; //2 hour

const APP_CONFIG = {
	webapp:{
		appId: 'wx02c2165f2397421e',
		appsecret: '3f36a27632db82d8f157599906dad343'
	},
	wechatapp: {
		appId: 'wx214ff7e919542dbb',
		appsecret: 'f362f5c830573193d5b419ef129ac231'
	}
}
/**
	Wechat util that help to recetrieve and cache the access_token, js_sdk_ticket.
*/
function Wechat(){
	Object.assign(this, this.defaultOptions);
	this.tokenCreateTime = null;
	this.ticketCreateTime = null;
}

Wechat.prototype = {
	constructor: Wechat,

	defaultOptions: {
		// tradework 公众号
		// appId: 'wx02c2165f2397421e',
		// appsecret: '3f36a27632db82d8f157599906dad343', //test wx account

		// sam 接口测试号
		appId: 'wx72d6e52927329755',
		appsecret: '3c2858a5221be58839ea46926aa2ed7f', //test wx account
	},

	isTokenExpired: function(){
		var tokenCreateTime = this.tokenCreateTime;
		if (tokenCreateTime === null){
			if (!fs.existsSync(EXPIRE_RECORD_FILE)){
				return true;
			}
			var obj = this.readObjectFromFile(EXPIRE_RECORD_FILE);
			tokenCreateTime = Number(obj.token_create_time);
		}
		var timeCollapsed = Date.now() - tokenCreateTime;
		return timeCollapsed > EXPIRE_PERIOD * 0.8;
	},

	isTicketExpired: function(){
		var ticketCreateTime = this.ticketCreateTime;
		if (ticketCreateTime === null){
			if (!fs.existsSync(EXPIRE_RECORD_FILE)){
				return true;
			}
			var obj = this.readObjectFromFile(EXPIRE_RECORD_FILE);
			ticketCreateTime = Number(obj.ticket_create_time);
		}
		var timeCollapsed = Date.now() - ticketCreateTime;
		return timeCollapsed > EXPIRE_PERIOD * 0.8;
	},

	readObjectFromFile: function(path){
		var str = fs.readFileSync(path, {encoding: 'utf8'});
		console.log('read from file: `${path}`');
		var obj = JSON.parse(str);
		return obj;
	},

	writeObjectToFile: function(obj, path){
		console.log(`write to file: ${path} ` + JSON.stringify(obj))
		if (typeof obj === 'string'){
			fs.writeFileSync(path, obj, {encoding:'utf8'});
		}else if (typeof obj === 'object'){
			fs.writeFileSync(path, JSON.stringify(obj), {encoding:'utf8'});
		}
	},

	getConfig: function(app){
		return APP_CONFIG[app];
	},

	/* @return promise of token object */
	getAccessToken: function(){
		var wx = this;
		var appId = this.appId;
		var appsecret = this.appsecret;
		var dfd = Q.defer();
		var url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appsecret}`;
		if (fs.existsSync(TOKEN_CACHE_FILE) && !this.isTokenExpired()){
			var tokenJson = wx.readObjectFromFile(TOKEN_CACHE_FILE)
			console.log('read token from file.')
			console.log(tokenJson);
			dfd.resolve(tokenJson);
		}else{
			https.get(url, function(res){
				res.setEncoding('utf8');
				res.on('data', function(str){
					wx.writeObjectToFile(str, TOKEN_CACHE_FILE);
					var obj = {};
					if (fs.existsSync(EXPIRE_RECORD_FILE)){
						obj = wx.readObjectFromFile(EXPIRE_RECORD_FILE);
					}
					obj.token_create_time = wx.tokenCreateTime = Date.now();
					wx.writeObjectToFile(obj, EXPIRE_RECORD_FILE);
					var tokenJson = JSON.parse(str);
					dfd.resolve(tokenJson)
				});
				res.on('error', function(err){
					console.log(err);
					dfd.reject(err)
				})
			});
		}
		return dfd.promise;
	},

	/* @return promise of token object */
	getWebOauthAccessToken: function(code, app){
		var wx = this;
		var appId = this.getConfig(app).appId;
		var appsecret = this.getConfig(app).appsecret;
		var dfd = Q.defer();
		var url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appsecret}&code=${code}&grant_type=authorization_code`;
		var res = request('GET', url);
		var content = res.getBody('utf8');
		console.log('getWebOauthAccessToken===>'+content);
		return JSON.parse(content);
	},

		/* @return promise of token object */
	getUserInfo: function(webAccessToken, openid, lang='zh_CN'){
		var wx = this;
		var appId = this.appId;
		var appsecret = this.appsecret;
		var dfd = Q.defer();
		var url = `https://api.weixin.qq.com/sns/userinfo?access_token=${webAccessToken}&openid=${openid}&lang=${lang}`;
		var res = request('GET', url);
		var content = res.getBody('utf8');
		console.log('getUserInfo===>'+content);
		return JSON.parse(content);
	},

	/* @return promise of ticket object */
	getJsSdkTicket: function(){
		var wx = this;
		var dfd = Q.defer();

		this.getAccessToken().then(function(tokenJson){
			var token = tokenJson.access_token;
			console.log(`Token: ${token}`);
			
			if (fs.existsSync(JS_SDK_TICKET_CACHE_FILE) && !wx.isTicketExpired()){
				var ticketJson = wx.readObjectFromFile(JS_SDK_TICKET_CACHE_FILE);
				console.log('read ticket from file')
				dfd.resolve(ticketJson);
			}else{
				var url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`;
				https.get(url, function(res){
					res.setEncoding('utf8');
					res.on('data', function(str){
						wx.writeObjectToFile(str, JS_SDK_TICKET_CACHE_FILE);
						var obj = {};
						if (fs.existsSync(EXPIRE_RECORD_FILE)){
							obj = wx.readObjectFromFile(EXPIRE_RECORD_FILE);
						}
						obj.ticket_create_time = wx.ticketCreateTime = Date.now();
						wx.writeObjectToFile(obj, EXPIRE_RECORD_FILE);
						var ticketJson = JSON.parse(str);
						dfd.resolve(ticketJson)
					});
					res.on('error', function(err){
						dfd.reject(err);
					})
				})
			}
		})
		
		return dfd.promise;
	},

	/* @return promise of weixin jssdk config object */
	generateJsSdkConfig: function(pageUrl){
		var wx = this;
		var dfd = Q.defer();
		this.getJsSdkTicket().then(function(ticketJson){
			var jsapi_ticket = ticketJson.ticket;
			var timestamp = 1024;
			var url = pageUrl;
			var nonce = 'aa';

			var s = `jsapi_ticket=${jsapi_ticket}&noncestr=${nonce}&timestamp=${timestamp}&url=${url}`;
			var signature = sha1(s);

			var config = {
				debug: true,
				appId: wx.appId,
				timestamp: timestamp,
				nonceStr: nonce,
				signature: signature,
				jsApiList:[
					'checkJsApi',
					'onMenuShareTimeline',
					'onMenuShareAppMessage',
					'chooseImage',
					'previewImage',
					'uploadImage',
					'downloadImage',
					'scanQRCode'
				]
			}

			dfd.resolve(config);
		}, function(err){
			dfd.reject(err);
		});

		return dfd.promise;
	}
}

function sha1(str){
	var md5 = crypto.createHash('sha1');
	md5.update(str);
	var result = md5.digest('hex');
	return result;
}

var wx = new Wechat();

module.exports = wx;
