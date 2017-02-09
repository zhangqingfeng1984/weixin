# weixin

wx-js-sdk api, v1.

1. 绑定ICP备案域名到AWS主机IP
2. AWS主机80端口用nginx转发到6000端口
3. 在本地使用命令把AWS主机6000端口的数据代理到本地3000端口
 ssh -fCNR 6000:127.0.0.1:3000 ubuntu@54.186.177.166
4. 微信回调AWS主机80端口数据，实际上就调用了本地3000端口 


OAuth2.0 get code: https://open.weixin.qq.com/connect/qrconnect?appid=wx02c2165f2397421e&redirect_uri=http://test.traderwork.com/oauth&response_type=code&scope=snsapi_login&state=1#wechat_redirect
Get Access Token: https://api.weixin.qq.com/sns/oauth2/access_token?appid=wx02c2165f2397421e&secret=3f36a27632db82d8f157599906dad343&code=001Zd2fe1fIWtv0YZFde1uZ1fe1Zd2ff&grant_type=authorization_code
https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx214ff7e919542dbb&redirect_uri=http://test.traderwork.com/oauth&response_type=code&scope=snsapi_userinfo&state=1#wechat_redirect
http://test.traderwork.com/oauth?code=001Zd2fe1fIWtv0YZFde1uZ1fe1Zd2ff&state=1