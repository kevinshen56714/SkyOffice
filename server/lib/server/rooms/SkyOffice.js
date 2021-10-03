"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkyOffice = void 0;
const colyseus_1 = require("colyseus");
const command_1 = require("@colyseus/command");
const OfficeState_1 = require("./schema/OfficeState");
const Messages_1 = require("../../types/Messages");
const PlayerUpdateCommand_1 = __importDefault(require("./commands/PlayerUpdateCommand"));
class SkyOffice extends colyseus_1.Room {
    constructor() {
        super(...arguments);
        this.dispatcher = new command_1.Dispatcher(this);
    }
    onCreate(options) {
        this.setState(new OfficeState_1.OfficeState());
        // when receiving updatePlayer message, call the PlayerUpdateCommand
        this.onMessage(Messages_1.Message.UPDATE_PLAYER, (client, message) => {
            this.dispatcher.dispatch(new PlayerUpdateCommand_1.default(), {
                client,
                x: message.x,
                y: message.y,
                anim: message.anim,
            });
        });
        // when a player is ready to connect, call the PlayerReadyToConnectCommand
        this.onMessage(Messages_1.Message.READY_TO_CONNECT, (client) => {
            const player = this.state.players.get(client.sessionId);
            if (player)
                player.readyToConnect = true;
        });
        // when a player disconnect a stream, broadcast the signal to the other player connected to the stream
        this.onMessage(Messages_1.Message.DISCONNECT_STREAM, (client, message) => {
            this.clients.forEach((cli) => {
                if (cli.sessionId === message.clientId) {
                    cli.send(Messages_1.Message.DISCONNECT_STREAM, client.sessionId);
                }
            });
        });
    }
    onJoin(client, options) {
        this.state.players.set(client.sessionId, new OfficeState_1.Player());
    }
    onLeave(client, consented) {
        if (this.state.players.has(client.sessionId)) {
            this.state.players.delete(client.sessionId);
        }
    }
    onDispose() {
        console.log('room', this.roomId, 'disposing...');
    }
}
exports.SkyOffice = SkyOffice;
