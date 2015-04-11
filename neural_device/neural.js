function createNeural(dataSize){

var LAYER_SIZE = 20;
var UNIT_SIZE;
var SIGMOID_PARAM = 0.3;
var LEARNING_PARAM = 0.1;
var INITIAL_INPUT_WEIGHT = 0.0;

var unit = [];
var counter = 0;

initialize_unit(dataSize);

function initialize_unit(dataSize){

    // ユニット配列を初期化する
    unit = [];
    UNIT_SIZE = dataSize;

    var tempArray = [];
    for(var i = 0; i < LAYER_SIZE; i++){
     for(var j = 0; j < UNIT_SIZE; j++){
        tempArray.push({
                         value:0.0,
                         output_unit:[],
                         input_unit:[],
                         input_weight:[],
                         sigma:0.0
                       });
     }
     unit.push(tempArray);
     tempArray = [];
    }
    
    for(var i = 0; i < LAYER_SIZE; i++){
        for(var j = 0; j < UNIT_SIZE; j++){
            
            if( i != LAYER_SIZE - 1){
             unit[i][j].output_unit = unit[i+1];
            }
            
            if( i != 0){
             unit[i][j].input_unit = unit[i-1];
            }
            
            for(var k = 0; k < LAYER_SIZE; k++){
                 unit[i][j].input_weight[k] = INITIAL_INPUT_WEIGHT;
            }

        }
    }
}

function check_loop(output_data){
    counter++;
    var result = true;
    console.log("i = %d ", counter);
    for(var i = 0; i < UNIT_SIZE; i++){
        console.log(unit[LAYER_SIZE - 1][i].value);
    }
    console.log("\n");
    for(var i = 0; i < UNIT_SIZE; i++){
        if(Math.round(100*unit[LAYER_SIZE - 1][i].value) != Math.round(100*output_data[i])){
           result = false;
           break;
        }
    }
    
    // 10000回以上計算しても収束しなければそのまま終了
    if(counter > 10000){
        console.log("loop counter 10000 over !!");
        result = true;
    }
    return result;
}

function back_propagation(){

    for(var i = LAYER_SIZE - 2; i > 0; i--){
      for(j = 0; j < UNIT_SIZE; j++){
       unit[i][j].sigma = calc_sigma(unit[i][j], j);
      }
    }

    for(var i = 1; i < LAYER_SIZE; i++){
      for(var j = 0; j < UNIT_SIZE; j++){
        for(var k = 0; k < UNIT_SIZE; k++){
             var diff = unit[i][j].sigma * unit[i][j].input_unit[k].value; 
             unit[i][j].input_weight[k] = unit[i][j].input_weight[k] - LEARNING_PARAM * diff;
        }
      }
    }
     
}

function calc_sigma(unit, unit_index){

   var sum = 0.0;
   for(var i = 0; i < UNIT_SIZE; i++){
        sum += (unit.output_unit[i].sigma * unit.output_unit[i].input_weight[unit_index]); 
   }

    return ((1 - Math.pow(unit.value,2.0)) * sum); 
}

function calc_error(input_data, output_data){

    for(var i = 0; i < UNIT_SIZE; i++){
        unit[0][i].value = input_data[i];
    }

    calc_all();

    for(var i = 0; i < UNIT_SIZE; i++){
        unit[LAYER_SIZE - 1][i].sigma = unit[LAYER_SIZE - 1][i].value - output_data[i];
    }

}

function calc_all(){

    for(var i = 1; i < LAYER_SIZE; i++){
        for(var j = 0; j < UNIT_SIZE; j++){
            unit[i][j].value = sigmoid(SIGMOID_PARAM, calc_unit(unit[i][j]));
        }
    }
}

function sigmoid(a, x){
    return 1 / ( 1 + Math.exp(-1*a*x));
}

function calc_unit(temp){
    var result = 0.0;
    for(var i = 0; i < UNIT_SIZE; i++){
      result += (temp.input_unit[i].value * temp.input_weight[i]);
    }
    return result;
}

return {
    learn : function(input_data, output_data){

        while(true){
            calc_error(input_data, output_data);
            back_propagation(); 
            if(check_loop(output_data))break;
        }

    },

    output : function (param_input){

        // 今までの重みで出力を計算する。
        for(var i = 0; i < UNIT_SIZE; i++){
            unit[0][i].value = param_input[i];
        }
    
        calc_all();

        // 計算結果を配列に変換し出力する
        var target_array = [];
        for(var k = 0; k < UNIT_SIZE; k++){
            target_array.push(unit[LAYER_SIZE - 1][k].value);
        }

        return target_array;
    }

};

}

module.exports = {
  createNeural: createNeural
}
