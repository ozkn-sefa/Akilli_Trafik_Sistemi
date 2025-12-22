# traffic_predictor_persistent.py (Güncellenmiş)

import joblib
import pandas as pd
from datetime import datetime
import json
import sys
import glob
import time
import traceback 

# 🎯 KRİTİK DÜZELTME: Türkçe karakter desteği için akışları UTF-8'e zorla
try:
    sys.stdin.reconfigure(encoding='utf-8')
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
    sys.stderr.write("INFO: Python I/O akışları başarıyla UTF-8 olarak ayarlandı.\n")
except Exception as e:
    sys.stderr.write(f"WARN: Python I/O akışları UTF-8 olarak ayarlanamadı. Hata: {e}\n")


# --- Model Yükleme Fonksiyonu (Aynı) ---
def load_latest_optimized_model():
    """En son optimize edilmiş ve sıkıştırılmış modeli bulur ve yükler."""
    model_files = glob.glob('Random_Forest.pkl')

    if not model_files:
        sys.stderr.write("HATA: 'traffic_model_optimized_*.pkl' desenine uyan model dosyası bulunamadı.\n")
        return None

    model_files.sort(reverse=True)
    latest_model_path = model_files[0]

    sys.stderr.write(f"INFO: Model yükleme denemesi: {latest_model_path}\n")

    try:
        model = joblib.load(latest_model_path)
        sys.stderr.write(f"INFO: Makine Öğrenimi modeli başarıyla yüklendi: {latest_model_path}\n") 
        return model
    except Exception as e:
        sys.stderr.write(f"KRİTİK HATA: Model yüklenirken beklenmedik hata oluştu ({latest_model_path}).\n")
        sys.stderr.write("Hata Detayı:\n")
        sys.stderr.write(traceback.format_exc())
        return None

# Eğitilmiş modeli yükle
model = load_latest_optimized_model()

# --- YENİ: Eğitim Modelinizle Uyumlu Özellik Türetme Fonksiyonları ---

def get_hafta_durumu(day_of_week):
    """
    DAY_OF_WEEK (0-6) değerini kullanarak HAFTA_DURUMU'nu döndürür.
    Eğitim koduna göre: Hafta İçi = 0, Hafta Sonu = 1 (5, 6)
    """
    # 0=Pazartesi, ..., 4=Cuma -> Hafta İçi (0)
    # 5=Cumartesi, 6=Pazar -> Hafta Sonu (1)
    return 1 if day_of_week >= 5 else 0

def get_zaman_dilimi(hour):
    """
    HOUR (0-23) değerini kullanarak ZAMAN_DİLİMİ'ni döndürür.
    Eğitim verinizin mantığına göre yaklaşık olarak eşleştirme yapıyorum:
    1: Sabah (Örn: 06:00 - 10:00)
    2: Öğle (Örn: 10:00 - 15:00)
    3: Akşam (Örn: 15:00 - 20:00)
    4: Gece (Örn: 20:00 - 06:00)
    """
    if 6 <= hour <= 12:
        return 1  # Sabah
    elif 13 <= hour <= 18:
        return 2  # Öğle
    elif 19 <= hour <= 23:
        return 3  # Akşam
    else:
        return 4  # Gece

# --- Tahmin Fonksiyonu (Güncellendi) ---
def predict_route_speed(steps):
    """Rota verilerini (adımları) kullanarak her adım için ortalama hız tahmini yapar."""
    predictions = []

    now = datetime.now()
    hour = now.hour
    day_of_week = now.weekday() # Pazartesi=0, Pazar=6

    # Model ile uyumlu yeni özellikleri türet
    hafta_durumu = get_hafta_durumu(day_of_week)
    zaman_dilimi = get_zaman_dilimi(hour)

    for step in steps:
        try:
            lat = step['lat']
            lng = step['lng']
            distance = step['distance'] 
            duration = step['duration'] 
            name = step.get('name', 'Bilinmeyen Yol') 

            # Model eğitiminde kullanılan diğer sabit/tahmini girişler
            # Bu değerler, eğitim veri setinizdeki MIN/MAX_SPEED ve NUMBER_OF_VEHICLES sütunlarına karşılık gelir.
            # Gerçek bir sistemde bu değerler de güncel veriden gelmelidir, ancak eğitimdeki varsayımları koruyorum.
            min_speed = 10
            max_speed = 100
            num_vehicles = 50

            predicted_speed = 50.0 
            
            if model:
                # KRİTİK DÜZELTME: Sütunların sırası ve adları eğitimdekiyle AYNEN EŞLEŞMELİ.
                # Eğitim kodunuzda kullanılan sütun sırası (df.drop('AVERAGE_SPEED', axis=1) sonrası):
                # 'HAFTA_DURUMU', 'ZAMAN_DİLİMİ', 'LATITUDE', 'LONGITUDE', 
                # 'MINIMUM_SPEED', 'MAXIMUM_SPEED', 'NUMBER_OF_VEHICLES', 'HOUR', 'DAY_OF_WEEK'
                
                data_for_prediction = pd.DataFrame([{
                    # Eğitim Verisinden Türetilenler (Zorunlu Eşleşme)
                    'HAFTA_DURUMU': hafta_durumu,
                    'ZAMAN_DİLİMİ': zaman_dilimi,
                    
                    # Giriş Verisinden Gelenler
                    'LATITUDE': lat, 
                    'LONGITUDE': lng, 
                    
                    # Sabit/Tahmini Girişler
                    'MINIMUM_SPEED': min_speed,
                    'MAXIMUM_SPEED': max_speed, 
                    'NUMBER_OF_VEHICLES': num_vehicles,
                    
                    # Türetilen Zaman Özellikleri
                    'HOUR': hour, 
                    'DAY_OF_WEEK': day_of_week
                }])
                
                # float32 dönüşümü, eğitimdeki bellek optimizasyonuna uymak için
                for col in data_for_prediction.columns:
                    data_for_prediction[col] = data_for_prediction[col].astype(float)
                
                predicted_speed = model.predict(data_for_prediction)[0]
                
            else:
                # Model yüklenemezse varsayılan hızı hesapla
                 predicted_speed = distance / (duration / 3.6) if duration > 0 else 50.0

            # Hızdan süre hesaplama: Süre (s) = Mesafe (m) / Hız (m/s)
            # Hız km/h cinsinden olduğu için m/s'ye çevir: speed * 1000 / 3600
            if predicted_speed > 0:
                predicted_travel_time = distance / (predicted_speed * 1000 / 3600)
            else:
                predicted_travel_time = 9999.0

            predictions.append({
                'lat': float(lat), 'lng': float(lng), 'name': name,
                'distance': float(distance), 'duration': float(duration), 
                'predictedAvgSpeed': float(round(predicted_speed, 2)), 
                'predictedTravelTime': float(round(predicted_travel_time, 2)) 
            })

        except Exception as e:
            sys.stderr.write(f"🛑 HATA: Adım işlenirken istisna oluştu ({name}). Hata: {e}\n")
            sys.stderr.write(traceback.format_exc())
            continue

    return predictions

# --- Ana döngü kısmı (Aynı) ---
if __name__ == "__main__":
    if model is None:
        sys.stderr.write("FATAL: Model yüklenemedi. Çıkılıyor.\n")
        print(json.dumps({"error": "Model_Load_Error"}), file=sys.stdout)
        sys.stdout.flush()
        sys.exit(1)

    print("PYTHON_READY")
    sys.stdout.flush()

    while True:
        try:
            line = sys.stdin.readline()

            if not line:
                sys.stderr.write("INFO: Stdin kapandı. Çıkılıyor.\n")
                break

            request_data = json.loads(line)

            steps = request_data['steps'] 
            request_id = request_data['requestId'] 

            predictions = predict_route_speed(steps)
            total_predicted_duration = sum(p['predictedTravelTime'] for p in predictions) 

            response = {
                "requestId": request_id,
                "predictions": predictions,
                "totalPredictedDuration": total_predicted_duration
            }

            print(json.dumps(response))
            sys.stdout.flush()

        except EOFError:
            break
        except json.JSONDecodeError:
            sys.stderr.write("🛑 PYTHON LOOP ERROR: Geçersiz JSON formatı alındı.\n")
            continue
        except Exception as e:
            sys.stderr.write(f"🛑 PYTHON LOOP ERROR: İşlenmemiş hata: {e}\n")
            sys.stderr.write(traceback.format_exc())
            
            error_response = {"error": f"Internal Prediction Error: {e}"}
            if 'request_id' in locals():
                 error_response["requestId"] = request_id
            print(json.dumps(error_response))
            sys.stdout.flush()