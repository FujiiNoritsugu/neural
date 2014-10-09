#include <stdio.h>
#include <stdlib.h>
#include <math.h>

#define LAYER_SIZE 3
#define UNIT_SIZE 10
#define SIGMOID_PARAM 0.3
#define LEARNING_PARAM 0.1

typedef struct _unit{
    double value;
    struct _unit * output_unit;
    struct _unit * input_unit;
    double * input_weight;
    double sigma;
} Unit;

Unit ** unit;

double sigmoid(double a, double x);
void back_propagation(void);
double calc_sigma(Unit unit, int unit_index);
void calc_error(double *input_data, double *output_data);
void initialize_unit(void);
void release_unit(void);
void calc_all(void);
double calc_unit(Unit unit);
int check_loop(void);

double input_data[UNIT_SIZE] = {0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3};
double output_data[UNIT_SIZE] = {0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0};
int counter = 0;

int main(int * argc, char ** argv){
    initialize_unit();
    while(1){
        calc_error(input_data, output_data);
        back_propagation(); 
        if(check_loop())break;
   }

    release_unit();
}

int check_loop(){
    counter++;
    int result = 0;
    int i;
    printf("i = %d ", counter);
    for(i = 0; i < UNIT_SIZE; i++){
        printf(",%f", unit[LAYER_SIZE - 1][i].value);
    }
    printf("\n");
    for(i = 0; i < UNIT_SIZE; i++){
        if((int)round(100*unit[LAYER_SIZE - 1][i].value) != (int)round(output_data[i]*100))break; 
        result = 1;
    }
    return result;

}

double sigmoid(double a, double x){
    return 1 / ( 1 + exp(-1*a*x));
}

void back_propagation(){
    int i,j,k;
    for(i = LAYER_SIZE - 2; i > 0; i--){
      for(j = 0; j < UNIT_SIZE; j++){
       unit[i][j].sigma = calc_sigma(unit[i][j], j);
      }
    }

    for(i = 1; i < LAYER_SIZE; i++){
      for(j = 0; j < UNIT_SIZE; j++){
        for(k = 0; k < UNIT_SIZE; k++){
             double diff = unit[i][j].sigma * unit[i][j].input_unit[k].value; 
             unit[i][j].input_weight[k] = unit[i][j].input_weight[k] - LEARNING_PARAM * diff;
        }
      }
    }
     
}

double calc_sigma(Unit unit, int unit_index){
   int i; 
   double sum = 0.0;
   for(i = 0; i < UNIT_SIZE; i++){
        sum += (unit.output_unit[i].sigma * unit.output_unit[i].input_weight[unit_index]); 
   }

    return ((1 - pow(unit.value,2.0)) * sum); 
}

void calc_error(double *input_data, double *output_data){
    int i;
    for( i = 0; i < UNIT_SIZE; i++){
        unit[0][i].value = input_data[i];
    }

    calc_all();

    for(i = 0; i < UNIT_SIZE; i++){
        unit[LAYER_SIZE - 1][i].sigma = unit[LAYER_SIZE - 1][i].value - output_data[i];

    }

}

void calc_all(){
    int i,j;
    for(i = 1; i < LAYER_SIZE; i++){
        for(j = 0; j < UNIT_SIZE; j++){
            unit[i][j].value = sigmoid(SIGMOID_PARAM, calc_unit(unit[i][j]));
        }
    }
}

double calc_unit(Unit unit){
    int i;
    double result = 0.0;
    for(i = 0; i < UNIT_SIZE; i++){
      result += (unit.input_unit[i].value * unit.input_weight[i]);
    }
    return result;
}

void initialize_unit(){
    int i,j;
    unit = (Unit **)calloc(LAYER_SIZE, sizeof(Unit)*UNIT_SIZE);
    for(i = 0; i < LAYER_SIZE; i++){
     unit[i] = (Unit *)calloc(UNIT_SIZE, sizeof(Unit));
     for(j = 0; j < UNIT_SIZE; j++){
        unit[i][j].value = 0.0;
        unit[i][j].sigma = 0.0;
        if(i != 0){
           unit[i][j].input_unit = (Unit *)calloc(UNIT_SIZE,sizeof(Unit));
           unit[i][j].input_unit = unit[i-1]; 
           unit[i][j].input_weight = (double *)calloc(UNIT_SIZE, sizeof(double));
        }
     }
    }
    for(i = 0; i < LAYER_SIZE - 1; i++){
        for(j = 0; j < UNIT_SIZE; j++){
            unit[i][j].output_unit = (Unit *)calloc(UNIT_SIZE, sizeof(Unit));
            unit[i][j].output_unit = unit[i+1];
        }
    }
}

void release_unit(){
    int i,j;
    for(i = 0; i < LAYER_SIZE; i++){
     for(j = 0; j < UNIT_SIZE; j++){
      if(i != 0){
       free(unit[i][j].input_weight);
      }
     }
     free(unit[i]);
    }
    free(unit);
}
