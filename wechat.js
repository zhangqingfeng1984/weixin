var path = require('path');
var https = require('https');
var fs = require('fs');
var Q = require('q');
var crypto = require('crypto');

const TOKEN_CACHE_FILE = path.join(__dirname, '/cache/token.json');
const JS_SDK_TICKET_CACHE_FILE = path.join(__dirname + '/cache/jsticket.json');
const EXPIRE_RECORD_FILE = path.join(__dirname + '/cache/expire.json');
const EXPIRE_PERIOD = 1000 * 60 * 60 * 2; //2 hour

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
		appId: 'wx214ff7e919542dbb',
		appsecret: 'f362f5c830573193d5b419ef129ac231', //test wx account

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
	generateJsSdkConfig: function(){
		var wx = this;
		var dfd = Q.defer();
		this.getJsSdkTicket().then(function(ticketJson){
			var jsapi_ticket = ticketJson.ticket;
			var timestamp = 1024;
			var url = 'http://qz23087.ngrok.natapp.cn/index.html';
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
					'previewImage'
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