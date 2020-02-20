# weixin

wx-js-sdk api, v1.

1. 绑定ICP备案域名到AWS主机IP
2. AWS主机80端口用nginx转发到6000端口
3. 在本地使用命令把AWS主机6000端口的数据代理到本地3000端口
 ssh -fCNR 6000:127.0.0.1:3000 ubuntu@54.186.177.166
4. 微信回调AWS主机80端口数据，实际上就调用了本地3000端口 


微信网页登录 
https://open.weixin.qq.com/connect/qrconnect?appid=wx02c2165f2397421e&redirect_uri=http://test.traderwork.com/oauth&response_type=code&scope=snsapi_login&state=webapp#wechat_redirect

微信公众号菜单登录 
https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx72d6e52927329755&redirect_uri=http://www.nodejser.xyz/oauth&response_type=code&scope=snsapi_userinfo&state=wechatapp#wechat_redirect

done!
