/*
  e_hello_world.c

  Copyright (C) 2012 Adapteva, Inc.
  Contributed by Yaniv Sapir <yaniv@adapteva.com>

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program, see the file COPYING.  If not, see
  <http://www.gnu.org/licenses/>.
*/

// This is the DEVICE side of the Hello World example.
// The host may load this program to any eCore. When
// launched, the program queries the CoreID and prints
// a message identifying itself to the shared external
// memory buffer.

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

#include "e_lib.h"

#define LAYER_SIZE 3
#define UNIT_SIZE 3
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
int neural_main(void);

double input_data[UNIT_SIZE] = {0.3,0.3,0.3};
double output_data[UNIT_SIZE] = {0.1,0.2,0.3};

int counter = 0;

char outbuf[128] SECTION("shared_dram");

int main(void) {
        e_coreid_t coreid;
        int result_counter;

        // Who am I? Query the CoreID from hardware.
        coreid = e_get_coreid();

        // The PRINTF family of functions do not fit
        // in the internal memory, so we link against
        // the FAST.LDF linker script, where these
        // functions a e placed in external memory.
        result_counter = neural_main();
        //result_counter = 1;
        sprintf(outbuf, "Hello World from core 0x%03x! counter = %d", coreid, result_counter);

        return EXIT_SUCCESS;
}

int neural_main(){
    initialize_unit();
    while(1){
        calc_error(input_data, output_data);
        back_propagation(); 
       if(check_loop())break;
    }

    release_unit();

    return counter;
}

int check_loop(){
    counter++;
    int result = 0;
    int i;
  //  printf("i = %d ", counter);
  //  for(i = 0; i < UNIT_SIZE; i++){
  //      printf(",%f", unit[LAYER_SIZE - 1][i].value);
  //  }
  //  printf("\n");
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
