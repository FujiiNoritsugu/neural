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
var measureArray = [];
var classifyArray = [];

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
                        targetMode = "inputForClassify";
                    }else if(targetMode === "classify"){
                        Client.send(classifyData());
                    }
console.log("mode = " + targetMode);
                }else if(paramType === "pattern"){
                    // �p�^�[���̐ݒ���s��
                    targetPattern = param.value;
                    // ��ʂɃp�^�[���̒l��ʒm����
                    Client.send(JSON.stringify({pattern:targetPattern}));
                }
            }
        });
    }
}

var Neural = require('./neural.js');
var Util = require('./neural_utils.js');
var Normalize = Util.normalize();
var resultObj;

// ���ʂ̔z�񂩂�p�^�[�����̊w�K���s��
function learnData(){

    // �f�[�^�̐��K���ƌ��ʃI�u�W�F�N�g�̍쐬���s��
    resultObj = Normalize.forLearn(measureArray);
    
    // ���K�������f�[�^����ʂŕ`�悳����
    Client.send(JSON.stringify({normalized_data:resultObj}));
    
    // �p�^�[�����̊w�K���s���A���ʃ��j�b�g���I�u�W�F�N�g�ɒǉ�����
    UnderScore.each(resultObj, 
        function (value, key, list) {
            // �f�[�^��10�Ńj���[�����I�u�W�F�N�g���쐬
            var neural = Neural.createNeural(10);
            // ���̓f�[�^�Əo�̓f�[�^�Ŋw�K
            neural.learn(value.input_data, value.output_data);
            // �j���[�����I�u�W�F�N�g��ǉ�
            value.neural = neural;
        }
    );
}

// �f�[�^�̕���
function classifyData(){

    var targetPattern = null;
    var minSquare = Math.Infinity;
    var classifyData = Util.getClassifyData(classifyArray.data);
    var classifyInputData = classifyData.inputData;
    var classifyOutputData = classifyData.outputData;

console.log("classifyInputData = " + JSON.stringify(classifyInputData));
console.log("classifyOutputData = " + JSON.stringify(classifyOutputData));

    // ���ނ��s��
    UnderScore.each(resultObj, 
        function (value, key, list) {
            // �ݒ肵�����j�b�g�Ńp�^�[�����̕��ރf�[�^�̏o�͂��s���A���ۂ̏o�̓f�[�^�Ƃ̓��a�덷���v�Z����
            value.square = Util.calcSquare(classifyOutputData, value.neural.output(classifyInputData));
            if(value.square < minSquare){
                targetPattern = key;
            }
        }
    );
   
   return targetPattern;
}

var Cylon = require('cylon');
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
        
        if(targetMode === "inputForLearn"){
            measureArray.push({pattern:targetPattern, data:inputDataArray});
        }else if(targetMode == "inputForClassify"){
        
            classifyArray.push({pattern:"classify", data:inputDataArray});
        }
        inputDataArray = [];
        counter = 0;
    }
	//console.log("pressure = " + pressureValue);
};

function measurePressure(my){
	pressureValue = my.pressureSensor.analogRead();
	// ����l30�ȉ��ُ͈�l�Ƃ��ďȂ�
	if(pressureValue > 30){
        console.log("bend = " + bendValue + " pressure = " + pressureValue);
        var measureObj = {bend:bendValue,pressure:pressureValue};
        // ���j�^�ɋȒl�ƈ��͒l�𑗐M����
        Client.send(JSON.stringify({measure_data:measureObj}));
        
        // ���ޗp�ł͊w�K�f�[�^�����Ƀf�[�^��ϊ������f�[�^�����M����
	    if(targetMode === "inputForClassify"){
            measureObj = Normalize.changeDataForClassify(measureObj);
            Client.send(JSON.stringify({classify_data:measureObj}));
        }

        inputDataArray.push(measureObj);
        
        counter ++;
	}

}
