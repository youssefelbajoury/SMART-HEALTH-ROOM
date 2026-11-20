// Simulation d'ESP32 - À exécuter avec: npx tsx scripts/simulate-esp32.ts

const API_URL = "http://localhost:5000/api/v1/sensors/data";
const DEVICE_ID = 'ESP32-MOHAMED-001'

// Données simulées (comme si elles venaient des vrais capteurs)
const generateReadings = () => ({
  temperature: 20 + Math.random() * 5, // 20-25°C
  humidity: 40 + Math.random() * 20, // 40-60%
  airQuality: Math.floor(200 + Math.random() * 300), // 200-500 AQI
  pressure: Math.random() > 0.3 ? 600 + Math.random() * 400 : 100, // Lit occupé ou non
  motion: Math.random() > 0.7, // 30% de chance de mouvement
  soundLevel: Math.floor(20 + Math.random() * 40), // 20-60 dB
  co2: Math.floor(400 + Math.random() * 200), // 400-600 ppm
});

async function sendData() {
  const data = {
    deviceId: DEVICE_ID,
    readings: generateReadings(),
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log(
      `[${new Date().toLocaleTimeString()}] Sent: ${data.readings.temperature.toFixed(1)}°C, Bed: ${data.readings.pressure > 500 ? "OCCUPIED" : "EMPTY"} -> Score: ${result.sleepScore || "N/A"}`,
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

// Envoie des données toutes les 10 secondes
console.log(`🚀 Simulating ESP32 device: ${DEVICE_ID}`);
console.log(`📡 Sending to: ${API_URL}`);
console.log("Press Ctrl+C to stop\n");

sendData(); // Premier envoi immédiat
setInterval(sendData, 10000); // Puis toutes les 10s
