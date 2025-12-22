// logger-client.js
const axios = require('axios');

// Loglama Servisi'nin adresi ve endpoint'i
const LOGGING_SERVICE_URL = "http://localhost:3007/api/log";

/**
 * Loglama Hizmetine asenkron HTTP POST çağrısı yapan ana fonksiyon.
 * Çağrı başarısız olsa bile, ana uygulama akışını kesintiye uğratmaz.
 *
 * @param {string} level - Log seviyesi (INFO, WARN, ERROR)
 * @param {string} source - Logu gönderen servisin adı (Örn: "GATEWAY", "TRAFFIC_SERVICE")
 * @param {string} message - Kısa açıklayıcı mesaj
 * @param {object} details - JSON formatında ekstra detaylar (hata objesi, HTTP kodu vb.)
 */
async function sendLog(level, source, message, details = {}) {
    try {
        await axios.post(LOGGING_SERVICE_URL, {
            level: level,
            source: source,
            message: message,
            details: details
        });
        
        // Loglama başarılı oldu, ancak merkezi olduğu için konsola yazmaya gerek yok.
    } catch (error) {
        // KRİTİK HATA: Eğer loglama hizmeti bile çalışmıyorsa, sadece yerel konsola yaz.
        console.error(
            `[LOGGING CRITICAL FAILURE] Loglama Servisine ulaşılamadı. Mesaj: ${message} - Hata: ${error.message}`,
            { level, source }
        );
    }
}

/**
 * Diğer servislerin kullanacağı kolay arayüz (public methods)
 */
module.exports = {
    /** Bilgilendirme amaçlı loglar (Başarılı işlemler, başlangıçlar) */
    logInfo: (source, message, details) => sendLog('INFO', source, message, details),

    /** Potansiyel sorunları veya beklenmeyen durumları kaydeder */
    logWarn: (source, message, details) => sendLog('WARN', source, message, details),
    
    /** Uygulama akışını bozan, çözülmesi gereken ciddi hataları kaydeder */
    logError: (source, message, details) => sendLog('ERROR', source, message, details),
};