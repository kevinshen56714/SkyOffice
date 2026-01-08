# Claude Development Instructions

## Language Policy
**CRITICAL**: All code comments, UI text, variable names, and documentation must be written in English only. This includes:
- Code comments and documentation
- UI labels, buttons, and messages  
- Variable and function names
- Error messages and console logs
- README and other markdown files

## DevMode Implementation

The codebase includes a comprehensive DevMode system for debugging and development:

### DevMode Components
- **DevModePanel**: Main debugging interface with tabbed layout
- **useDevMode**: Custom hook for DevMode state management
- **Logger**: Enhanced logging system with DevMode integration
- **Network**: Real-time synchronization debugging

### DevMode Features

The DevMode Panel includes 7 comprehensive tabs for complete application state management:

#### 1. **Work Tab** - Work Status Management
- Live editing of work status (working, break, meeting, overtime, off-duty)
- Work time tracking with editable start times
- Fatigue level management (0-100%)
- Player appearance customization (clothing: business/casual/tired, accessories: coffee/documents/none)
- Real-time view of other players' work status with timestamps

#### 2. **User Tab** - User State Control
- Background mode toggle (DAY/NIGHT)
- Login status simulation
- Video connection testing
- Mobile joystick visibility control
- Session ID and player mapping information

#### 3. **Room Tab** - Connection & Room Management
- Lobby and room connection status toggles
- Editable room details (ID, name, description)
- Available rooms monitoring
- Connection state simulation for testing

#### 4. **Chat Tab** - Communication Features
- Chat visibility and focus controls
- Message statistics and room tracking
- Test message generation
- Meeting room chat monitoring

#### 5. **Features Tab** - Application Features
- Computer/Screen sharing dialog controls
- Whiteboard functionality testing
- Meeting room creation and management
- Feature state simulation

#### 6. **Mock Tab** - Testing Scenarios
- Advanced scenario testing (Full Work Day, Fresh Start, etc.)
- Bulk player generation (5 test players)
- Work time and fatigue simulation
- Network synchronization testing
- Quick action buttons for common testing scenarios

#### 7. **Logs Tab** - Debug Information
- Filtered logging with component-specific views
- Log level filtering (DEBUG, INFO, WARN, ERROR)
- Real-time log monitoring
- Log clearing functionality

### Build Commands
- `npm run dev`: Start development server
- `npm run build`: Production build with TypeScript validation
- `npm run lint`: Run linting checks

### Testing Real-time Sync
Use the DevModePanel's network testing tools to diagnose synchronization issues:
1. Enable DevMode to show the debugging panel
2. Use "Network Sync Test" to check connection status
3. Use "Test Other Player Status Change" to verify Redux updates
4. Monitor console logs for work-status-changed messages

## Architecture Notes
- Uses Redux Toolkit for state management
- Phaser.js for game engine and player interactions
- Colyseus for real-time multiplayer networking
- Material-UI for component styling
- Custom hooks pattern for separation of concerns