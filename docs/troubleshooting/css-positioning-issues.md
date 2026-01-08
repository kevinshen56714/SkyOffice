# Troubleshooting: CSS Positioning Issues in Phaser-React Integration

**Last Updated**: 2025-07-01  
**Category**: Frontend / CSS / Game Integration

## 🎯 Overview

This guide covers common CSS positioning issues when integrating React UI components with Phaser games, specifically addressing invisible or mispositioned elements.

## 🚨 Common Symptoms

### 1. Invisible Components
- ✅ Component logic working correctly
- ✅ Redux state updates properly  
- ✅ Console logs show component rendering
- ❌ Component not visible on screen

### 2. Mispositioned Dialogs
- ❌ Dialogs appearing in wrong screen location
- ❌ Centering not working as expected
- ❌ Components offset from intended position

### 3. Z-Index Issues
- ❌ Components appearing behind game content
- ❌ Interactions blocked by invisible overlays
- ❌ Components flickering or partially visible

## 🔍 Diagnostic Steps

### Step 1: Verify Component Rendering
```javascript
// Add temporary debug styles to confirm rendering
sx={{
  border: '5px solid red',
  backgroundColor: 'rgba(255, 0, 0, 0.5)',
  zIndex: 99999,
}}
```

### Step 2: Check Position Property
```typescript
// Problem indicators
position: 'absolute'  // ❌ Usually problematic with Phaser
position: 'relative'  // ❌ May be affected by parent transforms

// Preferred solutions  
position: 'fixed'     // ✅ Independent of parent positioning
position: 'static'    // ✅ For components within normal document flow
```

### Step 3: Inspect Z-Index Values
```css
/* Check for z-index conflicts */
z-index: 1;           /* ❌ Too low for game overlays */
z-index: 100;         /* ❌ Still might be insufficient */
z-index: 1000;        /* ✅ Sufficient for most cases */
z-index: 9999;        /* ✅ Guaranteed top layer */
```

## 🛠️ Standard Solutions

### Solution 1: Invisible React Components Over Phaser

**Problem**: Component renders but not visible

**Root Cause**: Positioning relative to Phaser canvas

**Fix**:
```typescript
// BEFORE (problematic)
sx={{
  position: 'absolute',
  top: 20,
  right: 20,
  zIndex: 1000,
}}

// AFTER (working)
sx={{
  position: 'fixed',      // Fixed to viewport
  top: 20,
  right: 20,
  zIndex: 9999,          // Above game content
}}
```

### Solution 2: Miscentered Dialogs

**Problem**: Dialog appears offset from center

**Root Cause**: Center calculation relative to wrong parent

**Fix**:
```typescript
// BEFORE (problematic)
const Dialog = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

// AFTER (working)
const Dialog = styled.div`
  position: fixed;              // Viewport reference
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;               // Above game
`;
```

### Solution 3: Z-Index Competition

**Problem**: Component behind game content

**Root Cause**: Phaser canvas uses high z-index values

**Fix**:
```typescript
// Progressive z-index strategy
const Z_INDEX = {
  GAME_BACKGROUND: 0,
  GAME_CONTENT: 1000,
  UI_BACKGROUND: 5000,
  UI_DIALOGS: 9000,
  UI_TOOLTIPS: 9500,
  UI_DEBUG: 9999,
};
```

## 📋 Quick Reference Patterns

### ✅ Correct Patterns

#### Overlay Dialogs (Centered)
```typescript
const CenteredDialog = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9000;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 20px;
`;
```

#### Corner Panels (Fixed Position)
```typescript
const CornerPanel = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9000;
  width: 300px;
  height: 400px;
`;
```

#### Full Screen Overlays
```typescript
const FullScreenOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 8000;
  background: rgba(0, 0, 0, 0.8);
`;
```

### ❌ Problematic Patterns

#### Absolute Positioning (Avoid)
```typescript
// ❌ Don't use with Phaser games
const ProblematicDialog = styled.div`
  position: absolute;  // Relative to parent
  top: 50%;
  left: 50%;
  z-index: 100;       // Too low
`;
```

#### Low Z-Index (Avoid)
```typescript
// ❌ Will render behind game
sx={{
  zIndex: 1,          // Too low
  zIndex: 100,        // Still too low
  zIndex: 500,        // Risky
}}
```

## 🧪 Testing Checklist

### Pre-Deployment Testing
- [ ] Component visible at all supported screen sizes
- [ ] Correct positioning maintained during game camera movement
- [ ] No interference with game input/controls
- [ ] Z-index conflicts resolved
- [ ] Cross-browser compatibility verified

### Debug Testing
- [ ] Add temporary ultra-visible styles
- [ ] Test with different viewport sizes
- [ ] Verify in fullscreen game mode
- [ ] Check with dev tools element inspector

## 🎯 Prevention Guidelines

### Code Review Checklist
When reviewing React components for Phaser integration:
1. **Position Property**: Never `absolute` for game overlays
2. **Z-Index Value**: Always >= 1000 for UI components
3. **Viewport Units**: Use `vw/vh` for full-screen elements
4. **Transform Origin**: Verify centering calculations
5. **Game Context**: Test within actual game environment

### Component Guidelines
```typescript
// Template for game overlay components
interface GameOverlayProps {
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  zIndex?: number;
  children: React.ReactNode;
}

const GameOverlay: React.FC<GameOverlayProps> = ({ 
  position = 'center', 
  zIndex = 9000,
  children 
}) => {
  const getPositionStyles = () => {
    const base = { position: 'fixed', zIndex };
    
    switch (position) {
      case 'center':
        return { ...base, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      case 'top-right':
        return { ...base, top: 20, right: 20 };
      // ... other positions
    }
  };

  return <div style={getPositionStyles()}>{children}</div>;
};
```

## 🔗 Related Documentation

- [Meeting Room Chat Rendering Fix](../fixes/2025-07-01_meeting-room-chat-rendering.md)
- [Dialog Positioning Fix](../fixes/2025-07-01_dialog-positioning-fix.md)
- [Phaser-React Integration Guide](../architecture/phaser-react-integration.md)

---

**Maintained By**: Frontend Team  
**Next Review**: 2025-10-01