var http = require("http").createServer(handler); // on req - hand
var fs = require("fs"); // variable for file system for providing html
var firmata = require("firmata");
const WebSocket = require('ws'); // for permanent connection between server and client
const wss = new WebSocket.Server({port: 8888}); // websocket port is 8888
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
  });
};

wss.sendToLastWs = function sendToLastWs(data) {
    if (wss.clients[wss.clients.length-1] !== undefined) { // if websocket exist
        if (wss.clients[wss.clients.length-1].readyState === WebSocket.OPEN) { // if it is connected
            wss.clients[wss.clients.length-1].send(data); // send to the last connected client - to only one client's websocket
        }
    }
};

var messageJSON;
console.log("Starting the code");
var board = new firmata.Board("/dev/ttyACM0", function(){
    console.log("Connecting to Arduino");
    console.log("Activation of Pin 8");
    board.pinMode(8, board.MODES.OUTPUT); // Configures the specified pin to behave either as an input or an output.
    console.log("Activation of Pin 9");
    board.pinMode(9, board.MODES.OUTPUT); // Configures the specified pin to behave either as an input or an output.
    console.log("Activation of Pin 10");
    board.pinMode(10, board.MODES.OUTPUT); // Configures the specified pin to behave either as an input or an output.


    console.log("Enabling analog Pin 0");
    board.pinMode(0, board.MODES.ANALOG); // analog pin 0
    console.log("Enabling analog Pin 1");
    board.pinMode(1, board.MODES.ANALOG); // analog pin 1
});

function handler(req, res) {
    fs.readFile(__dirname + "/assignment04.html",
    function (err, data) {
        if (err) {
            res.writeHead(500, {"Content-Type": "text/plain"});
            return res.end("Error loading html page.");
        }
    res.writeHead(200);
    res.end(data);
    })
}

var desiredValue = 0; // desired value var
var actualValue = 0; // variable for actual value (output value)
var difference = 0;  // difference between desired and actual value
http.listen(8080); // server will listen on port 8080
board.on("ready", function() {
    board.analogRead(0, function(value){
        desiredValue = value; // continuous read of analog pin 0
    });
    board.analogRead(1, function(value) {
    actualValue = value; // continuous read of pin A1
    });
    

    wss.on('connection', function (ws, req) { // start of wss code
        messageJSON = {"type": "message", "content": "Srv connected, board OK"};
        ws.send(JSON.stringify(messageJSON));
        //console.log(wss.clients[1]);
        setInterval(sendValues, 40); // on 40ms we send message to client
    }); // end of sockets.on connection
}); // end of board.on(ready)

function sendValues () {
    
    difference = desiredValue - actualValue;
    console.log(difference);
    //Blue LED
    if (difference > 0) {
        console.log('>');
        board.digitalWrite(10, board.HIGH);
        board.digitalWrite(8, board.LOW);
        board.digitalWrite(9, board.LOW);
    };
    
    //Green LED
    if (difference == 0) {
        console.log('=');
        board.digitalWrite(9, board.HIGH);
        board.digitalWrite(8, board.LOW);
        board.digitalWrite(10, board.LOW);
    };
    //Red LED
    if (difference < 0) {
        console.log('<');
        board.digitalWrite(8, board.HIGH);
        board.digitalWrite(9, board.LOW);
        board.digitalWrite(10, board.LOW);
    };

    wss.broadcast(JSON.stringify({"type": "clientReadValues", "desiredValue": desiredValue, "actualValue": actualValue, "difference": difference}));
};