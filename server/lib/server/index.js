"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const colyseus_1 = require("colyseus");
const monitor_1 = require("@colyseus/monitor");
// import socialRoutes from "@colyseus/social/express"
const SkyOffice_1 = require("./rooms/SkyOffice");
const port = Number(process.env.PORT || 2567);
const app = express_1.default();
app.use(cors_1.default());
app.use(express_1.default.json());
// app.use(express.static('dist'))
const server = http_1.default.createServer(app);
const gameServer = new colyseus_1.Server({
    server,
});
// register your room handlers
gameServer.define('skyoffice', SkyOffice_1.SkyOffice);
/**
 * Register @colyseus/social routes
 *
 * - uncomment if you want to use default authentication (https://docs.colyseus.io/server/authentication/)
 * - also uncomment the import statement
 */
// app.use("/", socialRoutes);
// register colyseus monitor AFTER registering your room handlers
app.use('/colyseus', monitor_1.monitor());
gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`);
