const express = require("express");
const ws = require("ws");
const http = require("http");
var util = require("util");

const app = express();
const port = 3000;

const server = http.createServer(app);

const wss = new ws.Server({ server });

function createMessage(content, isBroadcast = false, sender = "NS") {
  return JSON.stringify({ content, isBroadcast, sender });
}

function sendToAll(message) {
  wss.clients.forEach((client) => {
    client.send(JSON.stringify(message));
  });
}

wss.on("connection", (ws) => {
  ws.isAlive = true;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (msg) => {
    const message = JSON.parse(msg);
    console.log(message.sender);

    setTimeout(() => {
      if (message.isBroadcast) {
        //send back the message to the other clients
        wss.clients.forEach((client) => {
          if (client != ws) {
            client.send(createMessage(message.content, true, message.sender));
          }
        });
      }

      ws.send(
        createMessage(`You sent -> ${message.content}`, message.isBroadcast)
      );
    }, 1000);
  });

  //send immediatly a feedback to the incoming connection
  ws.send(createMessage("Hi there, I am a WebSocket server"));

  ws.on("error", (err) => {
    console.warn(`Client disconnected - reason: ${err}`);
  });
});

// setInterval(() => {
//   wss.clients.forEach((ws) => {
//     if (!ws.isAlive) return ws.terminate();

//     ws.isAlive = false;
//     ws.ping(null, undefined);
//   });
// }, 10000);

// Your own super cool function
var logger = function (req, res, next) {
  req.rawBody = "";
  req.on("data", (chunk) => {
    req.rawBody += chunk;
  });
  req.on("end", () => {
    console.log("GOT REQUEST !");
    console.log(req.rawBody);
    sendToAll({
      method: req.method,
      headers: req.headers,
      rawBody: req.rawBody,
      bodyJson: JSON.parse(req.rawBody),
    });
    //   console.log(req);
    res.send("FINISHED");
  });
  //   console.log("GOT REQUEST !");
  //   console.log(req);
  //   sendToAll({ method: req.method, body: req.body });
  //   //   console.log(req);
  //   res.send("FINISHED");
  //   next(); // Passing the request to the next handler in the stack.
};

app.use(logger); // Here you add your logger to the stack.

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

server.listen(3001, () => {
  console.log(`Server listening on port ${server.address().port}`);
});
