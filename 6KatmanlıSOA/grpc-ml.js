// index.js (Node.js gRPC Gateway - Nihai Versiyon)

import { spawn } from 'child_process';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid'; 
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs'; 

// --- YAPILANDIRMA ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TRAFFIC_PROTO_PATH = path.join(__dirname, 'traffic_proto.proto');
const GRPC_SERVER_ADDRESS = "localhost:50051"; 
const OSRM_BASE_URL = "http://router.project-osrm.org/route/v1/driving";
const PYTHON_SCRIPT = 'traffic_predictor_persistent.py';
const TIMEOUT_MS = 30000; 

// Python sanal ortam yolu
const PYTHON_EXECUTABLE_PATH = 'D:/Projeler/AkıllıTrafikSistemi/.venv/Scripts/python.exe'; 

let pythonProcess = null;
let pythonReady = false;
const requestMap = new Map();

// --- Yardımcı Fonksiyonlar ---

async function getOsrmRoute(startLat, startLng, endLat, endLng) {
    const url = `${OSRM_BASE_URL}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;
    try {
        console.log(`[OSRM] İstek gönderiliyor: ${url.substring(0, 100)}...`);
        const response = await axios.get(url, { timeout: 15000 });
        if (!response.data || !response.data.routes || response.data.routes.length === 0) {
             throw new Error("NoRoute");
        }
        console.log(`[OSRM] Başarılı: ${response.data.routes.length} rota bulundu.`);
        return response.data;
    } catch (e) {
        console.error(`🛑 OSRM AĞ/HTTP HATASI (${e.code || e.message}): Rota alınamadı.`);
        if (e.message.includes("NoRoute")) {
             throw new Error('OSRM rotayı bulamadı.');
        }
        throw new Error('OSRM servisine erişilemiyor.');
    }
}

function sendToPython(data) {
    const requestId = uuidv4();
    data.requestId = requestId;

    return new Promise((resolve, reject) => {
        if (!pythonReady || !pythonProcess || !pythonProcess.stdin) {
            return reject(new Error("Python tahmin süreci henüz hazır değil veya kapalı."));
        }
        
        const timeout = setTimeout(() => {
            if (requestMap.has(requestId)) {
                requestMap.delete(requestId);
                console.error(`🛑 [PYTHON TIMEOUT] Tahmin zaman aşımına uğradı (${TIMEOUT_MS}ms) (ID: ${requestId})`);
                reject(new Error(`Python tahmin zaman aşımına uğradı (${TIMEOUT_MS}ms)`));
            }
        }, TIMEOUT_MS);
        
        const newResolve = (value) => {
            clearTimeout(timeout);
            requestMap.delete(requestId); 
            resolve(value);
        };
        
        const newReject = (reason) => {
            clearTimeout(timeout);
            requestMap.delete(requestId); 
            reject(reason);
        };
        
        requestMap.set(requestId, { resolve: newResolve, reject: newReject });
        
        console.log(`[PYTHON >] Gönderiliyor (ID: ${requestId}): ${data.steps.length} adım.`);
        pythonProcess.stdin.write(JSON.stringify(data) + '\n', 'utf8', (err) => {
             if (err) {
                 newReject(new Error(`Python stdin'e yazma hatası: ${err.message}`));
             }
        });
    });
}

function startPythonProcess() {
    console.log(`[INIT] Python süreci başlatılıyor: ${PYTHON_EXECUTABLE_PATH} ile ${PYTHON_SCRIPT}`);
    
    try {
        pythonProcess = spawn(PYTHON_EXECUTABLE_PATH, [PYTHON_SCRIPT], {
            stdio: ['pipe', 'pipe', 'pipe'], 
        });
    } catch (error) {
         console.error(`🛑 Python Süreç Başlatma Hatası: ${error.message}. PYTHON_EXECUTABLE_PATH kontrol edin!`);
         return;
    }

    let stdoutBuffer = ''; 

    pythonProcess.stdout.setEncoding('utf8'); 
    pythonProcess.stderr.setEncoding('utf8'); 

    pythonProcess.stdout.on('data', (data) => {
        stdoutBuffer += data.toString();
        let newLineIndex;
        while ((newLineIndex = stdoutBuffer.indexOf('\n')) !== -1) {
            const line = stdoutBuffer.substring(0, newLineIndex).trim();
            stdoutBuffer = stdoutBuffer.substring(newLineIndex + 1);

            if (line === "PYTHON_READY") {
                pythonReady = true;
                console.log("✅ Python Süreci: ML Modeli yüklendi ve iletişim hazır.");
                continue;
            }
            if (line.startsWith("INFO:") || !line) {
                 if(line) console.log(`[PY INFO] ${line}`);
                 continue;
            }

            try {
                const response = JSON.parse(line);
                const requestId = response.requestId;

                if (requestId && requestMap.has(requestId)) {
                    const { resolve, reject } = requestMap.get(requestId);
                    
                    if (response.error) {
                        console.error(`🛑 [PYTHON <] Hata Yanıtı (ID: ${requestId}): ${response.error}`);
                        reject(new Error(`Python Hata: ${response.error}`));
                    } else {
                        // Konsol logunda dakika cinsinden 2 ondalık gösterim
                        console.log(`✅ [PYTHON <] Başarılı Yanıt (ID: ${requestId}). Toplam Tahmin: ${(response.totalPredictedDuration / 60).toFixed(2)} dk.`);
                        resolve(response);
                    }
                } else if (requestId) {
                    console.warn(`[WARN] Bilinmeyen veya zaman aşımına uğramış requestId alındı: ${requestId}`);
                } else {
                    console.warn(`[WARN] Python'dan beklenmedik çıktı (JSON değil): ${line}`);
                }
            } catch (e) {
                console.error(`[CRITICAL] Python çıktısı JSON formatında değil veya işlenemedi: ${line}`, e);
            }
        }
    });

    pythonProcess.stderr.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
             console.error(`🔴 Python STDERR: ${line}`);
        });
       
        if (data.toString().includes("Model_Load_Error") || data.toString().includes("KRİTİK HATA: Model yüklenirken")) {
             pythonReady = false;
        }
    });

    pythonProcess.on('error', (err) => {
        console.error(`🛑 Python Süreç Hatası: Süreç başlatılamadı veya çalıştırılırken hata oluştu.`, err);
        pythonReady = false;
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`🛑 Python süreci ${code} koduyla sona erdi. Yeniden başlatılmalı.`);
        } else {
            console.log(`[INFO] Python süreci başarıyla sona erdi (Kod 0).`);
        }
        pythonReady = false;
        for (const [id, { reject }] of requestMap) {
            reject(new Error(`Python süreci kapandığı için istek başarısız oldu (ID: ${id})`));
        }
        requestMap.clear();
    });
}

// --- gRPC Servis Yöntemi Uygulaması ---

async function predictTraffic(call, callback) {
    // Ham gRPC verilerini alın
    const { startLat: startLatReq, startLng: startLngReq, endLat: endLatReq, endLng: endLngReq } = call.request;

    // Koordinatları float'a dönüştür
    const sLat = parseFloat(startLatReq);
    const sLng = parseFloat(startLngReq);
    const eLat = parseFloat(endLatReq);
    const eLng = parseFloat(endLngReq);
    
    // Geçersiz koordinat kontrolü
    if (isNaN(sLat) || isNaN(sLng) || isNaN(eLat) || isNaN(eLng)) {
        return callback({
            code: grpc.status.INVALID_ARGUMENT,
            details: "Gönderilen enlem/boylam değerleri geçerli sayı formatında değil."
        });
    }

    const requestDetails = `[${sLat.toFixed(4)},${sLng.toFixed(4)}] -> [${eLat.toFixed(4)},${eLng.toFixed(4)}]`;
    console.log(`\n======================================================`);
    console.log(`[gRPC İSTEK] Yeni İstek Alındı: ${requestDetails}`);
    console.log(`======================================================`);
    
    try {
        if (!pythonReady) {
             throw new Error("ML modeli hazır değil veya yüklenemedi. Lütfen sunucu loglarını kontrol edin.");
        }
        
        const routeData = await getOsrmRoute(sLat, sLng, eLat, eLng);
        const mainRoute = routeData.routes[0];

        const stepsToSend = mainRoute.legs[0].steps.map(step => ({
            lat: step.maneuver.location[1], 
            lng: step.maneuver.location[0],
            distance: step.distance, 
            duration: step.duration, 
            name: step.name
        }));

        const pythonResponse = await sendToPython({ steps: stepsToSend });
        
        const totalPredictedDurationSeconds = pythonResponse.totalPredictedDuration; 
        const totalOsrmDurationSeconds = mainRoute.duration; 
        
        // 🎯 KRİTİK DÜZELTME: Süreleri dakika cinsine çevir ve 2 ondalık basamağa yuvarla
        const totalPredictedDurationMin = Math.round((totalPredictedDurationSeconds / 60) * 100) / 100;
        const totalOsrmDurationMin = Math.round((totalOsrmDurationSeconds / 60) * 100) / 100;
        
        const isAltBetter = totalPredictedDurationSeconds < totalOsrmDurationSeconds;
        const suggestionText = isAltBetter 
            ? "Tebrikler! Tahmin modelimiz, mevcut rotanın OSRM'in önerdiğinden daha kısa süreceğini tahmin ediyor."
            : "Dikkat! Tahmin modelimiz, bu rotanın OSRM'in önerdiğinden daha uzun süreceğini tahmin ediyor.";
            
        const finalResponse = {
            originalRoute: {
                geometry: JSON.stringify(mainRoute.geometry),
                steps: pythonResponse.predictions, 
                // Yuvarlanmış dakika değerlerini gönder
                totalPredictedDuration: totalPredictedDurationMin, 
                totalOSRMDuration: totalOsrmDurationMin,
            },
            alternativeRoute: {
                suggestion: suggestionText,
                isAlternativeBetter: isAltBetter,
                alternativeMapData: "Henüz Alternatif Rota Hesaplanmadı" 
            }
        };

        console.log(`✅ [gRPC YANIT] Başarıyla gönderildi. Tahmini Süre: ${totalPredictedDurationMin.toFixed(2)} dk.`);
        callback(null, finalResponse); 
        
    } catch (error) {
        console.error(`🛑 [gRPC HATA] İstek İşlenemedi: ${error.message}`);
        let statusCode = grpc.status.INTERNAL;
        if (error.message.includes("OSRM rotayı bulamadı")) {
             statusCode = grpc.status.NOT_FOUND;
        } else if (error.message.includes("ML modeli hazır değil")) {
             statusCode = grpc.status.UNAVAILABLE;
        }

        return callback({
            code: statusCode,
            details: `Tahmin hizmeti hatası: ${error.message}`
        });
    }
}


// --- gRPC Sunucusunu Başlatma ---
function startGrpcServer() {
    try {
        if (!fs.existsSync(TRAFFIC_PROTO_PATH)) {
             throw new Error(`traffic_proto.proto dosyası bulunamadı: ${TRAFFIC_PROTO_PATH}`);
        }
        const packageDefinition = protoLoader.loadSync(TRAFFIC_PROTO_PATH, {
            keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
        });
        const trafficProto = grpc.loadPackageDefinition(packageDefinition).traffic;
        
        const server = new grpc.Server();
        
        server.addService(trafficProto.TrafficService.service, {
            predictTraffic: predictTraffic
        });

        server.bindAsync(GRPC_SERVER_ADDRESS, grpc.ServerCredentials.createInsecure(), (err, port) => {
            if (err) {
                console.error(`🛑 gRPC Sunucusu başlatılamadı: ${err.message}`);
                return;
            }
            console.log(`======================================================`);
            console.log(`📡 Node.js gRPC Sunucusu Çalışıyor: ${GRPC_SERVER_ADDRESS}`);
            console.log(`======================================================`);
        });
    } catch (error) {
         console.error(`🛑 gRPC sunucu hazırlık hatası: ${error.message}`);
    }
}

// Uygulamayı başlat
startPythonProcess(); 
startGrpcServer();