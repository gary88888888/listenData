# Node.js + Vue + MySQL 即時更新資料
為了要實現即時更新前端頁面上的資訊，從原本的setInerval()改變成使用webSocket的技術，來達成伺服器通知前端該進行資料更新，因此我們需要使用以下套件


**server端**

[websocket](https://www.npmjs.com/package/websocket) `npm install websocket` 
[mysql-events](https://www.npmjs.com/package/@rodrigogs/mysql-events) `npm install @rodrigogs/mysql-events` 
[ZongJi](https://github.com/nevill/zongji) `npm install zongji` 


**前端**
[mysql-events](https://github.com/rodrigogs/mysql-events)`npm install @rodrigogs/mysql-events`


為了要使用zonji，需要開啟MySQL的Bin Log 功能 [方法點這裡](https://www.huaweicloud.com/articles/35105c7694796e6f33e2cae022364e93.html)




## 後端程式
```
var WebSocketServer = require('websocket').server;
var http = require('http');
const mysql = require('mysql');
const MySQLEvents = require('@rodrigogs/mysql-events');

var server = http.createServer(function (request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(5050, function () {
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

wsServer.on('request', function (request) {
    if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    var connectionS = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connectionS.on('message', function (message) {
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
    connectionS.on('close', function (reasonCode, description) {
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
                test(event)//call another function


            },
        });
        function test(event) {
            if (event.type === 'UPDATE') {
                connectionS.sendUTF('time to updata!!');
                console.log("update data")
            } else {
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

```
## 前端程式
```
 data() {
    return {
      message: null,
      W3CWebSocket: null,
      client: null,
      number: null,
      databaseChange: false
      }
     },
created: function () {
    this.W3CWebSocket = require("websocket").w3cwebsocket;
    this.client = new this.W3CWebSocket(
      "ws://192.168.1.103:5050/",//根據你後端設定的PORT
      "echo-protocol"
    );
    },
mounted:{
    this.client.onerror = () => {
      console.log("Connection Error");
    };

    this.client.onopen = () => {
      console.log("WebSocket Client Connected");
    };

    this.client.onclose = () => {
      console.log("echo-protocol Client Closed");
    };

    this.client.onmessage = (e) => {//這裡是接收後端所傳送的訊息，可以根據內容做不同的事情
      if (typeof e.data === "string") {
        console.log("Received: '" + e.data + "'");
        if (e.data == "time to updata!!"){//執行function
          console.log("25525");
          this.recieve(e);
          this.dataChange();
        }
      }
    };
}
```

以下是後端repo site :house: [github](https://github.com/gary88888888/listenData/tree/master)
