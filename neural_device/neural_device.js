// モニタ用サーバに接続
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
                    // 学習または分類を行う
                    if(targetMode === "learn"){
                        learnData();
                        targetMode = "inputForClassify";
                    }else if(targetMode === "classify"){
                        Client.send(classifyData());
                    }
console.log("mode = " + targetMode);
                }else if(paramType === "pattern"){
                    // パターンの設定を行う
                    targetPattern = param.value;
                    // 画面にパターンの値を通知する
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

// 結果の配列からパターン毎の学習を行う
function learnData(){

    // データの正規化と結果オブジェクトの作成を行う
    resultObj = Normalize.forLearn(measureArray);
    
    // 正規化したデータを画面で描画させる
    Client.send(JSON.stringify({normalized_data:resultObj}));
    
    // パターン毎の学習を行い、結果ユニットをオブジェクトに追加する
    UnderScore.each(resultObj, 
        function (value, key, list) {
            // データ数10でニューラルオブジェクトを作成
            var neural = Neural.createNeural(10);
            // 入力データと出力データで学習
            neural.learn(value.input_data, value.output_data);
            // ニューラルオブジェクトを追加
            value.neural = neural;
        }
    );
}

// データの分類
function classifyData(){

    var targetPattern = null;
    var minSquare = Math.Infinity;
    var classifyData = Util.getClassifyData(classifyArray.data);
    var classifyInputData = classifyData.inputData;
    var classifyOutputData = classifyData.outputData;

console.log("classifyInputData = " + JSON.stringify(classifyInputData));
console.log("classifyOutputData = " + JSON.stringify(classifyOutputData));

    // 分類を行う
    UnderScore.each(resultObj, 
        function (value, key, list) {
            // 設定したユニットでパターン毎の分類データの出力を行い、実際の出力データとの二乗和誤差を計算する
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
	// 曲げセンサの値は270～210
	// サーボの角度を6段階に分けて実行
	var angle = Math.round((bendValue - 210) / 10) * 10;
	my.armServo.angle(angle);
	// 0.3秒後に圧力データを測りデータを保持する
	setTimeout(measurePressure, 300, my);

    if(counter === 10){
        // 測定値を結果配列に格納する
        
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
	// 測定値30以下は異常値として省く
	if(pressureValue > 30){
        console.log("bend = " + bendValue + " pressure = " + pressureValue);
        var measureObj = {bend:bendValue,pressure:pressureValue};
        // モニタに曲値と圧力値を送信する
        Client.send(JSON.stringify({measure_data:measureObj}));
        
        // 分類用では学習データを下にデータを変換したデータも送信する
	    if(targetMode === "inputForClassify"){
            measureObj = Normalize.changeDataForClassify(measureObj);
            Client.send(JSON.stringify({classify_data:measureObj}));
        }

        inputDataArray.push(measureObj);
        
        counter ++;
	}

}
