// Debug script for player visibility issues
// Run this in browser console when connected to the game

console.log('🔍 Player Visibility Debug Script');
console.log('================================');

// Check if game instance exists
if (typeof window.game !== 'undefined') {
  const game = window.game;
  
  console.log('📊 Game State Information:');
  console.log(`- Other players in map: ${game.otherPlayerMap.size}`);
  console.log(`- Other players in group: ${game.otherPlayers.children.size}`);
  console.log(`- Network connected: ${game.network ? 'Yes' : 'No'}`);
  
  console.log('\n👥 Player Details:');
  game.otherPlayerMap.forEach((player, id) => {
    console.log(`Player ${id}:`);
    console.log(`  - Name: ${player.playerName?.text || 'Unknown'}`);
    console.log(`  - Position: (${player.x}, ${player.y})`);
    console.log(`  - Visible: ${player.visible}`);
    console.log(`  - Active: ${player.active}`);
    console.log(`  - Texture: ${player.texture?.key || 'Unknown'}`);
  });
  
  console.log('\n🌐 Network Information:');
  if (game.network && game.network.room) {
    const room = game.network.room;
    console.log(`- Room ID: ${room.id}`);
    console.log(`- Session ID: ${room.sessionId}`);
    console.log(`- Players in room state: ${Object.keys(room.state.players).length}`);
    
    Object.keys(room.state.players).forEach(playerId => {
      const player = room.state.players[playerId];
      console.log(`  - Server Player ${playerId}: ${player.name} at (${player.x}, ${player.y})`);
    });
  }
  
  console.log('\n🎮 Debug Commands:');
  console.log('1. To manually test player creation:');
  console.log('   game.handlePlayerJoined({x: 100, y: 100, name: "TestPlayer", anim: "adam_idle_down"}, "test123")');
  console.log('2. To check phaser events:');
  console.log('   Check console for logs with 🎮, 🔄, 🌐, 👋 prefixes');
  console.log('3. To force refresh players:');
  console.log('   location.reload()');
  
} else {
  console.log('❌ Game instance not found');
  console.log('Make sure you are on the game screen and connected to a room');
}