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
    var paramArray = JSON.parse(message);
    if(UnderScore.isArray(paramArray)){
        UnderScore.each(paramArray, 
        function(param, index, array){
            if(!UnderScore.isUndefined(param.type)){
                var paramType = param.type;
                if(paramType === "mode"){
                    targetMode = param.value;
console.log("mode = " + targetMode);
                }else if(paramType === "pattern"){
                    if(param.value === "soft"){
                        targetPattern = SOFT_PATTERN;
                    }else if(param.value === "hard"){
                        targetPattern = HARD_PATTERN;
                    }
                    
                    // ��ʂɃp�^�[���̒l��ʒm����
                    Client.send(JSON.stringify({pattern:targetPattern}));
                }
            }
        });
    }
}

var HARD_PATTERN = [0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3];
var SOFT_PATTERN = [0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5];

var Cylon = require('cylon');
var Neural = require('./neural.js');
var bendValue;
var pressureValue;
var inputDataArray = [];
var counter = 0;

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
	my.armServo.angle(angle);
	// 0.3�b��Ɉ��̓f�[�^�𑪂�f�[�^��ێ�����
	setTimeout(measurePressure, 300, my);

	if(counter === 10){
	 console.log("inputDataArray" + inputDataArray);
	 if(targetMode === "learn"){
	    console.log("learn start");
	    Client.send(JSON.stringify({message:"Learn Start!!"}));
	     Neural.learn(inputDataArray, targetPattern);
	    console.log("learn end");
	    Client.send(JSON.stringify({message:"Learn End!!"}));
	 }else if(targetMode === "classify"){
        console.log("classify start");
        Client.send(JSON.stringify({message:"Classify Start!!"}));
	     var result = Neural.classify(inputDataArray, PATTERN_ARRAY);
        console.log("classify end");
        Client.send(JSON.stringify({message:"Classify End!!"}));
        // ��ʂɌ��ʂ�ʒm����
        Client.send(JSON.stringify(result));
	 }
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
