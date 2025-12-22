// business-process.js
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require('cors');
const { logInfo, logError } = require('./logger-client'); // LOGLAMA

const businessApp = express();
const BUSINESS_PROCESS_PORT = 3003; 
const WEATHER_SERVICE_URL = "http://localhost:3004";
const TRAFFIC_SERVICE_URL = "http://localhost:3005";
const SERVICE_SOURCE = "BUSINESS_PROCESS";

businessApp.use(bodyParser.json());
businessApp.use(cors());

// Hava Durumu İş Süreci
businessApp.post('/process/weather', async (req, res) => {
    const { lat, lon } = req.body;
    
    if (!lat || !lon) {
        logError(SERVICE_SOURCE, "Hava durumu isteğinde eksik parametre.", req.body);
        return res.status(400).json({ message: "lat ve lon gerekli." });
    }
    
    logInfo(SERVICE_SOURCE, "Hava durumu orkestrasyonu başladı.", req.body);
    
    try {
        const response = await axios.post(`${WEATHER_SERVICE_URL}/api/get-weather`, { lat, lon });
        logInfo(SERVICE_SOURCE, "Hava durumu bilgisi başarıyla alındı.", { status: response.status });
        return res.json(response.data);
    } catch (error) {
        logError(SERVICE_SOURCE, "Hava Durumu Hizmet Servisine ulaşılamadı.", { 
            url: WEATHER_SERVICE_URL, 
            error_msg: error.message 
        });
        return res.status(503).json({ 
            message: "Hava Durumu Hizmet Servisine ulaşılamıyor.", 
            error: error.message 
        });
    }
});

// Trafik Tahmini İş Süreci
businessApp.post('/process/traffic', async (req, res) => {
    const { startLat, startLng, endLat, endLng } = req.body;
    
    if (!startLat || !startLng || !endLat || !endLng) {
        logError(SERVICE_SOURCE, "Trafik isteğinde eksik koordinat bilgisi.", req.body);
        return res.status(400).json({ message: "Eksik koordinat bilgisi." });
    }
    
    logInfo(SERVICE_SOURCE, "Trafik tahmini orkestrasyonu başladı.", req.body);
    
    try {
        const response = await axios.post(`${TRAFFIC_SERVICE_URL}/api/predict-traffic`, req.body);
        logInfo(SERVICE_SOURCE, "Trafik tahmini sonucu başarıyla alındı.", { status: response.status });
        return res.json(response.data);
    } catch (error) {
        logError(SERVICE_SOURCE, "Trafik Hizmet Servisine ulaşılamadı.", { 
            url: TRAFFIC_SERVICE_URL, 
            error_msg: error.message 
        });
        return res.status(503).json({ 
            message: "Trafik Hizmet Servisine ulaşılamıyor.", 
            error: error.message 
        });
    }
});

businessApp.listen(BUSINESS_PROCESS_PORT, () => {
    console.log(`\n🏭 İş Süreçleri Servisi Çalışıyor! (PORT: ${BUSINESS_PROCESS_PORT})`);
    logInfo(SERVICE_SOURCE, "İş Süreçleri Servisi başlatıldı.", { port: BUSINESS_PROCESS_PORT });
});