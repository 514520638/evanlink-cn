# EvanLink CN 部署说明

本项目部署到同一台腾讯云服务器：

- 前端：`evanlink-cn`，Vite 构建后的静态文件由 Nginx 托管
- 后端：`evanlink-cn-serve`，Spring Boot jar 由 systemd 托管
- 数据库：MySQL，本机 `127.0.0.1:3306`
- 对外端口：只需要开放 `80`、`443`、`22`

## 1. 本地构建

前端：

```bash
cd /Users/xdf/Desktop/project/evanlink-cn
npm install
npm run build
```

后端：

```bash
cd /Users/xdf/Desktop/project/evanlink-cn-serve
mvn clean package -DskipTests
```

产物：

```text
/Users/xdf/Desktop/project/evanlink-cn/dist/
/Users/xdf/Desktop/project/evanlink-cn-serve/target/evanlink-cn-serve-1.0.0.jar
```

## 2. 服务器初始化

以下命令在腾讯云服务器执行。Ubuntu/Debian 示例：

```bash
apt update
apt install -y nginx mysql-server openjdk-17-jre
systemctl enable nginx
systemctl enable mysql
```

创建目录：

```bash
mkdir -p /var/www/evanlink-cn
mkdir -p /opt/evanlink-cn-serve
```

## 3. 初始化 MySQL

登录 MySQL：

```bash
mysql -uroot -p
```

执行：

```sql
CREATE DATABASE IF NOT EXISTS evanlink_cn
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'evanlink'@'localhost' IDENTIFIED BY '替换成强密码';
GRANT ALL PRIVILEGES ON evanlink_cn.* TO 'evanlink'@'localhost';
FLUSH PRIVILEGES;
```

## 4. 上传产物

以下命令在本地执行，替换服务器 IP：

```bash
scp -r /Users/xdf/Desktop/project/evanlink-cn/dist/* root@服务器公网IP:/var/www/evanlink-cn/
scp /Users/xdf/Desktop/project/evanlink-cn-serve/target/evanlink-cn-serve-1.0.0.jar root@服务器公网IP:/opt/evanlink-cn-serve/app.jar
```

## 5. 配置后端 systemd

在服务器创建：

```bash
vim /etc/systemd/system/evanlink-cn-serve.service
```

内容：

```ini
[Unit]
Description=EvanLink CN Spring Boot API
After=network.target mysql.service

[Service]
WorkingDirectory=/opt/evanlink-cn-serve
ExecStart=/usr/bin/java -jar /opt/evanlink-cn-serve/app.jar
Restart=always
RestartSec=5
Environment=SERVER_PORT=8080
Environment=SPRING_DATASOURCE_URL=jdbc:mysql://127.0.0.1:3306/evanlink_cn?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
Environment=SPRING_DATASOURCE_USERNAME=evanlink
Environment=SPRING_DATASOURCE_PASSWORD=替换成数据库密码
Environment=RESUME_VERIFY_PASSWORD=替换成简历访问密码
Environment=RESUME_URL=替换成简历地址
Environment=APP_LOG_LEVEL=info
Environment=HIBERNATE_SQL_LOG_LEVEL=warn

[Install]
WantedBy=multi-user.target
```

启动：

```bash
systemctl daemon-reload
systemctl enable evanlink-cn-serve
systemctl restart evanlink-cn-serve
systemctl status evanlink-cn-serve
```

查看日志：

```bash
journalctl -u evanlink-cn-serve -f
```

## 6. 配置 Nginx

在服务器创建：

```bash
vim /etc/nginx/conf.d/evanlink-cn.conf
```

内容，替换域名：

```nginx
server {
    listen 80;
    server_name 你的域名.com www.你的域名.com;

    root /var/www/evanlink-cn;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

检查并加载：

```bash
nginx -t
systemctl reload nginx
```

## 7. 域名和 HTTPS

腾讯云控制台：

- 域名解析添加 `A` 记录：`@` 指向服务器公网 IP
- 可选添加 `A` 记录：`www` 指向服务器公网 IP
- 安全组开放 `80`、`443`、`22`
- 不建议对公网开放 `8080`

HTTPS 可用 Certbot：

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d 你的域名.com -d www.你的域名.com
```

## 8. 发布更新

前端更新：

```bash
cd /Users/xdf/Desktop/project/evanlink-cn
npm run build
scp -r dist/* root@服务器公网IP:/var/www/evanlink-cn/
```

后端更新：

```bash
cd /Users/xdf/Desktop/project/evanlink-cn-serve
mvn clean package -DskipTests
scp target/evanlink-cn-serve-1.0.0.jar root@服务器公网IP:/opt/evanlink-cn-serve/app.jar
ssh root@服务器公网IP "systemctl restart evanlink-cn-serve"
```
