# nezha监控面板V1 版美化

详见 <https://svr.czl.net>

1. 调整了首页的查看面板
2. 隐藏登录按钮
3. 可以把面板和nezha容器放到不同的服务器

## 使用方法1

1. 下载, `npm install --force`, 然后打包 `npm run build`
2. 把打包后的文件放到网站根目录

## 使用方法2

从Release下载文件, 解压到网站根目录

## fork项目

1. fork后可以修改名称和logo等信息
2. 改完自行打包


## 设置反代

网站设置一个api反代, nginx配置大概如下:

```nginx
location ^~ /api {
    proxy_pass http://部署面板的ip:端口;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header REMOTE-HOST $remote_addr;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $http_connection;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    add_header X-Cache $upstream_cache_status;
    add_header Cache-Control no-cache;
    proxy_ssl_server_name off;
    proxy_ssl_name $proxy_host;
    add_header Strict-Transport-Security "max-age=31536000";
}
```


然后就可以了.
