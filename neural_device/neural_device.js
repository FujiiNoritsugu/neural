var Cylon = require('cylon');
var Neural = require('./neural.js');
var bendValue;
var pressureValue;
var inputDataArray = [];
var counter = 0;
var HARD_LABEL = [0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3];
var SOFT_LABEL = [0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5];
var targetLabel = HARD_LABEL;
var mode = "learn";
var LABEL_ARRAY = [{name:hard, pattern:HARD_LABEL},{name:soft, pattern:SOFT_LABEL}];
Neural.initialize(10);

Cylon.robot({
	connections: { arduino:{adaptor: 'firmata', port: '/dev/ttyACM0'}},
	devices: {armServo:{driver: 'servo', pin:9},
	          bendSensor:{driver: 'analogSensor', pin:1},
	          pressureSensor:{driver: 'analogSensor', pin:3}},
	work: function(my){
		every((1).second(), function(){ actionFunction(my); });
	}
	}).start();

var actionFunction = function(my){
	bendValue = my.bendSensor.analogRead();
	console.log("bend = " + bendValue);
	// 曲げセンサの値は270～210
	// サーボの角度を6段階に分けて実行
	var angle = Math.round((bendValue - 210) / 10) * 10;
	my.armServo.angle(angle);

	pressureValue = my.pressureSensor.analogRead();
	if(pressureValue != 0){
		inputDataArray.push(bendValue/300);
		inputDataArray.push(pressureValue/100);
		counter ++;
	}

	if(counter === 10){
	 console.log("inputDataArray" + inputDataArray);
	 console.log("learn start");
	 if(mode === "learn"){
	     Neural.learn(inputDataArray, targetLabel);
	 }else{
	     Neural.classfy(inputaDataArray, LABEL_ARRAY);
	 }
	 console.log("learn end");
	 inputDataArray = [];
	 counter = 0;
	}
	console.log("pressure = " + pressureValue);
};


//----------- for monitoring -----------------------------
//var app = require('http').createServer(handler);
//var io = require('socket.io').listen(app);

//var fs = require('fs');
//var html = fs.readFileSync('neural_device.html', 'utf8');

//app.listen(8124);

//var target_socket;
//io.sockets.on('connection', function(socket){
//	console.log("connection");
//	socket.on('message', function(data){
//		console.log("message = "+data);
//		target_socket = this;
//	});
//	
//	if(target_socket != null){
//		target_socket.send("send data");
//		console.log("send data");
//	}
//	process();
//});

//function handler(req, res){
// res.setHeader('Content-Type', 'text/html');
// res.setHeader('Content-Length', Buffer.byteLength(html, 'utf8'));
// res.end(html);
//}

//function process(){
//
// if(target_socket != null){
//  if(bendValue != null && pressureValue != null){
//   target_socket.send(JSON.stringify({bend:bendValue, pressure:pressureValue}));
//  }
// }
// 
// setInterval(process, 1000);
//}

