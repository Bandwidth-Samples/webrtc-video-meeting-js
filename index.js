const BandwidthWebRTC = require("@bandwidth/webrtc");
const express = require("express");
const uuid = require("uuid");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const app = express();

dotenv.config();

app.use(bodyParser.json());
app.use(express.static("public"));

// global vars
const port = 3000;
const accountId = process.env.BW_ACCOUNT_ID;
const username = process.env.BW_USERNAME;
const password = process.env.BW_PASSWORD;

// Check to make sure required environment variables are set
if (!accountId || !username || !password) {
  console.error(
      "ERROR! Please set the BW_ACCOUNT_ID, BW_USERNAME, and BW_PASSWORD environment variables before running this app"
  );
  process.exit(1);
}

BandwidthWebRTC.Configuration.basicAuthUserName = username;
BandwidthWebRTC.Configuration.basicAuthPassword = password;
var webRTCController = BandwidthWebRTC.APIController;

var rooms_db = new Map();

/**
 * This is what you call as a participant when you are ready to
 * get a participant token and join a room
 */
app.post("/joinCall", async (req, res) => {
  console.log(`joinCall> about to setup browser client, data:`);
  console.log(req.body);

  // setup the session and add this user into it
  var room;
  try {
    var [participant, token] = await createParticipant(
      req.body.audio,
      req.body.video,
      uuid.v1()
    );

    if (!req.body.room) req.body.room = "lobby";
    room = await addParticipantToRoom(participant.id, req.body.room);
  } catch (error) {
    console.log("Failed to start the browser call:", error);
    return res.status(500).send({ message: "failed to set up participant" });
  }

  // now that we have added them to the session,
  //  we can send back the token they need to join
  //  as well as info about the room they are in
  res.send({
    message: "created particpant and setup session",
    token: token,
    room: room,
  });
});

/**
 * This is what you call as a participant when you are ready to
 * get a participant token and join a room
 */
app.get("/endSession", async (req, res) => {
  console.log(`endCall> about to end a session, data: '${req.query}'`);
  var room_name;
  try {
    room_name = req.query.room_name;
    room = await getRoom(room_name);
    console.log(room);
    // remove each participant
    room.participants.forEach(async function (participant_id) {
      await webRTCController.removeParticipantFromSession(
        accountId,
        participant_id,
        room.session_id
      );
    });

    console.log(`room/session ended '${room_name}'`);
  } catch (error) {
    console.log("Failed to end the room/session:", error);
    res.status(500).send({
      message: "Failed to end the room/session",
    });
  }
  try {
    res.send({
      status: 200,
      message: `room/session '${room_name}' deleted`,
    });
  } catch (err) {
    console.log("failed to send response");
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});

//
// Calling out to Bandwidth functions
//
/**
 *  Create a new participant
 * @param audio_perm boolean for audio permission
 * @param video_perm boolean for video permission
 * @param tag to tag the participant with, no PII should be placed here
 * @return list: (a Participant json object, the participant token)
 */
async function createParticipant(audio_perm, video_perm, tag) {
  perms = [];
  if (audio_perm) perms.push("AUDIO");
  if (video_perm) perms.push("VIDEO");
  // create a participant for this browser user
  var participantBody = new BandwidthWebRTC.Participant({
    tag: tag,
    publishPermissions: perms,
    deviceApiVersion: "V3"
  });

  try {
    let createResponse = await webRTCController.createParticipant(
      accountId,
      participantBody
    );

    return [createResponse.participant, createResponse.token];
  } catch (error) {
    console.log("failed to create Participant", error);
    throw new Error(
      "Failed to createParticipant, error from BAND:" + error.errorMessage
    );
  }
}

/**
 * @param participant_id a Participant id
 * @param room_name The room to add this participant to
 * @return room in case you want any details about the state of the room
 */
async function addParticipantToRoom(participant_id, room_name) {
  room = await getRoom(room_name);

  var body = new BandwidthWebRTC.Subscriptions({ sessionId: room.session_id });

  try {
    await webRTCController.addParticipantToSession(
      accountId,
      room.session_id,
      participant_id,
      body
    );
  } catch (error) {
    console.log("Error on addParticipant to Session:", error);
    throw new Error(
      "Failed to addParticipantToSession, error from BAND:" + error.errorMessage
    );
  }

  // update the room with the new participant
  room.participants.push(participant_id);
  rooms_db.set(room_name, room);

  return room;
}

/**
 * Create a room or return it if it's an existing one
 * When we create a room, what we are doing is creating a new session and
 *  associating that Bandwidth session id with the name used by our app (room_name)
 * @param room_name the room you are joining
 * @return the room for this session
 */
async function getRoom(room_name) {
  // check if we've already created a session for this call
  //  - this is a simplification we're doing for this demo (save this somewhere that persists)
  if (rooms_db.has(room_name)) {
    return rooms_db.get(room_name);
  }

  console.log(`Creating room/session '${room_name}'`);
  // otherwise, create the session
  // tags are useful to audit or manage billing records
  let sessionBody = new BandwidthWebRTC.Session({ tag: `demo.${room_name}` });
  let sessionResponse;
  try {
    sessionResponse = await webRTCController.createSession(
      accountId,
      sessionBody
    );
  } catch (error) {
    console.log("getRoom> Failed to create room/session:", error);
    throw new Error(
      "Error in createSession, error from BAND:" + error.errorMessage
    );
  }

  // saves it for future use, this would normally be stored with meeting/call/appt details
  room = {
    name: room_name,
    session_id: sessionResponse.id,
    participants: [],
    calls: [],
    start_time: Date.now(),
  };
  rooms_db.set(room_name, room);

  return room;
}
