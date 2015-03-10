//------------- for device controll -------------------------
var io = require('socket.io').listen(9080); 
 io.sockets.on('connection', onConnection); 

var deviceSocket;

function onConnection(socket){ 
   console.log("device connection");
   deviceSocket = socket;
   socket.on('message', onMessage); 
} 

function onMessage(message){ 
 console.log("arm message = "+message);
 if(monitorSocket != null){
  monitorSocket.send(message);
 }
} 

//----------- for monitoring -----------------------------
var app = require('http').createServer(handler);
var io = require('socket.io').listen(app);

var fs = require('fs');
var html = fs.readFileSync('neural_monitor.html', 'utf8');

app.listen(8124);

var monitorSocket;

io.sockets.on('connection', function(socket){
    console.log("monitor connection");
    monitorSocket = socket;
    socket.on('message', function(message){
        console.log("monitor message = " + message);
        if(deviceSocket != null){
            deviceSocket.send(message);
        }
    });
});

function handler(req, res){
 res.setHeader('Content-Type', 'text/html');
 res.setHeader('Content-Length', Buffer.byteLength(html, 'utf8'));
 res.end(html);
}
