// logging-service.js
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const loggingApp = express();
const LOGGING_PORT = 3007;

// ANA LOG KLASÖRÜ
const LOGS_DIR = path.join(__dirname, 'logs');

loggingApp.use(bodyParser.json());

// Log klasörünün varlığını kontrol eden yardımcı fonksiyon
function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    // Klasör zincirini rekürsif olarak oluşturur
    fs.mkdirSync(dirname, { recursive: true });
}

/**
 * Fonksiyon: Mevcut tarihi YYYY-MM-DD formatında döndürür.
 */
function getCurrentDateString() {
    const now = new Date();
    // Zaman dilimi farklılıklarını minimize etmek için ISO string'den sadece tarihi alır
    return now.toISOString().slice(0, 10); // "2025-12-04"
}

/**
 * Fonksiyon: Kaynak adına, düzeye ve tarihe göre dinamik dosya yolunu döndürür.
 * Örn: source="TRAFFIC_SERVICE", level="ERROR" -> "logs/traffic_service/error/2025-12-04.log"
 */
function getLogFilePath(source, level) {
    // 1. Servis Klasörü: traffic_service
    const serviceFolderName = source.toLowerCase().replace(/(_service|_app)$/, '');
    
    // 2. Düzey Klasörü: error
    const levelFolderName = level.toLowerCase();
    
    // 3. Dosya Adı: 2025-12-04.log
    const logFileName = `${getCurrentDateString()}.log`;

    // 4. Tam yolu birleştir
    return path.join(LOGS_DIR, serviceFolderName, levelFolderName, logFileName);
}


/**
 * REST Endpoint: Diğer servislerden log mesajlarını kabul eder.
 * @method POST
 * @route /api/log
 */
loggingApp.post('/api/log', (req, res) => {
    const { level, source, message, details } = req.body;
    
    if (!level || !source || !message) {
        return res.status(400).send({ message: "Eksik log parametresi." });
    }

    const logEntry = {
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(), 
        source: source,             
        message: message,
        details: details || {}
    };

    const logString = JSON.stringify(logEntry) + '\n';
    
    // DİNAMİK LOG DOSYASI YOLUNU BELİRLE VE KLASÖR ZİNCİRİNİ OLUŞTUR
    const logFilePath = getLogFilePath(source, level);
    
    ensureDirectoryExistence(logFilePath); // /logs/traffic_service/error/ klasörünü oluşturur

    // Log dosyasını append modunda ilgili yola yaz
    fs.appendFile(logFilePath, logString, (err) => {
        if (err) {
            console.error("Log dosyasına yazarken KRİTİK HATA oluştu:", err);
            return res.status(200).send({ message: "Log başarıyla alındı, ancak diske yazılırken hata oluştu." });
        }
        console.log(`[LOG ${logEntry.level}] ${logEntry.source} -> Kaydedildi: ${logFilePath}`);
        res.status(200).send({ message: "Log başarıyla alındı ve diske yazıldı." });
    });
});

// Servisi Başlat
loggingApp.listen(LOGGING_PORT, () => {
    console.log(`\n======================================================`);
    console.log(`✍️ Loglama Hizmet Servisi Çalışıyor! (PORT: ${LOGGING_PORT})`);
    console.log(`Loglar '/logs/[servis]/[duzey]/[tarih].log' formatında kaydediliyor.`);
    console.log(`======================================================\n`);
});