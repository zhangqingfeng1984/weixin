# weixin

wx-js-sdk api, v1.

1. 绑定ICP备案域名到AWS主机IP
2. AWS主机80端口用nginx转发到6000端口
3. 在本地使用命令把AWS主机6000端口的数据代理到本地3000端口
 ssh -fCNR 6000:127.0.0.1:3000 ubuntu@54.186.177.166
4. 微信回调AWS主机80端口数据，实际上就调用了本地3000端口 