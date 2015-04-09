var UnderScore = require('underscore');

// データの正規化を行う
var normalize = function (){

    var array_data;
    var bend_max = -Infinity;
    var bend_min = Infinity;
    var pressure_max = -Infinity;
    var pressure_min = Infinity;
    var result_data;
    var current_pattern;
    
    var calcMaxMin = function(temp){
                             if(bend_max < temp.bend){bend_max = temp.bend;}
                             if(bend_min > temp.bend){bend_min = temp.bend;}
                             if(pressure_max < temp.pressure){pressure_max = temp.pressure;}
                             if(pressure_min > temp.pressure){pressure_min = temp.pressure;}
                          };
                          
    var normalizeData = function(temp){
                            // 結果オブジェクトにパターン毎のオブジェクトを追加する
                            if(UnderScore.isUndefined(result_data[current_pattern])){
                                result_data[current_pattern] = {};
                                result_data[current_pattern].data = [];
                                result_data[current_pattern].input_data = [];
                                result_data[current_pattern].output_data = [];
                            }
                            var normalized_bend = calcNormalize(temp.bend, bend_max, bend_min);
                            var normalized_pressure = calcNormalize(temp.pressure, pressure_max, pressure_min);
                            
                            result_data[current_pattern].data.push({bend:normalized_bend, pressure:normalized_pressure});
                            result_data[current_pattern].input_data.push(normalized_bend);
                            result_data[current_pattern].output_data.push(normalized_pressure);
                        };
    
    var calcNormalize = function(data, max, min){
                            return (data - min) / (max - min);
                        };

    var applyData = function(func){
                            UnderScore.each(array_data,
                                    function(obj){
                                        current_pattern = obj.pattern;
                                        UnderScore.each(obj.data, func);
                                    }
                            );
                    };

    var printData = function(temp){
                        console.log("bend = " + temp.bend + " pressure = " + temp.pressure);
                    };
    
    return {
            forLearn:function(param_data){
                result_data = {};
                array_data = param_data;
                applyData(calcMaxMin);
                applyData(normalizeData);
                applyData(printData);
                return result_data;
                },
            changeDataForClassify:function(param_data){
                return{bend:calcNormalize(param_data.bend, bend_max, bend_min),pressure:calcNormalize(param_data.pressure, pressure_max, pressure_min)};
            }
           
           };
}

var calcSquare = function (array1, array2){
    
    return UnderScore.reduce(UnderScore.map(UnderScore.zip(array1,array2),
        function (obj){
            return calcSquareUnit(obj[0],obj[1])
        }
       ),
       function (x, y){
        return x + y;
       }
    )
}

var calcSquareUnit = function(x,y){
    return Math.pow((x - y),2);
}

var getClassifyData = function(array_data){
        var inputArray = [];
        var outputArray = [];
        
        UnderScore.each(array_data,
                function(obj){
                    inputArray.push(obj.bend);
                    outputArray.push(obj.pressure);
                }
        );
        
        return {inputData:inputArray, outputData:outputArray};
}

module.exports = {
  normalize: normalize,
  calcSquare:calcSquare,
  getClassifyData:getClassifyData
}

