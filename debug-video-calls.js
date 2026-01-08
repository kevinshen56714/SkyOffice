// Debug script for video call functionality
// Run this in browser console when connected to the game

console.log('🎥 Video Call Debug Script');
console.log('==========================');

// Check camera permissions
async function checkCameraPermission() {
  try {
    const result = await navigator.permissions.query({ name: 'camera' });
    console.log('📷 Camera permission:', result.state);
    return result.state;
  } catch (error) {
    console.log('📷 Permission API not supported, trying direct access...');
    return 'unknown';
  }
}

// Test getUserMedia
async function testGetUserMedia() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    console.log('✅ getUserMedia successful, stream tracks:', stream.getTracks().map(t => t.kind));
    stream.getTracks().forEach(track => track.stop()); // Clean up
    return true;
  } catch (error) {
    console.error('❌ getUserMedia failed:', error);
    return false;
  }
}

// Check WebRTC state
function checkWebRTCState() {
  if (typeof window.game !== 'undefined' && window.game.network?.webRTC) {
    const webRTC = window.game.network.webRTC;
    console.log('🌐 WebRTC State:');
    console.log('  - Peer ID:', webRTC.myPeer.id);
    console.log('  - Has stream:', !!webRTC.myStream);
    console.log('  - Active peers:', webRTC.peers.size);
    console.log('  - Called peers:', webRTC.onCalledPeers.size);
    
    if (webRTC.myStream) {
      console.log('  - Stream tracks:', webRTC.myStream.getTracks().map(t => `${t.kind}: ${t.enabled}`));
    }
    
    return webRTC;
  } else {
    console.log('❌ WebRTC not found or not initialized');
    return null;
  }
}

// Check player states
function checkPlayerStates() {
  if (typeof window.game !== 'undefined') {
    const game = window.game;
    console.log('👤 Player States:');
    console.log('  - My player ready:', game.myPlayer?.readyToConnect);
    console.log('  - My player video connected:', game.myPlayer?.videoConnected);
    console.log('  - My player ID:', game.myPlayer?.playerId);
    
    console.log('  - Other players:');
    game.otherPlayerMap.forEach((player, id) => {
      console.log(`    Player ${id}:`);
      console.log(`      - Ready: ${player.readyToConnect}`);
      console.log(`      - Video connected: ${player.videoConnected}`);
      console.log(`      - Connected: ${player.connected}`);
      console.log(`      - Buffer time: ${player.connectionBufferTime}`);
    });
  }
}

// Manual video call test
function testVideoCall(targetPlayerId) {
  if (typeof window.game !== 'undefined' && window.game.network?.webRTC) {
    console.log('🎥 Testing manual video call to:', targetPlayerId);
    window.game.network.webRTC.connectToNewUser(targetPlayerId);
  } else {
    console.log('❌ Cannot test video call - WebRTC not available');
  }
}

// Main debug function
async function runVideoDebug() {
  console.log('🔍 Running comprehensive video debug...\n');
  
  console.log('1. Checking camera permission...');
  await checkCameraPermission();
  
  console.log('\n2. Testing getUserMedia...');
  await testGetUserMedia();
  
  console.log('\n3. Checking WebRTC state...');
  checkWebRTCState();
  
  console.log('\n4. Checking player states...');
  checkPlayerStates();
  
  console.log('\n📋 Debug Commands:');
  console.log('- checkCameraPermission() - Check camera permissions');
  console.log('- testGetUserMedia() - Test media device access');
  console.log('- checkWebRTCState() - Check WebRTC connection');
  console.log('- checkPlayerStates() - Check all player states');
  console.log('- testVideoCall("playerId") - Manually initiate video call');
  
  console.log('\n🎯 Look for these logs in console:');
  console.log('- 🎥 [WebRTC] Requesting user media access...');
  console.log('- 🎥 [Game] Players overlapping:');
  console.log('- 🎥 [OtherPlayer] makeCall conditions:');
  console.log('- 🎥 [WebRTC] Calling peer:');
}

// Make functions globally available
window.checkCameraPermission = checkCameraPermission;
window.testGetUserMedia = testGetUserMedia;
window.checkWebRTCState = checkWebRTCState;
window.checkPlayerStates = checkPlayerStates;
window.testVideoCall = testVideoCall;
window.runVideoDebug = runVideoDebug;

// Auto-run debug
runVideoDebug();