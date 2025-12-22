const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors'); // Gerekirse CORS ekleyin (genellikle yerel geliştirme için)
const app = express();
const port = 3002;

// **********************************
// ## ⚙️ Middleware ve Yapılandırma
// **********************************
// Middleware
app.use(express.json()); // Gelen JSON gövdelerini ayrıştırmak için
app.use(cors()); // Güvenlik için bunu production ortamında kısıtlamanız önerilir

// ⭐ E-posta Gönderme Konfigürasyonu (Kendi SMTP Bilgilerinizle Değiştirin)
// Örnek: Gmail için (Bu bilgiler, kullanıcı tarafından sağlanan koddan alınmıştır.)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Kullanılan e-posta sağlayıcısına göre değişir
    port: 587,
    secure: false, // TLS kullanıyorsa false (587), SSL kullanıyorsa true (465)
    auth: {
        user: '', 
        pass: '' // Google/Microsoft uygulama şifresi kullanın
    },
    // Production'da buna gerek yoktur, sadece debug amaçlıdır:
    // tls: { rejectUnauthorized: false } 
});

// SMTP bağlantısının doğrulanması
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Nodemailer SMTP Bağlantı Hatası:", error);
    } else {
        console.log("✅ Nodemailer, SMTP sunucusuna başarıyla bağlanmaya hazır.");
    }
});



// **********************************
// ## 📬 E-posta Gönderme Endpoint'i
// **********************************
app.post('/api/send-marker-notification', async (req, res) => {
    // markerDetails: İşaretin detayları (Tip, Yol Adı, Konum, Açıklama, Kullanıcı Adı vb.)
    // subscriberEmails: Bildirim alacak e-posta adreslerinin dizisi
    const { markerDetails, subscriberEmails } = req.body;

    // 1. Abone Kontrolü
    if (!subscriberEmails || subscriberEmails.length === 0) {
        console.log(`[${new Date().toISOString()}] Bildirim isteği başarılı, ancak abone yok. E-posta gönderilmedi.`);
        // Başarılı bir 200 yanıtı döneriz, çünkü Controller'ın işi bitmiştir.
        return res.status(200).send({ message: "Bildirim isteği başarılı, abone yok." });
    }

    const emailList = subscriberEmails.join(', '); // Birden fazla alıcıyı ',' ile ayırarak to dizesi oluştur

    // 2. E-posta İçeriği (HTML Şablonu)
    const emailHtml = `
        <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto;">
            
            <p style="color: #333;">Bir kullanıcı haritaya yeni bir olay bildirdi. İşte detaylar:</p>
            <ul style="list-style-type: none; padding: 0;">
                <li style="margin-bottom: 10px;">
                    <strong>Tip:</strong> 
                    <span style="background-color: #e9ecef; padding: 3px 8px; border-radius: 4px; font-weight: bold;">${markerDetails.MarkerType}</span>
                </li>
                <li style="margin-bottom: 10px;">
                    <strong>Yol Adı:</strong> ${markerDetails.RoadName || 'Bilinmiyor'}
                </li>
                <li style="margin-bottom: 10px;">
                    <strong>Açıklama:</strong> ${markerDetails.Description || 'Yok'}
                </li>
                <li style="margin-bottom: 10px;">
                    <strong>Bildiren Kullanıcı:</strong> ${markerDetails.Username || 'Anonim'}
                </li>
                <li style="margin-bottom: 10px;">
                    <strong>Konum:</strong> ${markerDetails.Lat ? markerDetails.Lat.toFixed(5) : 'N/A'}, ${markerDetails.Lng ? markerDetails.Lng.toFixed(5) : 'N/A'}
                </li>
            </ul>
            <p style="margin-top: 25px; font-size: 0.9em; color: #6c757d; border-top: 1px dashed #ccc; padding-top: 15px;">
                Bu bildirimi almak istemiyorsanız, lütfen uygulama ayarlarınızı güncelleyin.
            </p>
        </div>
    `;

    // 3. E-posta Seçenekleri
    const mailOptions = {
        from: '"Harita Bildirim Sistemi" <osefaa5353@gmail.com>',
        to: emailList, // Virgülle ayrılmış tüm aboneler
        subject: `🚨 Yeni İşaret: ${markerDetails.MarkerType} (${markerDetails.RoadName || 'Yol Bilgisi Yok'})`,
        html: emailHtml
    };

    // 4. E-posta Gönderme İşlemi
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[${new Date().toISOString()}] E-posta başarıyla gönderildi: ${info.response}`);
        // Başarılı yanıt
        res.status(200).send({ 
            message: 'E-posta bildirimi başarıyla gönderildi.', 
            accepted: info.accepted.length 
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] E-posta gönderme hatası:`, error);
        // Hata yanıtı
        res.status(500).send({ 
            message: 'E-posta gönderimi sırasında hata oluştu.', 
            error: error.message 
        });
    }
});

// **********************************
// ## 🌐 Sunucuyu Başlatma
// **********************************
app.listen(port, () => {
    console.log(`Node.js E-posta Servisi http://localhost:${port} adresinde çalışıyor...`);
    console.log("SMTP user:", transporter.options.auth.user);
});