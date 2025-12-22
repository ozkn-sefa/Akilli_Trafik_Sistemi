// gateway.js
const express = require("express");
const bodyParser = require("body-parser");
const soap = require("soap");
const fs = require("fs");
const path = require("path");
const cors = require('cors');
const axios = require('axios'); 
const { logInfo, logError } = require('./logger-client'); // LOGLAMA

const gatewayApp = express();
const GATEWAY_PORT = 3001; 
const BUSINESS_PROCESS_URL = "http://localhost:3003"; 
const SERVICE_SOURCE = "GATEWAY";

const wsdlPath = path.resolve(__dirname, 'weatherService.wsdl');
const xml = fs.existsSync(wsdlPath) ? fs.readFileSync(wsdlPath, 'utf8') : '';

gatewayApp.use(bodyParser.json());
gatewayApp.use(cors());

const gatewaySoapImplementation = {
    WeatherService: {
        WeatherServicePort: {
            getWeatherByCoords: async function(args, callback) {
                const { lat, lon } = args;
                logInfo(SERVICE_SOURCE, "Yeni SOAP isteği alındı, İş Süreçlerine yönlendiriliyor.", { lat, lon });
                try {
                    const response = await axios.post(`${BUSINESS_PROCESS_URL}/process/weather`, { lat, lon });
                    logInfo(SERVICE_SOURCE, "İş Süreçlerinden SOAP cevabı başarıyla alındı.");
                    return callback({ weatherData: response.data.weatherData });
                } catch (error) {
                    logError(SERVICE_SOURCE, "SOAP isteği İş Süreçlerine yönlendirilemedi.", { error_msg: error.message });
                    return callback({ 
                        Fault: { faultcode: 'Server', faultstring: 'İş Süreçleri Servisine ulaşılamıyor: ' + error.message } 
                    });
                }
            }
        }
    }
};

gatewayApp.post('/traffic/predict', async (req, res) => {
    logInfo(SERVICE_SOURCE, "Yeni REST (Trafik) isteği alındı, yönlendiriliyor.", req.body);
    try {
        const response = await axios.post(`${BUSINESS_PROCESS_URL}/process/traffic`, req.body);
        logInfo(SERVICE_SOURCE, "Trafik İş Süreçlerinden REST cevabı başarıyla alındı.");
        return res.json(response.data);
    } catch (error) {
        logError(SERVICE_SOURCE, "REST isteği İş Süreçlerine yönlendirilemedi.", { error_msg: error.message });
        return res.status(503).json({ 
            message: "Trafik İş Süreçleri Servisine ulaşılamıyor.", 
            error: error.message 
        });
    }
});

gatewayApp.listen(GATEWAY_PORT, function() {
    logInfo(SERVICE_SOURCE, "Gateway Servisi başlatıldı.", { port: GATEWAY_PORT });
    if (xml) {
        soap.listen(gatewayApp, '/wsdl', gatewaySoapImplementation, xml, function() {
            console.log(`\n🚀 API Ağ Geçidi Çalışıyor! (PORT: ${GATEWAY_PORT})`);
        });
    } else {
        console.log(`\n🚀 API Ağ Geçidi Çalışıyor! (PORT: ${GATEWAY_PORT}) (SOAP Kapalı)`);
    }
});