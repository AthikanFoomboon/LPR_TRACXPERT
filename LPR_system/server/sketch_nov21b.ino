// #include <WiFi.h>
// #include <MQTT.h>

// // กำหนดค่า WiFi SSID และ Password
// const char ssid[] = "MKT CMU_CO-OP_2.4GHz";
// const char pass[] = "mkt102024";

// #define LED_BUILTIN 2

// // กำหนดค่า MQTT
// const char mqtt_broker[] = "192.168.1.150"; // IP ของ Node.js Server
// const char mqtt_topic_IN[] = "group/command/IN";
// const char mqtt_topic_OUT[] = "group/command/OUT";
// const char mqtt_client_id[] = "nonnipha4"; // ต้องเปลี่ยนเป็นค่าที่ไม่ซ้ำ
// const int MQTT_PORT = 1883;

// // ตัวแปรสำหรับ debounce ของ input
// bool lastStableLoopIN = HIGH;
// bool lastStableLoopOUT = HIGH;
// unsigned long lastDebounceTimeIN = 0;
// unsigned long lastDebounceTimeOUT = 0;
// const unsigned long debounceDelay = 50; // 50 มิลลิวินาที

// WiFiClient net;
// MQTTClient client;

// int relay1 = 25;  // Gate IN Relay pin
// int relay2 = 26;  // Gate OUT Relay pin
// int loopIN = 12;  // LOOP IN I/O pin
// int loopOUT = 13; // LOOP OUT I/O pin

// // ตัวแปรสำหรับควบคุม relay แบบ non-blocking
// bool relay1Active = false;
// bool relay2Active = false;
// unsigned long relay1ActivatedTime = 0;
// unsigned long relay2ActivatedTime = 0;
// const unsigned long relayActiveDuration = 1000; // เปิด relay 1 วินาที

// // ฟังก์ชันเชื่อมต่อ WiFi และ MQTT พร้อม timeout
// void connectWiFiAndMQTT() {
//   // เชื่อมต่อ WiFi
//   Serial.print("Connecting to WiFi");
//   WiFi.begin(ssid, pass);
//   unsigned long wifiStartTime = millis();
//   while (WiFi.status() != WL_CONNECTED && millis() - wifiStartTime < 15000) { // 15 วินาที timeout
//     Serial.print(".");
//     delay(500);
//   }
//   if (WiFi.status() == WL_CONNECTED) {
//     Serial.println(" Connected to WiFi");
//   } else {
//     Serial.println(" Failed to connect to WiFi");
//     return;
//   }

//   // เชื่อมต่อ MQTT
//   Serial.print("Connecting to MQTT");
//   unsigned long mqttStartTime = millis();
//   while (!client.connect(mqtt_client_id) && millis() - mqttStartTime < 15000) {
//     Serial.print(".");
//     delay(500);
//   }
//   if (client.connected()) {
//     Serial.println(" Connected to MQTT!");
//     client.subscribe(mqtt_topic_IN);
//     client.subscribe(mqtt_topic_OUT);
//   } else {
//     Serial.println(" Failed to connect to MQTT");
//   }
// }

// // ฟังก์ชันจัดการข้อความที่ได้รับจาก MQTT (ใช้ non-blocking relay activation)
// void messageReceived(String &topic, String &payload) {
//   Serial.println("Incoming: " + topic + " - " + payload);

//   if (payload == "Gate_IN_OPEN") {
//     digitalWrite(relay1, LOW); // เปิด relay (active LOW)
//     relay1ActivatedTime = millis();
//     relay1Active = true;
//     Serial.println(String(mqtt_topic_IN) + ": Gate IN Activated");
//   } else if (payload == "Gate_OUT_OPEN") {
//     digitalWrite(relay2, LOW);
//     relay2ActivatedTime = millis();
//     relay2Active = true;
//     Serial.println(String(mqtt_topic_OUT) + ": Gate OUT Activated");
//   }
// }

// void setup() {
//   pinMode(LED_BUILTIN, OUTPUT);
//   pinMode(relay1, OUTPUT);
//   pinMode(relay2, OUTPUT);
//   pinMode(loopIN, INPUT_PULLUP);
//   pinMode(loopOUT, INPUT_PULLUP);

//   Serial.begin(115200);

//   client.begin(mqtt_broker, MQTT_PORT, net);
//   client.onMessage(messageReceived);

//   connectWiFiAndMQTT();

//   // เปิด LED เพื่อบอกว่าเริ่มทำงานแล้ว
//   digitalWrite(LED_BUILTIN, HIGH);
// }

// void loop() {
//   client.loop();

//   // ตรวจสอบการเชื่อมต่อ WiFi และ MQTT
//   if (WiFi.status() != WL_CONNECTED) {
//     Serial.println("WiFi disconnected, attempting to reconnect...");
//     WiFi.disconnect();
//     WiFi.begin(ssid, pass);
//   }
//   if (!client.connected()) {
//     connectWiFiAndMQTT();
//   }

//   unsigned long currentMillis = millis();

//   // จัดการ relay1 (Gate IN) แบบ non-blocking
//   if (relay1Active && (currentMillis - relay1ActivatedTime >= relayActiveDuration)) {
//     digitalWrite(relay1, HIGH); // ปิด relay
//     relay1Active = false;
//   }
//   // จัดการ relay2 (Gate OUT) แบบ non-blocking
//   if (relay2Active && (currentMillis - relay2ActivatedTime >= relayActiveDuration)) {
//     digitalWrite(relay2, HIGH);
//     relay2Active = false;
//   }

//   // Debounce สำหรับ loopIN
//   bool currentLoopIN = digitalRead(loopIN);
//   if (currentLoopIN != lastStableLoopIN) {
//     lastDebounceTimeIN = currentMillis;
//   }
//   if ((currentMillis - lastDebounceTimeIN) > debounceDelay) {
//     if (currentLoopIN != lastStableLoopIN) {
//       lastStableLoopIN = currentLoopIN;
//       if (currentLoopIN == LOW) { // ตรวจจับการกด (falling edge)
//         client.publish(mqtt_topic_IN, "stream1");
//         Serial.println(String(mqtt_topic_IN) + ": loopIN Triggered");
//       }
//     }
//   }

//   // Debounce สำหรับ loopOUT
//   bool currentLoopOUT = digitalRead(loopOUT);
//   if (currentLoopOUT != lastStableLoopOUT) {
//     lastDebounceTimeOUT = currentMillis;
//   }
//   if ((currentMillis - lastDebounceTimeOUT) > debounceDelay) {
//     if (currentLoopOUT != lastStableLoopOUT) {
//       lastStableLoopOUT = currentLoopOUT;
//       if (currentLoopOUT == LOW) { // ตรวจจับการกด (falling edge)
//         client.publish(mqtt_topic_OUT, "stream2");
//         Serial.println(String(mqtt_topic_OUT) + ": loopOUT Triggered");
//       }
//     }
//   }
// }