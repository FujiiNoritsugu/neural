// ���j�^�p�T�[�o�ɐڑ�
var UnderScore = require('underscore');
var SocketClient = require('socket.io-client');
var Client = SocketClient.connect('http://192.168.1.7:9080');
Client.on('connect', onConnect);
Client.on('message', onMessage);

function onConnect(){
    //socket.send("arm");
    console.log("connect");
}

var targetPattern;
var targetMode;

function onMessage(message){
    var param = JSON.parse(message);
    
    if(UnderScore.isUndefined(param.pattern)){
        var paramPattern = param.pattern;
        if(paramPattern === "soft"){
            targetPattern = SOFT_PATTERN;
        }else if(paramPattern === "hard"){
            targetPattern = HARD_PATTERN;
        }
    }
    
    if(UnderScore.isUndefined(param.mode)){
        var paramMode = param.mode;
        targetMode = paramMode;
    }
}

var Cylon = require('cylon');
var Neural = require('./neural.js');
var bendValue;
var pressureValue;
var inputDataArray = [];
var counter = 0;
var HARD_PATTERN = [0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3];
var SOFT_PATTERN = [0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5];
//var targetPattern = HARD_LABEL;
//var mode = "learn";
var PATTERN_ARRAY = [{name:"hard", pattern:HARD_PATTERN},{name:"soft", pattern:SOFT_PATTERN}];
Neural.initialize(10);

Cylon.robot({
	connections: { arduino:{adaptor: 'firmata', port: '/dev/ttyACM0'}},
	devices: {armServo:{driver: 'servo', pin:9},
	          bendSensor:{driver: 'analogSensor', pin:1},
	          pressureSensor:{driver: 'analogSensor', pin:3}},
	work: function(my){
		every((2).second(), function(){ actionFunction(my); });
	}
	}).start();

var actionFunction = function(my){
	bendValue = my.bendSensor.analogRead();
	//console.log("bend = " + bendValue);
	// �Ȃ��Z���T�̒l��270�`210
	// �T�[�{�̊p�x��6�i�K�ɕ����Ď��s
	var angle = Math.round((bendValue - 210) / 10) * 10;
	//for(var i = 0; i < 10; i++){
	//    my.armServo.angle(angle - 10 + i);
	//}
	    my.armServo.angle(angle);

	// 0.3�b��Ɉ��̓f�[�^�𑪂�f�[�^��ێ�����
	setTimeout(measurePressure, 300, my);

	if(counter === 10){
	 console.log("inputDataArray" + inputDataArray);
	 console.log("learn start");
	 if(targetMode === "learn"){
	     Neural.learn(inputDataArray, targetPattern);
	 }else if(targetMode === "classify"){
	     Neural.classify(inputaDataArray, PATTERN_ARRAY);
	 }
	 console.log("learn end");
	 inputDataArray = [];
	 counter = 0;
	}
	//console.log("pressure = " + pressureValue);
};

function measurePressure(my){
	pressureValue = my.pressureSensor.analogRead();
	if(pressureValue != 0){
	console.log("bend = " + bendValue + " pressure = " + pressureValue);
		inputDataArray.push(bendValue/300);
		inputDataArray.push(pressureValue/100);
		// ���j�^�ɋȒl�ƈ��͒l�𑗐M����
		Client.send(JSON.stringify({bend:bendValue,pressure:pressureValue}));
		counter ++;
	}

}
