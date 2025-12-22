@echo off
ECHO Windows Mikroservisleri Başlatılıyor...
ECHO Lütfen her pencerenin kapanmasını engellemek için kodunuzun döngüde kaldığından emin olun.
ECHO.

REM --- 2. NODE.JS GATEWAY SERVİSİ - (HTTP API Giriş Noktası)
start "2. NODE.JS GATEWAY (HTTP)" cmd /k node grpc-ml.js

REM --- 2. NODE.JS GATEWAY SERVİSİ - (HTTP API Giriş Noktası)
start "2. NODE.JS GATEWAY (HTTP)" cmd /k node gateway.js

REM --- 3. NODE.JS BUSINESS PROCESS SERVİSİ
start "3. NODE.JS BUSINESS PROCESS" cmd /k node business-process.js

REM --- 4. NODE.JS EMAIL SERVİSİ
start "4. NODE.JS EMAIL SERVICE" cmd /k node email-service.js

REM --- 5. NODE.JS LOGGING SERVİSİ
start "5. NODE.JS LOGGING SERVICE" cmd /k node logging-service.js

REM --- 7. NODE.JS TRAFFIC SERVICE (Muhtemelen Client/Client Logic)
start "7. NODE.JS TRAFFIC SERVICE" cmd /k node traffic-service.js

REM --- 8. NODE.JS WEATHER SERVİSİ
start "8. NODE.JS WEATHER SERVICE" cmd /k node weather-service.js

ECHO.
ECHO Tüm servisler ayrı CMD pencerelerinde başlatıldı.