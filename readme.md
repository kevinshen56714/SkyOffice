# SkyOffice ![License](https://img.shields.io/badge/license-MIT-blue) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-green.svg)

<img alt="Logo" align="right" src="https://user-images.githubusercontent.com/11501902/139942585-a6b044ce-3695-460a-91bd-dd9f1d4611c8.png" width="20%" />

An immersive remote-working platform - Winner of [2021 Monte Jade Innovation Competition](http://www.montejadese.org/pages/mjic.html)

- Come try it out - [Official Website](https://skyoffice.netlify.app/)
- Why we built this - [Concept Video](https://www.youtube.com/watch?v=BpDqGTPh8pc)

SkyOffice works on all PC browsers (mobile browsers are currently not supported)

## Built with

- [Phaser3](https://github.com/photonstorm/phaser) - Game Engine
- [Colyseus](https://github.com/colyseus/colyseus) - WebSocket-based Server Framework
- [React/Redux](https://github.com/facebook/react) - Front-end Framework
- [PeerJS](https://github.com/peers/peerjs) - WebRTC for Video/screen sharing
- [TypeScript](https://github.com/microsoft/TypeScript) and [ES6](https://github.com/eslint/eslint) - for both client and server sides

## Features
- [Custom/Private Rooms (*NEW*)](#customprivate-rooms-new)
- [Embedded Whiteboards (*NEW*)](#embedded-whiteboards-new)
- [Proximity Chat (distance-based interactive system)](#proximity-chat-distance-based-interactive-system)
- [Multifunctional Rooms](#multifunctional-rooms)
- [Flexible & Immediate Screen Sharing](#flexible--immediate-screen-sharing)
- [Text Message Chat (with real time dialog bubbles)](#text-message-chat-with-real-time-dialog-bubbles)

### Embedded Whiteboards (*NEW*)
![image](https://user-images.githubusercontent.com/11501902/147785323-19dbf0e6-056d-44c5-8efe-e969297bbe52.png)

### Custom/Private Rooms (*NEW*)
![image](https://user-images.githubusercontent.com/11501902/147784118-15ef50bf-0f67-4704-89d7-81b2fa7f8ceb.png)

### Proximity Chat (distance-based interactive system)
![image](https://user-images.githubusercontent.com/11501902/139960852-cf0e0883-8fbe-459d-bb11-3707d0ae1360.png)

### Multifunctional Rooms
![image](https://user-images.githubusercontent.com/11501902/139961091-1801bd4d-fbd6-4400-8503-85ece744e979.png)

### Flexible & Immediate Screen Sharing
![image](https://user-images.githubusercontent.com/11501902/139961155-44a85cd9-ac25-4563-9d82-6537ed7435f6.png)

### Text Message Chat (with real time dialog bubbles)
![image](https://user-images.githubusercontent.com/11501902/145925423-3b5b9026-d3b9-429d-920b-98b0bcd6300a.png)

## Controls

- `arrow keys` to move (video chat will start if you are close to someone else)
- `E` to sit down
- `R` to use computer (for screen sharing)
- `Enter` to open chat
- `ESC` to close chat

## Prerequisites

You'll need [Node.js](https://nodejs.org/en/), [npm](https://www.npmjs.com/) installed.

## Getting Started

Clone this repository to your local machine:

```bash
git clone https://github.com/kevinshen56714/SkyOffice.git
```

This will create a folder named `SkyOffice`. You can specify a different folder name like this:

```bash
git clone https://github.com/kevinshen56714/SkyOffice.git my-folder-name
```

To start a server, go into the project folder and install dependencies/run start command:

```bash
cd SkyOffice or 'my-folder-name'
npm install && npm run start
```

To start a client, go into the client folder and install dependencies/run start command:

```bash
cd SkyOffice/client or 'my-folder-name/client'
npm install && npm run start
```

## Credits 🎉

Big thanks to this great repo - [ourcade/phaser3-typescript-parcel-template](https://github.com/ourcade/phaser3-typescript-parcel-template)

Big thanks to pixel artist - [LimeZu](https://limezu.itch.io/)

## License

[MIT License](https://github.com/kevinshen56714/SkyOffice/blob/master/LICENSE)
