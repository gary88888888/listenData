var WebSocketServer = require('websocket').server;
var http = require('http');
const mysql = require('mysql');
const MySQLEvents = require('@rodrigogs/mysql-events');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(5050, function() {
    console.log((new Date()) + ' Server is listening on port 5050');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connectionS = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connectionS.on('message', function(message) {
        // console.log(message.binaryData)
        // console.log(message.utf8Data)

        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            connectionS.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connectionS.sendBytes(message.binaryData);
        }
    });
    connectionS.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connectionS.remoteAddress + ' disconnected.');
    });


    // console.log(MySQLEvents.STATEMENTS)
    const program = async () => {
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '0981472880',
    });

    const instance = new MySQLEvents(connection, {
        startAtEnd: true,
        excludedSchemas: {
        mysql: true,
        },
    });

    await instance.start();

    instance.addTrigger({
        name: 'monitioring',
        expression: 'delta.*',
        statement: MySQLEvents.STATEMENTS.ALL,
        onEvent: (event) => { // You will receive the events here
            var updateType = event.type
            console.log(updateType);
            console.log("update data")
            test(event)


        },
    });
    function test(event){
        if(event.type === 'UPDATE'){
            connectionS.sendUTF('time to updata!!');
            console.log("update data")
            }else{
                console.log("error")
            }
    };
    instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, console.error);
    instance.on(MySQLEvents.EVENTS.ZONGJI_ERROR, console.error);
    };

    program()
    .then(() => console.log('Waiting for database events...'))
    .catch(console.error);








});






