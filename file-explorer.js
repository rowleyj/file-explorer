const express = require('express')
const app = express()
const port = 3000;

app.use(express.static('public'))

// Get input directory list
const dirsToWatch = process.argv.slice(2)

const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: 8080 });
const DirectoryWatcher = require('./modules/directoryWatcher');

const watchers = [];

/**
 * Initializes a new directory watcher with listeners
 * @param {WebSocket} ws 
 * @param {string} dir - path
 */
function addWatcher (ws, dir) {
    let watcher = new DirectoryWatcher(ws, dir)
    watcher.watchDirs()
    watchers.push(watcher);
}

/**
 * Listens for Websocket connection, then adds listener for messages
 */
wss.on('connection', function connection (ws, req) {
    ws.on('message', function incoming (message) {
        let msg = JSON.parse(message);
        if (msg.data === 'ping' && ws.readyState === 1) {
            ws.send(JSON.stringify({ data: 'pong' }));
        } else if (msg.data && msg.data.add) {
            addWatcher(ws, msg.data.add);
        }
    });

    // Add watcher with websocket for new connections
    // Handles disconnect + reconnect from client
    dirsToWatch.forEach(dir => {
        addWatcher(ws, dir);
    })

    /**
     * Do not attempt reconnect - disconnection is handled clientside
     */
    ws.on('error', (err) => console.log('ERROR', err))
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})