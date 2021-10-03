"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@colyseus/command");
class PlayerUpdateCommand extends command_1.Command {
    execute(data) {
        const { client, x, y, anim } = data;
        const player = this.room.state.players.get(client.sessionId);
        if (!player)
            return;
        player.x = x;
        player.y = y;
        player.anim = anim;
    }
}
exports.default = PlayerUpdateCommand;
