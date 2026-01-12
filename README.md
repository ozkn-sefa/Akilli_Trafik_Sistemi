# Akıllı Trafik Yönetim ve Şehir Bilgi Sistemi

Bu proje, **İstanbul özelinde** gerçek zamanlı trafik tahmini, hava durumu entegrasyonu, topluluk tabanlı olay bildirimi ve interaktif rota planlama sunan **çok katmanlı bir akıllı şehir uygulamasıdır**.

Geleneksel trafik sistemlerinden farklı olarak, **makine öğrenmesi modelleri** kullanarak daha isabetli hız ve varış süresi tahminleri üretmeyi hedefler.

---

## Projenin Amacı

Projenin temel amacı;

* Yol adımlarına (segment bazlı) göre özel olarak eğitilmiş **makine öğrenmesi modelleri** aracılığıyla trafik yoğunluğunu analiz etmek,
* Kullanıcılar için **en doğru tahmini varış sürelerini** hesaplamak,
* Harita tabanlı **topluluk katkılı olay bildirimi** sayesinde güncel ve güvenilir bir trafik bilgi ağı oluşturmaktır.

---

## Öne Çıkan Özellikler

### 🚦 Makine Öğrenmesi Destekli Tahmin

* **OSRM** üzerinden alınan yol ve mesafe verileri,
* **Random Forest Regressor** algoritması ile işlenir,
* Haftanın günü ve günün saatine göre **optimize edilmiş hız ve ETA (Estimated Time of Arrival)** tahminleri sunulur.

### 🗺️ İnteraktif Olay Bildirimi

Kullanıcılar harita üzerinde aşağıdaki **7 farklı trafik olayı** için işaretleyici ekleyebilir:

1. Kaza
2. Trafik Yoğunluğu
3. Radar
4. Yol Çalışması
5. Bozuk Yol
6. Kaygan Yol
7. Kapalı Yol

### 🔔 Anlık Bildirim Sistemi

* Yeni bir trafik olayı bildirildiğinde,
* İlgili bölgeye **abone olan kullanıcılara**,
* **Node.js tabanlı servis** aracılığıyla otomatik **e-posta bildirimi** gönderilir.

### 🌦️ Hava Durumu Entegrasyonu

* Koordinat bazlı hava durumu verileri,
* **SOAP ve REST** protokolleri üzerinden alınır,
* Trafik tahminlerine ve kullanıcı **dashboard** ekranına entegre edilir.

### 🕓 Rota Geçmişi

* Kullanıcılar sorguladıkları **son 50 rotayı**;

  * Tahmini süreler,
  * O anki hava koşulları,
  * Görsel rota bilgileri ile birlikte inceleyebilir.

### 📍 İstanbul Odaklı Validasyon

* Harita işaretleyicileri yalnızca **İstanbul il sınırları** içerisinde eklenebilir,
* Koordinat bazlı doğrulama mekanizması ile veri tutarlılığı sağlanır.

---

## Teknik Mimari

Proje, **yüksek ölçeklenebilirlik** ve **servis bağımsızlığı** hedeflenerek **mikroservis mimarisi** üzerine inşa edilmiştir.

---

## Arka Yüz (Backend)

### ASP.NET Core 8 MVC

* Ana uygulama katmanı
* Kullanıcı yönetimi
* Oturum kontrolü
* Veritabanı orkestrasyonu

### Node.js & Express

* API Gateway
* E-posta bildirim servisi
* Merkezi loglama servisi

### Servisler Arası Haberleşme

* REST
* gRPC
* SOAP

### Entity Framework Core

* ORM yönetimi
* **Repository Pattern** uygulanmıştır

---

## Yapay Zeka ve Makine Öğrenmesi

### Python

* **Scikit-Learn** kullanılarak Random Forest regresyon modeli eğitilmiştir

### Pandas

* Veri temizleme
* Özellik türetme (hafta içi/sonu, saat dilimi vb.)

### OSRM (Open Source Routing Machine)

* Yol ağı
* Mesafe ve rota verilerinin alınması

---

## Veritabanı (MySQL)

### Stored Procedures

* Rota ve hava durumu kayıtları gibi karmaşık işlemlerin performanslı yönetimi

### Database Views

* Profil özetleri
* Son trafik olayları gibi verilerin hızlı erişimi

### Functions

* Toplam işaret sayısı gibi hesaplamaların veritabanı seviyesinde yapılması

---

## Ön Yüz (Frontend)

### Razor Views & Bootstrap 5

* Modern
* Duyarlı (Responsive) kullanıcı arayüzü

### Leaflet.js

* İnteraktif harita yönetimi
* İşaretleyici ekleme
* Rota çizimi ve görselleştirme

---

## Kullanılan Teknolojiler ve Servisler

* **Platform:** .NET 8, Node.js, Python 3
* **Veritabanı:** MySQL
* **AI Modeli:** Random Forest Regressor
* **Dış API’ler:**

  * OpenWeatherMap (Hava Durumu)
  * OSRM (Rota ve Mesafe)
* **İletişim Protokolleri:** REST, gRPC, SOAP

---

## Güvenlik ve Loglama

### 🔐 Güvenlik

* Kullanıcı şifreleri **SHA-256** algoritması ile hashlenerek saklanır

### 📝 Merkezi Loglama

* Tüm servislerden gelen işlem ve hata kayıtları
* Merkezi bir **Logging Service** tarafından
* Tarih ve servis bazlı olarak dosyalanır

---

> Bu proje, İstanbul için ölçeklenebilir, akıllı ve veri odaklı bir trafik yönetim çözümü sunmayı amaçlamaktadır.
## Uygulama içi görüntüler
<img width="1179" height="837" alt="Ekran görüntüsü 2025-12-26 204617" src="https://github.com/user-attachments/assets/86bf87b2-7992-4334-afd1-3ae76d7aec1e" />
<img width="1168" height="693" alt="Ekran görüntüsü 2025-12-26 204709" src="https://github.com/user-attachments/assets/53e2ac76-9965-43e1-81c7-cd2508ce9616" />
<img width="1118" height="860" alt="Ekran görüntüsü 2025-12-26 204736" src="https://github.com/user-attachments/assets/b388e8a0-0a26-408b-817c-739ac232e903" />
<img width="1331" height="852" alt="Ekran görüntüsü 2025-12-21 170008" src="https://github.com/user-attachments/assets/aaa6d765-907a-43e4-bc77-7f120fea56a0" />

