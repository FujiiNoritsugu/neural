var UnderScore = require('underscore');

// データの正規化を行う
var normalize = (function (){

    var array_data;
    var bend_max = -Infinity;
    var bend_min = Infinity;
    var pressure_max = -Infinity;
    var pressure_min = Infinity;
    var result_data;
    
    var calcMaxMin = function(temp){
                             if(bend_max < temp.bend){bend_max = temp.bend;}
                             if(bend_min > temp.bend){bend_min = temp.bend;}
                             if(pressure_max < temp.pressure){pressure_max = temp.pressure;}
                             if(pressure_min > temp.pressure){pressure_min = temp.pressure;}
                          };
                          
    var normalizeData = function(temp){
                            if(UnderScore.isUndefined(result_data[temp.pattern])){
                                result_data[temp.pattern] = {};
                                result_data[temp.pattern].input_data = [];
                                result_data[temp.pattern].output_data = [];
                            }
                            result_data[temp.pattern].input_data.push(calcNormalize(temp.bend, bend_max, bend_min));
                            result_data[temp.pattern].output_data.push(temp.pressure = calcNormalize(temp.pressure, pressure_max, pressure_min));
                        };
    
    var calcNormalize = function(data, max, min){
                            return (data - min) / (max - min);
                        };

    var applyData = function(func){
                            UnderScore.each(array_data,
                                    function(obj){
                                        //console.log("pattern = " + obj.pattern);
                                        UnderScore.each(obj.data, func);
                                    }
                            );
                    };

    var printData = function(temp){
                        console.log("bend = " + temp.bend + " pressure = " + temp.pressure);
                    };
    
    return {
            forLearn:function(input_data){
                result_data = {};
                array_data = input_data;
                applyData(calcMaxMin);
                applyData(normalizeData);
                applyData(printData);
                return result_data;
                },
            forClassify:function(input_data){
                result_data = {};
                array_data = input_data;
                applyData(normalizeData);
                return result_data;
            }
           
           };
})();

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

module.exports = {
  normalize: normalize,
  calcSquare:calcSquare
}

