const chokidar = require('chokidar');
const path = require('path');

/**
 * Class using chokidar to watcher a directory for file changes and
 * send updates to client via websocket
 */
class DirectoryWatcher {
    /**
     * Use existing websocket and input directory
     * @param {WebSocket} ws 
     * @param {string} dir
     */
    constructor(ws, dir) {
        this.ws = ws;
        this.dir = dir;
        this.watcher = null;
    }

    /**
     * Setup Chokidar FSWatcher with attached updated
     */
    watchDirs () {
        this.watcher = chokidar.watch(this.dir, {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true
        });
        this.watcher
            .on('addDir', dirPath => {
                this.sendUpdate({ add: this.parsePathUpdate(dirPath) })
            })
            .on('unlinkDir', dirPath => {
                this.sendUpdate({ remove: this.parsePathUpdate(dirPath) })
            })
            .on('add', dirPath => this.sendUpdate({ add: this.parsePathUpdate(dirPath) }))
            .on('unlink', dirPath => this.sendUpdate({ remove: this.parsePathUpdate(dirPath) }));
    }

    /**
     * Returns an array of the path [grandparent, parent,...]
     * @param {string} dirPath 
     */
    parsePathUpdate (dirPath) {
        return dirPath.split('\\');
    }

    /**
     * 
     * @param {Object} update - key/val for add/remove and filepath
     */
    sendUpdate (update) {
        const msg = {
            data: {
                dir: this.dir, update
            }
        }
        if (this.ws.readyState === 1) {
            this.ws.send(JSON.stringify(msg));
        } else {
            console.log('Please refresh websocket');
        }
    }
}

module.exports = DirectoryWatcher;