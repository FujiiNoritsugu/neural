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
var measureArray;
var classifyArray;

function onMessage(message){
    var paramArray = JSON.parse(message);
    if(UnderScore.isArray(paramArray)){
        UnderScore.each(paramArray, 
        function(param, index, array){
            if(!UnderScore.isUndefined(param.type)){
                var paramType = param.type;
                if(paramType === "mode"){
                    targetMode = param.value;
                    // �w�K�܂��͕��ނ��s��
                    if(targetMode === "learn"){
                        learnData();
                    }else if(targetMode === "classify"){
                        classifyData();
                    }
console.log("mode = " + targetMode);
                }else if(paramType === "pattern"){
                    // ��ʂɃp�^�[���̒l��ʒm����
                    Client.send(JSON.stringify({pattern:targetPattern}));
                }
            }
        });
    }
}

var Util = require('./neural_utils.js');
var resultObj;
// ���ʂ̔z�񂩂�p�^�[�����̊w�K���s��
function learnData(){

    // �f�[�^�̐��K���ƌ��ʃI�u�W�F�N�g�̍쐬���s��
    resultObj = Util.normalize.forLearn(measureArray);
    
    // �p�^�[�����̊w�K���s���A���ʃ��j�b�g���I�u�W�F�N�g�ɒǉ�����
    UnderScore.each(resultObj, 
        function (value, key, list) {
            // �f�[�^��10�ŏ�����
            Neural.initialze(10);
            // ���̓f�[�^�Əo�̓f�[�^�Ŋw�K
            Neural.lean(value.input_data, value.output_data);
            // ���ʃ��j�b�g���I�u�W�F�N�g�ɒǉ�
            value.unit = Neural.getUnit();
        }
    );
}

// �f�[�^�̕���
function classifyData(){
    // �w�K�p�f�[�^�����ɐ��K�����s��
    var classifyObj = Util.normalizeClassify(classifyArray);
    
    // ���ނ��s��
    var outputObj = [];
        UnderScore.each(resultObj, 
        function (value, key, list) {
            // ���ʃ��j�b�g���I�u�W�F�N�g�ɐݒ�
            Neural.setUnit(value.unit);
            // �ݒ肵�����j�b�g�Ńp�^�[�����̕��ރf�[�^�̏o�͂��s�����a�덷���v�Z����
            value.square = Util.calcSquare(value.output, Neural.output(classifyObj.input_data));
        }

    );
}


var Cylon = require('cylon');
var Neural = require('./neural.js');
var bendValue;
var pressureValue;
var inputDataArray = [];
var counter = 0;

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
        // ����l�����ʔz��Ɋi�[����
        
        if(targetMode === "learn"){
            measureArray.push({pattern:targetPattern, data:inputDataArray});
        }else if(targetMode == "classify"){
        
            classifyArray.push({pattern:targetMode, data:inputDataArray});
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
	    // ����l��ޔ�
		inputDataArray.push({bend:bendValue,pressure:pressureValue});
		// ���j�^�ɋȒl�ƈ��͒l�𑗐M����
		Client.send(JSON.stringify({bend:bendValue,pressure:pressureValue}));
		counter ++;
	}

}
