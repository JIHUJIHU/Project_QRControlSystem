
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#define C 262 // 도 
#define D 294 // 레 
#define E 330 // 미 
#define F 349 // 파 
#define G 392 // 솔 
#define A 440 // 라 
#define B 494 // 시 
int piezoPin = D8; //부저 핀
int tempo = 200; 

//int s_seat[4] = { C, E, G};
//int s_stand[3] = {E, C};
//int n_seat[2] = {E}; 

const char* ssid = "color21"; //와이파이 시드
const char* password = "color212016"; //와이파이 패스워드
String payload; //서버에서 받은 값
boolean seat = false;

String seat_server = "http://172.30.1.31:8000/seat/1111"; //앉았을 때 서버요청 (1111은 자리번호)
String stand_server = "http://172.30.1.31:8000/stand/1111"; //일어섰을 때 서버요청 (1111은 자리번호)


//함수
void request(); //앉았을때 승인됐는지
void stand(); //일어섰을때

 
void setup () {
  Serial.begin(115200);
  pinMode(piezoPin, OUTPUT);

  // wifi 연결
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print("Connecting..");
  }
  Serial.println("Seccess");
}
 /////////////////////////////////////////////////////
void loop() {
  int sensor = analogRead(D1); //압력센서
  Serial.println(sensor);
  if(sensor == 1023 && seat == false){ //앉았을때
    Serial.print("go");
    seat = true;  //앉았음
    request();    // 승인 여부 확인
    //Serial.println(payload);
    if(payload == "0"){ //승인되지 않았다면
      while(1){ //일어서기 전까지
        // 삐삐ㅣ삐삐
        int sensor = analogRead(D1);
        Serial.println(sensor);
        tone (piezoPin, E, tempo);
        if(sensor == 0){
          break;
        }
        delay(500);
      } 
      seat = false; //다시 안앉은걸로 
    }else if(payload == "1"){ // 승인 되었다면
      //띠리리
      tone(piezoPin, C, tempo);
      delay(250);
      tone(piezoPin, E, tempo);
      delay(250);
      tone(piezoPin, G, tempo);
      delay(250);
    }
  }else if (sensor == 0 && seat == true){ //승인받고 앉아 있다가 일어섰을경우
    //서버에 일어났다고 신호보내기
    //띠딩 (일어섯다는 멜로디)
    tone(piezoPin, E, tempo);
    delay(250);
    tone(piezoPin, C, tempo);
    delay(250);
    seat = false;
    stand();
  }
  delay(1000);    //Send a request every 30 seconds
}

/////////////////////////////////////////////////
//함수 선언

void request() { //승인여부 요청
  while(1){ //서버연결에 성공할때까지 실행
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http; 
      http.begin(seat_server);  //주소
      int httpCode = http.GET();
      if (httpCode > 0) { //오류 안나면
        payload = http.getString(); 
        Serial.print("payload  "); 
        Serial.println(payload);
      }
      Serial.print("no");
      
      http.end();   //Close connection
      break;
    }
  }
}

void stand(){ //일어섰을때 서버로 알림
   while(1){ //서버연결에 성공할때까지 실행
    
    if (WiFi.status() == WL_CONNECTED) {
      
      HTTPClient http; 
      http.begin(stand_server);  //주소
      int httpCode = http.GET();
      if (httpCode > 0) { //오류 안나면 
        Serial.println("stand");
      }
      
      http.end();   //Close connection
      break;
      Serial.println("stand");
      
    }
    
  }
}
