// weather-service.js
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require('cors');
const { logInfo, logError } = require('./logger-client'); // LOGLAMA

const weatherApp = express();
const WEATHER_SERVICE_PORT = 3004; 
const SERVICE_SOURCE = "WEATHER_SERVICE";

// Harici API Ayarları (Aynı Kaldı)
const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_PARAMS = "current_weather=true&timezone=Europe%2FIstanbul";
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/reverse";
const NOMINATIM_PARAMS = "format=json&addressdetails=1";
const NOMINATIM_HEADERS = { 'User-Agent': 'Node.js/Express Weather Service' };

// WMO Hava Durumu Kodu Haritalaması (Aynı Kaldı)
const wmoToTurkish = {
    0: "Açık", 1: "Çoğunlukla Açık", 2: "Parçalı Bulutlu", 3: "Bulutlu", 45: "Sisli", 
    48: "Kırağı Olan Sis", 51: "Çiseleyen Hafif Yağmur", 53: "Çiseleyen Orta Yağmur", 
    55: "Çiseleyen Yoğun Yağmur", 56: "Hafif Dondurucu Çisenti", 57: "Yoğun Dondurucu Çisenti", 
    61: "Hafif Yağmur", 63: "Orta Şiddette Yağmur", 65: "Yoğun Yağmur", 66: "Hafif Dondurucu Yağmur", 
    67: "Yoğun Dondurucu Yağmur", 71: "Hafif Kar Yağışı", 73: "Orta Şiddette Kar Yağışı", 
    75: "Yoğun Kar Yağışı", 77: "Kar Taneleri", 80: "Hafif Sağanak Yağmur", 
    81: "Orta Sağanak Yağmur", 82: "Şiddetli Sağanak Yağmur", 85: "Hafif Kar Sağanağı", 
    86: "Yoğun Kar Sağanağı", 95: "Hafif/Orta Fırtına", 96: "Hafif Dolu ile Fırtına", 
    99: "Yoğun Dolu ile Fırtına"
};
function getWeatherDescription(code) { return wmoToTurkish[code] || "Bilinmeyen Durum"; }

weatherApp.use(bodyParser.json());
weatherApp.use(cors());

// Hava Durumu Hizmeti Endpoint'i
weatherApp.post('/api/get-weather', async (req, res) => {
    const { lat, lon } = req.body;
    const latitude = parseFloat(lat.replace(",", "."));
    const longitude = parseFloat(lon.replace(",", "."));

    if (isNaN(latitude) || isNaN(longitude)) {
        logError(SERVICE_SOURCE, "Gelen koordinatlar geçerli değil.", req.body);
        return res.status(400).json({ message: "lat ve lon geçerli sayılar olmalı." });
    }

    const weatherUrl = `${OPEN_METEO_BASE_URL}?latitude=${latitude}&longitude=${longitude}&${OPEN_METEO_PARAMS}`;
    const geoUrl = `${NOMINATIM_BASE_URL}?lat=${latitude}&lon=${longitude}&${NOMINATIM_PARAMS}`;
    
    logInfo(SERVICE_SOURCE, "Harici API çağrıları başlatılıyor.", { lat, lon });
    
    try {
        const [weatherRes, geoRes] = await Promise.all([
            axios.get(weatherUrl),
            axios.get(geoUrl, { headers: NOMINATIM_HEADERS })
        ]);

        // ... (Veri işleme ve dönüşüm kodları) ...
        let currentWeather = weatherRes.data.current_weather;
        
        // 🚨 ANLIK ZAMANI ÇEKME VE FORMATLAMA
        const turkishTime = new Date().toTimeString().slice(0, 5);

        const address = geoRes.data.address || {};
        const description = getWeatherDescription(currentWeather.weathercode); 
        
        const weatherData = {
            temperature: currentWeather.temperature.toString(),
            windspeed: currentWeather.windspeed.toString(),
            winddirection: currentWeather.winddirection.toString(),
            description: description, 
            city: address.city || address.town || "",
            country: address.country || "",
            // 🆕 turkishTime değişkenini yanıta ekledik
            time: turkishTime 
        };
        
        logInfo(SERVICE_SOURCE, "Harici API verileri başarıyla çekildi ve işlendi.", { city: weatherData.city });
        return res.json({ weatherData });

    } catch (err) {
        logError(SERVICE_SOURCE, "Harici Hava Durumu/Coğrafi API çağrısı başarısız oldu.", { error_msg: err.message, status: err.response ? err.response.status : 'N/A' });
        return res.status(500).json({ message: 'Harici API isteği başarısız: ' + err.message });
    }
});

weatherApp.listen(WEATHER_SERVICE_PORT, () => {
    console.log(`\n⚙️ Hava Durumu Hizmet Servisi Çalışıyor! (PORT: ${WEATHER_SERVICE_PORT})`);
    logInfo(SERVICE_SOURCE, "Hava Durumu Hizmet Servisi başlatıldı.", { port: WEATHER_SERVICE_PORT });
});