nclude <WiFi.h>
#include <PubSubClient.h>

const char* WIFI_SSID = "Mostafa Ahmed";
const char* WIFI_PASSWORD = "AwMsM#76aWmSm#95";
const char* MQTT_BROKER = "154.177.130.244";  
const int MQTT_PORT = 1883;
const char* MQTT_TOPIC = "sensors/ultrasonic/distance"; 

const int TRIG_PIN = 5;
const int ECHO_PIN = 18;
const int container_h = 11.5; // cm

WiFiClient espClient;
PubSubClient client(espClient);
float range_0_100(float a) {
  return (a < 0) ? 0 : (a > 100) ? 100 : a;
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected.");
}

void connectToMQTT() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    String clientId = "ESP32Client-" + String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println("connected!");
    } else {
      Serial.print("failed (");
      Serial.print(client.state());
      Serial.println("). Trying again in 5 seconds...");
      delay(5000);
    }
  }
}

float getDistanceCM() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // timeout after 30 ms
  float distanceCm = duration * 0.034 / 2;
  return distanceCm;
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  connectToWiFi();
  client.setServer(MQTT_BROKER, MQTT_PORT);
}

void loop() {
  if (!client.connected()) {
    connectToMQTT();
  }
  client.loop();

  static unsigned long lastSend = 0;
  if (millis() - lastSend > 1000) {
    lastSend = millis();
    float distance = getDistanceCM();
    float distance_percentage = 100 * (container_h - distance) / container_h;
    distance_percentage = range_0_100(distance_percentage);

    char msg[20];
    snprintf(msg, sizeof(msg), "%.2f", distance_percentage);

    Serial.print("Publishing distance: ");
    Serial.println(msg);

    client.publish(MQTT_TOPIC, msg);
  }
}
