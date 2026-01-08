// Debug script for video call reconnection functionality
// Run this in browser console when connected to the game

console.log('🔄 Video Reconnection Debug Script');
console.log('==================================');

// Check connection states
function checkConnectionStates() {
  if (typeof window.game !== 'undefined') {
    const game = window.game;
    console.log('🔍 Connection States:');
    
    game.otherPlayerMap.forEach((player, id) => {
      const timeSinceOverlap = player.lastOverlapTime > 0 ? Date.now() - player.lastOverlapTime : 'Never';
      console.log(`Player ${id}:`);
      console.log(`  - Connected: ${player.connected}`);
      console.log(`  - Last overlap: ${timeSinceOverlap}ms ago`);
      console.log(`  - Buffer time: ${player.connectionBufferTime}ms`);
      console.log(`  - Position: (${Math.round(player.x)}, ${Math.round(player.y)})`);
    });
    
    if (game.network?.webRTC) {
      console.log('\n🌐 WebRTC State:');
      console.log(`  - Active peers: ${game.network.webRTC.peers.size}`);
      console.log(`  - Called peers: ${game.network.webRTC.onCalledPeers.size}`);
    }
  }
}

// Force disconnect all video calls
function disconnectAllVideoCalls() {
  if (typeof window.game !== 'undefined' && window.game.network?.webRTC) {
    console.log('🔌 Forcing disconnect of all video calls...');
    
    window.game.otherPlayerMap.forEach((player, id) => {
      if (player.connected) {
        console.log(`Disconnecting from ${id}...`);
        player.disconnectCall(window.game.network.webRTC);
      }
    });
  }
}

// Force reset all connection states
function resetAllConnectionStates() {
  if (typeof window.game !== 'undefined') {
    console.log('🔄 Resetting all connection states...');
    
    window.game.otherPlayerMap.forEach((player, id) => {
      player.connected = false;
      player.connectionBufferTime = 0;
      player.lastOverlapTime = 0;
      console.log(`Reset state for player ${id}`);
    });
  }
}

// Test overlap timeout
function testOverlapTimeout(playerId, timeoutMs = 1000) {
  if (typeof window.game !== 'undefined') {
    const player = window.game.otherPlayerMap.get(playerId);
    if (player) {
      console.log(`🧪 Testing overlap timeout for ${playerId} in ${timeoutMs}ms...`);
      player.lastOverlapTime = Date.now() - (3000 - timeoutMs); // Set to expire soon
      player.connected = true;
    } else {
      console.log(`❌ Player ${playerId} not found`);
    }
  }
}

// Monitor video elements in DOM
function monitorVideoElements() {
  const videoGrid = document.querySelector('.video-grid');
  if (videoGrid) {
    const videos = videoGrid.querySelectorAll('video');
    console.log(`📺 Video elements in DOM: ${videos.length}`);
    videos.forEach((video, index) => {
      console.log(`  Video ${index}:`, {
        srcObject: !!video.srcObject,
        paused: video.paused,
        muted: video.muted,
        readyState: video.readyState
      });
    });
  } else {
    console.log('❌ Video grid not found');
  }
}

// Real-time connection monitor
let connectionMonitorInterval;
function startConnectionMonitor() {
  if (connectionMonitorInterval) {
    clearInterval(connectionMonitorInterval);
  }
  
  console.log('📊 Starting real-time connection monitor...');
  connectionMonitorInterval = setInterval(() => {
    console.clear();
    console.log('🔄 Real-time Connection Monitor');
    console.log('===============================');
    checkConnectionStates();
    monitorVideoElements();
    console.log('\nPress stopConnectionMonitor() to stop monitoring');
  }, 2000);
}

function stopConnectionMonitor() {
  if (connectionMonitorInterval) {
    clearInterval(connectionMonitorInterval);
    connectionMonitorInterval = null;
    console.log('⏹️ Connection monitor stopped');
  }
}

// Make functions globally available
window.checkConnectionStates = checkConnectionStates;
window.disconnectAllVideoCalls = disconnectAllVideoCalls;
window.resetAllConnectionStates = resetAllConnectionStates;
window.testOverlapTimeout = testOverlapTimeout;
window.monitorVideoElements = monitorVideoElements;
window.startConnectionMonitor = startConnectionMonitor;
window.stopConnectionMonitor = stopConnectionMonitor;

console.log('\n📋 Available Commands:');
console.log('- checkConnectionStates() - Check current connection states');
console.log('- disconnectAllVideoCalls() - Force disconnect all video calls');
console.log('- resetAllConnectionStates() - Reset all connection flags');
console.log('- testOverlapTimeout("playerId", 1000) - Test timeout mechanism');
console.log('- monitorVideoElements() - Check video DOM elements');
console.log('- startConnectionMonitor() - Start real-time monitoring');
console.log('- stopConnectionMonitor() - Stop real-time monitoring');

console.log('\n🎯 Expected Behavior:');
console.log('1. Players approach → Video call initiated');
console.log('2. Players separate → 3-second timeout starts');
console.log('3. After 3 seconds → Video call disconnected automatically');
console.log('4. Players approach again → New video call initiated');

// Auto-run initial check
checkConnectionStates();