const express = require('express');
const WebSocket = require('ws');
const SocketServer = require('ws').Server;
const uuidv1 = require('uuid/v1');

// Set the port to 3001
const PORT = 3001;
// Create a new express server
const server = express()
    // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new SocketServer({server});

// Function to broadcast to all.
wss.broadcast = function(data) {
    wss.clients.forEach((client) => {
        client.send(data);
    });
};

//Array of colours to be assigned to users when they connect
const colors = ["#6666CC", "#008B8B", "#EE82EE", "#00008B", "#9eccaf", "#ff8b94", "#a10f6f"]
let colorpicker = 0;


// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.
wss.on('connection', (ws) => {
    console.log('Client connected');
    let totalUsers = wss.clients.size;
    let numberUsers = {
        type: "numberUsers",
        totalUsers: totalUsers,
    }
    wss.broadcast(JSON.stringify(numberUsers));
 
    let colorUser = colors[colorpicker%(colors.length)]; 
    colorpicker++;
    let userColor = {
      type: "userColor",
      color: colorUser
    };
    ws.send(JSON.stringify(userColor))


    ws.on('message', (message) => {
    // Construct a msg object containing the data the server needs 
    //to process the message from the chat client.
   
        const parsedData = JSON.parse(message);
        switch (parsedData.type) {
            case "postMessage":
                let displayMessage = {
                    id: uuidv1(),
                    type: "incomingMessage",
                    username: parsedData.username,
                    content: parsedData.content,
                    color: parsedData.color
                };
                wss.broadcast(JSON.stringify(displayMessage));
                break;

            case "postNotification":
                let displayNotification = {
                    id: uuidv1(),
                    type: "incomingNotification",
                    content: parsedData.content
                };
                let newName = {
                    id: uuidv1(),
                    type: "newUser",
                    newUser: parsedData.newUser
                };
                wss.broadcast(JSON.stringify(displayNotification));
                ws.send(JSON.stringify(newName));
                break;

            default:
                throw new Error("Unknown event type " + message.type);
        }
    });
    
    // Set up a callback for when a client closes the socket. This usually means they closed their browser.
    ws.on('close', () => {
       console.log('Client disconnected');

        let totalUsers = wss.clients.size;
        let numberUsers = {
            type: 'numberUsers',
            totalUsers: totalUsers,
        }
        wss.broadcast(JSON.stringify(numberUsers));
    });

});
