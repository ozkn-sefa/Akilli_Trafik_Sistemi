// traffic-service.js
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader"); 
const cors = require('cors');
const { logInfo, logError } = require('./logger-client'); // LOGLAMA

const trafficApp = express();
const TRAFFIC_SERVICE_PORT = 3005; 
const FLASK_GRPC_SERVER_ADDRESS = "localhost:50051";
const TRAFFIC_PROTO_PATH = path.join(__dirname, 'traffic_proto.proto');
const SERVICE_SOURCE = "TRAFFIC_SERVICE";

// --- GRPC İstemcisi Oluşturma ---
let grpcClient;
if (fs.existsSync(TRAFFIC_PROTO_PATH)) {
    try {
        const packageDefinition = protoLoader.loadSync(TRAFFIC_PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
        const trafficProto = grpc.loadPackageDefinition(packageDefinition).traffic; 
        grpcClient = new trafficProto.TrafficService(FLASK_GRPC_SERVER_ADDRESS, grpc.credentials.createInsecure());
        logInfo(SERVICE_SOURCE, "gRPC istemcisi başarıyla oluşturuldu.");
    } catch(err) {
        logError(SERVICE_SOURCE, "gRPC protokol dosyası yüklenemedi.", { file: TRAFFIC_PROTO_PATH, error_msg: err.message });
    }
} else {
    logError(SERVICE_SOURCE, "'traffic_proto.proto' dosyası bulunamadı.", { path: TRAFFIC_PROTO_PATH });
}

trafficApp.use(bodyParser.json());
trafficApp.use(cors());

// Trafik Hizmeti Endpoint'i
trafficApp.post('/api/predict-traffic', (req, res) => {
    logInfo(SERVICE_SOURCE, "Trafik tahmini isteği alındı, gRPC çağrısı başlatılıyor.", req.body);
    
    if (!grpcClient) {
        logError(SERVICE_SOURCE, "Sunucu hatası: gRPC istemcisi başlatılamadı.", { address: FLASK_GRPC_SERVER_ADDRESS });
        return res.status(503).json({ message: "Sunucu hatası: gRPC istemcisi başlatılamadı." });
    }
    
    const { startLat, startLng, endLat, endLng } = req.body;
    const request = { startLat, startLng, endLat, endLng };

    grpcClient.predictTraffic(request, (err, response) => {
        if (err) {
            logError(SERVICE_SOURCE, "gRPC Trafik Tahmini çağrısı başarısız oldu.", { request: request, error_msg: err.message });
            return res.status(503).json({ 
                message: "gRPC Trafik Servisine ulaşılamıyor veya hata döndü.", 
                error: err.details || err.message
            });
        }
        logInfo(SERVICE_SOURCE, "gRPC Trafik tahmini başarıyla döndü.", { duration: response.duration });
        return res.json(response); 
    });
});

trafficApp.listen(TRAFFIC_SERVICE_PORT, () => {
    console.log(`\n🚘 Trafik Hizmet Servisi Çalışıyor! (PORT: ${TRAFFIC_SERVICE_PORT})`);
    logInfo(SERVICE_SOURCE, "Trafik Hizmet Servisi başlatıldı.", { port: TRAFFIC_SERVICE_PORT });
});