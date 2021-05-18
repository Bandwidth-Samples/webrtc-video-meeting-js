# Simple Video Meeting App

This sample app shows how to use our Video API to create a basic multi-person, multi-'room' video application using NodeJS and minimalist browser-side Javascript.

This application includes some other nice-to-have features, such as:

- Screensharing
- A 'vanity mirror' that shows your local video stream
- Mic picker
- Cam picker

## Architecture Overview

This app runs an HTTP server that listens for requests from browsers to get connection information. This connection information tells a browser the unique ID it should use to join a Room.

The server connects to Bandwidth's HTTP WebRTC API, which it will use to create a session and participant IDs. This example leverages our Node SDK to make the WebRTC calls.

The web browser will also use a websocket managed by the WebRTC browser SDK to handle signaling to the WebRTC API - this is all handled by a prepackaged Javascript SDK. Once more than one browser has joined the conference, they will be able to talk to each other.

> Note: Unless you are running on `localhost`, you will need to use HTTPS. Most modern browsers require a secure context when accessing cameras and microphones.

## How it's laid out

There are two main components to building out this solution: the server side which handles call control and the client side which enables the participant.

### Server side

The only file here is `index.js` which includes the Bandwidth WebRTC sdk.

There are two endpoints that are exposed by this node file: `/joinCall` and `/endSession`. `/joinCall` is called by a participant when they want to join a call. `/endSession` would be called to terminate a session, this could be called by a participant or by some control system.

The meat of `/joinCall` is a call to the `addParticipantToRoom()` function which does the following:

- Gets a session id - either by creating a session or by getting the `session_id` from an internal list of `session_id`s stored by `room_name`
- Creates a new participant via `createParticipant()`, returning a token used for later authentication
- Calls `addParticipantToSession()` with a session level subscription - doing this means that everyone is subscribed to this participant and this participant is subscribed to everyone else. As people are added or removed subscriptions will be managed for you.
- Returns the participant token (from `createParticipant()`) to the web user that is needed to start connect to the WebRTC server and start streaming

The other endpoint exposed by this simple application is `/endSession`. This function ends the session by removing everyone from it. As a reminder, sessions are only billed when media is flowing and all sessions are automatically ended and purged after 9 hours.

### Client Side

There is a bit more going on in the javascript side, much of this isn't needed to get a basic session going. But since we are creating a basic (but admitidly ugly) video meeting system, there is more going on. We're not going to go into the details that aren't pertinent to setting up WebRTC sessions here.

There is one html file, `index.html` with very little going on, it just sets the stage. `main.js` handles most of the meeting logic and `webrtc_mgr.js` handles most audio and video work and interacting with the WebRTC SDK.

The most important elements of getting a browser user online are:

- Getting your participant token from your Call Control server application (above), this is accomplished in the `getOnline()` function.
- Next `startSreaming()`, which calls `bandwidthRtc.connect();` - this establishes a connection with the WebRTC servers
- After the browser is connected, some work is done to setup our `constraints` which tell the browser which devices to use and any constraints around the encodings, rates, resolutions, etc. of the media
- Once that is all set, we can start flowing media out by calling `bandwidthRtc.publish()` with the constraints we just created

There is one other section that is of particular importance here, it's this section:

```
window.addEventListener("load", (event) => {
  bandwidthRtc.onStreamAvailable((rtcStream) => {
    connectStream(rtcStream);
  });

  bandwidthRtc.onStreamUnavailable((endpointId) => {
    disconnectEndpoint(endpointId);
  });
});
```

This section creates the listeners that will fire whenever a new stream is attached or disconnected from this browser. The implementation here creates a new `<video>` element and places it within the DOM. We add each stream to a list of connected streams as well.

You'll note that in the `disconnectEndPoint` function we also check if this was the last person we were connected to. If so, we tell the user we are all done. This isn't necessary, but may be useful if you are doing small group calls and want to inform the user that the call is over.

### Install dependencies and build

```bash
npm install
node index.js
```

Or you can use [Nodemon](https://www.npmjs.com/package/nodemon) for live updating when you change a js file!

## Getting it going

To run this sample, you'll need WebRTC Video enabled for your account (accounts may be provisioned for Audio only). Please check with your account manager to ensure you are provisioned for Video.

### Configure your sample app

Copy the default configuration files

```bash
cp .env.default .env
```

Add your Bandwidth account settings to `.env`:

```
vi .env
```

- BAND_ACCOUNT_ID
- BAND_USERNAME
- BAND_PASSWORD

### Communicate!

Browse to [http://localhost:3000](http://localhost:3000) and grant permission to use your microphone and camera.

- Select your device from the list, which is autodetected on page load
- Click _Click to Start_ to get a token for your browser, get you connected to our media server, and start media flowing from the browser
- Enter a room name (if it wasn't set in the query string)
- Do the same in another browser, with the same room name of course
- Start two other browsers with a different room name

You should now be able to enjoy 2 separate video calls!

### Options and Notes

- You can preset a name for the room by putting the query param `room` in the query string of the url - try [http://localhost:3000?room=test%20room](http://localhost:3000?room=test%20room)
- You can autostart all the attendees muted by changing the `start_muted_audio` variable to `true` at the top of `public/webrtc_mgr.js`
  - Note that an unmute button isn't provided in this example though
  - However there are javascript functions in `public/webrtc_mgr.js` for muting and unmuting both audio and video
- There are facilities fo muting audio and video in the webrtc_mgr.js file
- There is an ability to play ringing in the browser (natively in JS) while awaiting your first connection
