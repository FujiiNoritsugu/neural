var UnderScore = require('underscore');

var test_data = [{pattern:"soft", data:[{bend:1,pressure:10},{bend:2,pressure:9},{bend:3,pressure:8}]},
                 {pattern:"hard", data:[{bend:4,pressure:7},{bend:5,pressure:6},{bend:6,pressure:5}]}];

// データの正規化を行う
var normalize = (function (){

    var array_data;
    var bend_max = -Infinity;
    var bend_min = Infinity;
    var pressure_max = -Infinity;
    var pressure_min = Infinity;

    var calcMaxMin = function(temp){
                             //console.log("bend = " + temp.bend);
                             if(bend_max < temp.bend){bend_max = temp.bend;}
                             if(bend_min > temp.bend){bend_min = temp.bend;}
                             if(pressure_max < temp.pressure){pressure_max = temp.pressure;}
                             if(pressure_min > temp.pressure){pressure_min = temp.pressure;}
                          };
                          
    var normalizeData = function(temp){
                            temp.bend = calcNormalize(temp.bend, bend_max, bend_min);
                            temp.pressure = calcNormalize(temp.pressure, pressure_max, pressure_min);
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
    
    return function(input_data){
                array_data = input_data;
                applyData(calcMaxMin);
                applyData(normalizeData);
                applyData(printData);
                return array_data;
           };
})();

module.exports = {
  normalize: normalize
}

