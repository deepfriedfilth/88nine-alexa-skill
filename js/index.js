/**
 
 Published 2017 by Antonio Licon
 Please adapt and use freely!
 
*/
"use strict";
const https = require("https");

const streams = [
    {
        'title' : '88nine Stream',
        'url' : 'https://wyms.streamguys1.com/live',
        'feed': 'https://radiomilwaukee.org/playlistinfo.php'
    },
    {
        'title' : '414music.fm',
        'url' : 'https://wyms.streamguys1.com/414music_aac',
        'feed': 'https://s3.amazonaws.com/radiomilwaukee-playlist/WYMSHD2HIS.XML'
    }
];

exports.handler = function(event, context) {
    try {
     
//Uncomment this to restrict call to your Alexa Skill
//        if (event.session.application.applicationId !== "yourApplicationIDHere") {
//           context.fail("Invalid Application ID");
//        }

        if (event.session.new) {
            onSessionStarted({
                requestId: event.request.requestId
            }, event.session);
        }
        switch (event.request.type) {
            case "LaunchRequest":
                onLaunch(event.request,
                    event.session,
                    function callback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                    });
                break;
            case "IntentRequest":
                onIntent(event.request,
                    event.session,
                    function callback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                    });
                break;
            case "SessionEndedRequest":
                onSessionEnded(event.request, event.session);
                context.succeed();
                break;
            default:
                break;
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    play("play", session, callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function help (intent, session, callback){
    var cardTitle = "Radio Milwaukee (insert tagline here)";
    var speechOutput = "Commands you can say are: Alexa, tell Radio Milwaukee to play.  Alexa, tell Radio Milwaukee to stop.  Alexa, ask Radio Milwaukee what song this is.";
    callback(session.attributes, buildSpeechletResponse(cardTitle, speechOutput, "", true));
} 
function onIntent(intentRequest, session, callback) {
    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    switch (intentName) {
        case "play":
            play(intent, session, callback);
            break;
        case "stop":
            stop(intent, session, callback);
            break;
        case "AMAZON.PauseIntent":
            stop(intent, session, callback);
            break; 
        case "AMAZON.ResumeIntent":
            play(intent, session, callback);
            break;    
        case "whatSong":
            whatSong(intent, session, callback);
            break;
        case "playLocal":
            session.attributes['index'] = 1;
            play(intent, session, callback);
            break;
        case "playMain":
            session.attributes['index'] = 0;
            play(intent, session, callback);
            break;
        default:
            throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    // Add any cleanup logic here
}

function whatSong(intent, session, callback) {
    var surl = streams[session.attributes['index'] || 0].feed;

    https.get(surl, function(res) {
        var body = "";

        res.on("data", function(chunk) {
            body += chunk;
        });

        res.on("end", function() {
            var songInfo = "";
            try {
                var song = JSON.parse(body).songs[0];
                songInfo = "This song is: " + song.title + " by " + song.artist;
            }
            catch (e) {
                songInfo = "I'm sorry, the song information is missing";
            }
            callback(session.attributes, buildSpeechletResponseWithoutCard(songInfo, "", "true"));
        });
    }).on("error", function(e) {
        callback(session.attributes, buildSpeechletResponseWithoutCard("There was an error, please try again later", "", "true"));
    });
}

// ------- Helper functions to build responses -------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}

function stop(intent, session, callback) {
    var response = {
        version: "1.0",
        response: {
            shouldEndSession: true,
            directives: [{
                "type": "AudioPlayer.Stop"
            }]
        }
    };
    callback(session.attributes, response.response);
}

function play(intent, session, callback) {
    var url = streams[session.attributes['index'] || 0].url;
    var response = {
        version: "1.0",
        response: {
            shouldEndSession: true,
            directives: [{
                type: "AudioPlayer.Play",
                playBehavior: "REPLACE_ALL",
                audioItem: {
                    stream: {
                        url: url,
                        token: "913",
                        expectedPreviousToken: null,
                        offsetInMilliseconds: 0
                    }
                }
            }]
        }
    };
    callback(session.attributes, response.response);
}