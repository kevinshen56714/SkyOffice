// Emergency Video Call Fix - Run in browser console
console.log('🚨 Emergency Video Call Fix');
console.log('===========================');

// Force reset all connections
function emergencyResetConnections() {
  if (window.game) {
    console.log('🔄 Force resetting all video connections...');
    
    window.game.otherPlayerMap.forEach((player, id) => {
      if (player.connected) {
        console.log(`- Resetting connection for ${id}`);
        player.connected = false;
        player.connectionBufferTime = 0;
        player.lastOverlapTime = 0;
        
        // Also try to clean up WebRTC
        if (window.game.network?.webRTC) {
          try {
            window.game.network.webRTC.disconnectFromUser(id);
          } catch (e) {
            console.log(`  - WebRTC cleanup failed for ${id}:`, e.message);
          }
        }
      }
    });
    
    // Clean up video elements
    const videoGrid = document.querySelector('.video-grid');
    if (videoGrid) {
      const videos = videoGrid.querySelectorAll('video');
      videos.forEach((video, index) => {
        if (video.srcObject) {
          console.log(`- Removing video element ${index}`);
          video.srcObject = null;
          video.remove();
        }
      });
    }
    
    console.log('✅ Emergency reset complete!');
  } else {
    console.log('❌ Game instance not found');
  }
}

// Force initiate video call (bypass all conditions)
function forceVideoCall(targetPlayerId) {
  if (window.game?.network?.webRTC) {
    console.log(`🎥 Force initiating video call to: ${targetPlayerId}`);
    try {
      window.game.network.webRTC.connectToNewUser(targetPlayerId);
      
      // Mark player as connected
      const player = window.game.otherPlayerMap.get(targetPlayerId);
      if (player) {
        player.connected = true;
        player.lastOverlapTime = Date.now();
      }
      
      console.log('✅ Force video call initiated');
    } catch (e) {
      console.error('❌ Force video call failed:', e);
    }
  }
}

// Monitor connection states in real-time
let emergencyMonitor;
function startEmergencyMonitor() {
  stopEmergencyMonitor(); // Stop any existing monitor
  
  console.log('📊 Starting emergency connection monitor...');
  emergencyMonitor = setInterval(() => {
    if (window.game) {
      console.clear();
      console.log('🚨 Emergency Monitor - Connection States');
      console.log('=====================================');
      
      window.game.otherPlayerMap.forEach((player, id) => {
        const timeSinceOverlap = player.lastOverlapTime > 0 ? Date.now() - player.lastOverlapTime : 'Never';
        console.log(`Player ${id}:`);
        console.log(`  🔗 Connected: ${player.connected}`);
        console.log(`  ⏱️  Last overlap: ${timeSinceOverlap}ms ago`);
        console.log(`  📍 Position: (${Math.round(player.x)}, ${Math.round(player.y)})`);
        
        // Check if they should be disconnected
        if (player.connected && player.lastOverlapTime > 0) {
          const shouldDisconnect = (Date.now() - player.lastOverlapTime) > 1000;
          if (shouldDisconnect) {
            console.log(`  ⚠️  Should be disconnected! (${Math.round((Date.now() - player.lastOverlapTime) / 1000)}s ago)`);
          }
        }
      });
      
      // Video elements
      const videoGrid = document.querySelector('.video-grid');
      if (videoGrid) {
        const videos = videoGrid.querySelectorAll('video');
        console.log(`\n📺 Video elements: ${videos.length}`);
      }
      
      console.log('\n📋 Commands: emergencyResetConnections(), forceVideoCall("playerId"), stopEmergencyMonitor()');
    }
  }, 1000);
}

function stopEmergencyMonitor() {
  if (emergencyMonitor) {
    clearInterval(emergencyMonitor);
    emergencyMonitor = null;
    console.log('⏹️ Emergency monitor stopped');
  }
}

// Test overlap timeout manually
function testOverlapTimeout(playerId) {
  const player = window.game?.otherPlayerMap.get(playerId);
  if (player) {
    console.log(`🧪 Testing overlap timeout for ${playerId}...`);
    player.connected = true;
    player.lastOverlapTime = Date.now() - 1500; // 1.5 seconds ago
    console.log('Player should disconnect in ~500ms');
  }
}

// Make functions globally available
window.emergencyResetConnections = emergencyResetConnections;
window.forceVideoCall = forceVideoCall;
window.startEmergencyMonitor = startEmergencyMonitor;
window.stopEmergencyMonitor = stopEmergencyMonitor;
window.testOverlapTimeout = testOverlapTimeout;

console.log('\n📋 Emergency Commands Available:');
console.log('- emergencyResetConnections() - Reset all connection states');
console.log('- forceVideoCall("playerId") - Force initiate video call');
console.log('- startEmergencyMonitor() - Monitor connections in real-time');
console.log('- testOverlapTimeout("playerId") - Test timeout mechanism');

// Auto-run emergency reset
emergencyResetConnections();