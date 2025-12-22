Akıllı Trafik Yönetim ve Şehir Bilgi Sistemi
Bu proje, İstanbul özelinde gerçek zamanlı trafik tahmini, hava durumu entegrasyonu, topluluk tabanlı olay bildirimi ve interaktif rota planlama sunan çok katmanlı bir akıllı şehir uygulamasıdır. Geleneksel sistemlerden farklı olarak, makine öğrenmesi modellerini kullanarak daha isabetli varış süresi tahminleri sunar.


Projenin Amacı
Projenin temel amacı, yol adımlarına göre özel olarak eğitilmiş makine öğrenmesi modelleri aracılığıyla trafik yoğunluğunu analiz etmek ve kullanıcılar için en doğru varış sürelerini hesaplamaktır. Ayrıca, kullanıcıların harita üzerinden kaza, yol çalışması gibi olayları bildirmesine olanak tanıyarak topluluk tabanlı bir trafik bilgi ağı oluşturmayı hedefler.


Öne Çıkan Özellikler

Makine Öğrenmesi Destekli Tahmin: OSRM verilerini Random Forest algoritması ile işleyerek, haftanın günü ve günün saatine göre optimize edilmiş hız ve varış süresi tahminleri sunar.


İnteraktif Olay Bildirimi: Kullanıcılar harita üzerinde kaza, yoğunluk, radar, yol çalışması, bozuk yol, kaygan yol ve kapalı yol gibi 7 farklı tipte işaretleyici oluşturabilir.


Anlık Bildirim Sistemi: Yeni bir trafik olayı bildirildiğinde, ilgili bölgeye abone olan kullanıcılara Node.js tabanlı servis üzerinden otomatik e-posta gönderilir.


Hava Durumu Entegrasyonu: Koordinat bazlı hava durumu verileri SOAP ve REST protokolleri aracılığıyla çekilerek trafik tahminlerine ve kullanıcı dashboard ekranına dahil edilir.


Rota Geçmişi: Kullanıcılar sorguladıkları son 50 rotayı, tahmini süreleri ve o anki hava koşullarını geçmiş sayfasından görsel olarak inceleyebilir.


İstanbul Odaklı Validasyon: İşaretleyicilerin sadece İstanbul sınırları içinde eklenmesini sağlayan koordinat doğrulama mekanizmasına sahiptir.

Teknik Mimari
Proje, yüksek ölçeklenebilirlik ve servis bağımsızlığı için mikroservis mimarisi üzerine inşa edilmiştir.

Arka Yüz (Backend)

ASP.NET Core 8 MVC: Ana uygulama katmanı, kullanıcı yönetimi, oturum kontrolü ve veritabanı orkestrasyonu.


Node.js & Express: API Gateway, E-posta bildirim servisi ve merkezi loglama servisi.


Haberleşme: Servisler arası iletişimde REST, gRPC ve SOAP protokolleri kullanılır.


Entity Framework Core: Veritabanı yönetimi ve Repository Pattern uygulaması.

Yapay Zeka ve Makine Öğrenmesi

Python: Scikit-Learn kütüphanesi kullanılarak Random Forest regresyon modeli eğitilmiştir.



Pandas: Veri işleme ve özellik türetme (Hafta durumu, zaman dilimi vb.) işlemleri için kullanılır.



OSRM (Open Source Routing Machine): Temel yol ağı ve mesafe verilerinin alınması için entegre edilmiştir.

Veritabanı (MySQL)

Stored Procedures: Karmaşık kayıt işlemlerini (Rota ve Hava durumu kaydı gibi) optimize etmek için kullanılır.


Database Views: Profil özetleri ve son olaylar gibi verilerin hızlı çekilmesi için optimize edilmiştir.


Functions: Toplam işaret sayısı gibi hesaplamalar veritabanı seviyesinde fonksiyonlar ile yapılır.

Ön Yüz (Frontend)

Razor Views & Bootstrap 5: Modern ve duyarlı kullanıcı arayüzü.


Leaflet.js: İnteraktif harita yönetimi, işaretleyici ekleme ve rota çizimi.

Kullanılan Teknolojiler ve Servisler

Platform: .NET 8, Node.js, Python 3 


Veritabanı: MySQL 


AI Modeli: Random Forest Regressor 


Dış API: OpenWeatherMap (Hava Durumu), OSRM (Rota ve Mesafe) 


İletişim: gRPC, SOAP, REST 

Güvenlik ve Loglama

Şifreleme: Kullanıcı şifreleri SHA256 algoritması kullanılarak hashlenmiş şekilde saklanır.


Merkezi Loglama: Tüm servislerden gelen işlem ve hata kayıtları merkezi bir Logging Service tarafından tarih ve servis bazlı olarak dosyalanır.
