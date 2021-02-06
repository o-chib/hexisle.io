/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/server/clientConnection.ts":
/*!****************************************!*\
  !*** ./src/server/clientConnection.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.clientConnection = void 0;\nconst gameComm_1 = __webpack_require__(/*! ./gameComm */ \"./src/server/gameComm.ts\");\nfunction clientConnection(io) {\n    let currentUsers = []; //array to store socketids and player data of each connection\n    io.on('connection', function (socket) {\n        gameComm_1.GameCommunication(io, socket, currentUsers);\n        //remove the users data when they disconnect.\n        socket.on('disconnect', function () {\n            removeUser(currentUsers, socket);\n        });\n    });\n    setInterval(() => {\n        var time = new Date();\n        console.log(currentUsers.length + \" logged in @ \" + time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }));\n    }, 5000);\n}\nexports.clientConnection = clientConnection;\nfunction removeUser(currentUsers, socket) {\n    let u = currentUsers.filter((user) => { return user.socketId == socket.id; });\n    if (u && u[0]) {\n        socket.broadcast.emit(\"remove player\", u[0].socketId);\n        currentUsers.splice(currentUsers.indexOf(u[0]), 1);\n    }\n    socket.removeAllListeners();\n}\n\n\n//# sourceURL=webpack://team-io-game/./src/server/clientConnection.ts?");

/***/ }),

/***/ "./src/server/gameComm.ts":
/*!********************************!*\
  !*** ./src/server/gameComm.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.GameCommunication = void 0;\nfunction GameCommunication(io, socket, currentUsers) {\n    let recentUpdates = []; //array to store socketids and player data of each connection\n    socket.on('player update', function (data) {\n        let p = recentUpdates.filter(update => update.socketId == data.socketId);\n        if (p && p[0]) {\n            let player = p[0];\n            player.x = data.x;\n            player.y = data.y;\n            player.angle = data.angle;\n            player.vx = data.vx,\n                player.vy = data.vy;\n        }\n        else {\n            recentUpdates.push(data);\n        }\n    });\n    socket.on(\"ready\", () => {\n        let newPlayer = createNewUser(socket);\n        socket.emit(\"first hi\", newPlayer, currentUsers);\n        socket.broadcast.emit(\"add opponent\", newPlayer);\n        currentUsers.push(newPlayer); //add user for data tracking/sharing\n    });\n    setInterval(() => {\n        io.emit(\"update all\", recentUpdates);\n        recentUpdates.forEach(data => {\n            let p = currentUsers.filter((user) => {\n                return user.socketId == data.socketId;\n            });\n            if (p && p[0]) {\n                let player = p[0];\n                player.x = data.x;\n                player.y = data.y;\n                player.angle = data.angle;\n                player.vx = data.vx,\n                    player.vy = data.vy;\n            }\n        });\n        recentUpdates.length = 0;\n    }, 100 / 30);\n    function createNewUser(socket) {\n        let d = new Date();\n        let time = d.toLocaleString('en-US', {\n            hour12: true,\n            timeZone: 'America/Los_Angeles'\n        });\n        let user = {\n            socketId: socket.id,\n            loginTime: new Date().getTime(),\n            x: 200 + Math.random() * 600,\n            y: 100 + Math.random() * 200,\n            angle: Math.random() * 180,\n            color: \"0x\" + Math.floor(Math.random() * 16777215).toString(16),\n            vx: 1 - Math.random() * 2,\n            vy: 1 - Math.random() * 2\n        };\n        return user;\n    }\n}\nexports.GameCommunication = GameCommunication;\n\n\n//# sourceURL=webpack://team-io-game/./src/server/gameComm.ts?");

/***/ }),

/***/ "./src/server/server.ts":
/*!******************************!*\
  !*** ./src/server/server.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

eval("var __dirname = \"/\";\n\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nconst path_1 = __importDefault(__webpack_require__(/*! path */ \"path\"));\nconst express_1 = __importDefault(__webpack_require__(/*! express */ \"express\"));\nconst http_1 = __importDefault(__webpack_require__(/*! http */ \"http\"));\nconst clientConnection_1 = __webpack_require__(/*! ./clientConnection */ \"./src/server/clientConnection.ts\");\nconst app = express_1.default();\nconst server = http_1.default.createServer(app);\nconst websocket = __webpack_require__(/*! socket.io */ \"socket.io\")(server);\n// Serve up the static files from public\napp.use(express_1.default.static('public'));\napp.get(\"/\", (req, res) => {\n    res.sendFile(path_1.default.join(__dirname, \"public/index.html\"));\n});\n// Start listening for people to connect\nconst ip = process.env.IP || \"localhost\";\nconst port = process.env.PORT || 3000;\nserver.listen(port, () => {\n    console.log(\"Server started:  http://\" + ip + \":\" + port);\n});\n// Start Socket.io connection\nclientConnection_1.clientConnection(websocket);\n\n\n//# sourceURL=webpack://team-io-game/./src/server/server.ts?");

/***/ }),

/***/ "express":
/*!**************************!*\
  !*** external "express" ***!
  \**************************/
/***/ ((module) => {

module.exports = require("express");;

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");;

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");;

/***/ }),

/***/ "socket.io":
/*!****************************!*\
  !*** external "socket.io" ***!
  \****************************/
/***/ ((module) => {

module.exports = require("socket.io");;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	// startup
/******/ 	// Load entry module
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	__webpack_require__("./src/server/server.ts");
/******/ })()
;