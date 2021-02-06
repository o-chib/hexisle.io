/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/server/server.ts":
/*!******************************!*\
  !*** ./src/server/server.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";
eval("var __dirname = \"/\";\n\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nconst path_1 = __importDefault(__webpack_require__(/*! path */ \"path\"));\nconst express_1 = __importDefault(__webpack_require__(/*! express */ \"express\"));\nconst http_1 = __importDefault(__webpack_require__(/*! http */ \"http\"));\n//const Game = require('./game');\nconst Socketio = __webpack_require__(/*! socket.io */ \"socket.io\");\nconst Constsants = __webpack_require__(/*! ../shared/constants */ \"./src/shared/constants.js\");\n// Serve up the static files from public\nconst app = express_1.default();\napp.use(express_1.default.static('public'));\napp.get(\"/\", (req, res) => {\n    res.sendFile(path_1.default.join(__dirname, \"public/index.html\"));\n});\n// Start listening for people to connect\nconst ip = process.env.IP || \"localhost\";\nconst port = process.env.PORT || 3000;\nconst server = http_1.default.createServer(app).listen(port, () => {\n    console.log(\"Server started:  http://\" + ip + \":\" + port);\n});\n// Start Socket.io connection\nconst websocket = Socketio(server);\nwebsocket.on('connection', socket => {\n    console.log('Player connected!', socket.id);\n});\n// Start the game\n//const game = new Game();\n\n\n//# sourceURL=webpack://team-io-game/./src/server/server.ts?");

/***/ }),

/***/ "./src/shared/constants.js":
/*!*********************************!*\
  !*** ./src/shared/constants.js ***!
  \*********************************/
/***/ (() => {

eval("\n\n//# sourceURL=webpack://team-io-game/./src/shared/constants.js?");

/***/ }),

/***/ "express":
/*!**************************!*\
  !*** external "express" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = require("express");;

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");;

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");;

/***/ }),

/***/ "socket.io":
/*!****************************!*\
  !*** external "socket.io" ***!
  \****************************/
/***/ ((module) => {

"use strict";
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