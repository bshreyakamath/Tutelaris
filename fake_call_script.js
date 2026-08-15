let selectedLanguage = "en-IN";
let currentVehicle = "";
let callerName = "";

let callTimer = null;
let callSeconds = 0;

let ringingAudio = new Audio("/static/ringtone.mp3");

ringingAudio.loop = true;
ringingAudio.volume = 1.0;


// =========================================================
// PAGE LOAD
// =========================================================

document.addEventListener("DOMContentLoaded", function () {

    const callerElement =
        document.getElementById("incomingName");

    if (callerElement) {
        callerName =
            callerElement.textContent.trim();
    }

    const languageElement =
        document.getElementById("language");

    if (languageElement) {
        selectedLanguage =
            languageElement.value;
    }

    // Initially make sure ringing is stopped
    ringingAudio.pause();
    ringingAudio.currentTime = 0;

});


// =========================================================
// START FAKE CALL
// =========================================================

function startCall() {

    const vehicleElement =
        document.getElementById("vehicle");

    const languageElement =
        document.getElementById("language");

    const errorElement =
        document.getElementById("errorMessage");


    currentVehicle =
        vehicleElement
            ? vehicleElement.value.trim()
            : "";

    selectedLanguage =
        languageElement
            ? languageElement.value
            : "en-IN";


    // Vehicle is required

    if (!currentVehicle) {

        if (errorElement) {
            errorElement.textContent =
                "Please enter the vehicle name.";
        }

        return;
    }


    if (errorElement) {
        errorElement.textContent = "";
    }


    // Stop any previous speech

    stopSpeech();


    // Show incoming call screen

    showScreen("incoming");


    // Start ringing

    startRinging();


    // Vibrate if supported

    if ("vibrate" in navigator) {

        navigator.vibrate([
            500,
            300,
            500,
            300
        ]);

    }
}


// =========================================================
// START RINGING
// =========================================================

function startRinging() {

    try {

        ringingAudio.currentTime = 0;

        const playPromise =
            ringingAudio.play();

        if (playPromise !== undefined) {

            playPromise.catch(function (error) {

                console.log(
                    "Ringing audio could not start:",
                    error
                );

            });

        }

    } catch (error) {

        console.log(
            "Ringing error:",
            error
        );

    }
}


// =========================================================
// STOP RINGING
// =========================================================

function stopRinging() {

    try {

        ringingAudio.pause();

        ringingAudio.currentTime = 0;

    } catch (error) {

        console.log(
            "Stopping ringing error:",
            error
        );

    }


    if ("vibrate" in navigator) {

        navigator.vibrate(0);

    }
}


// =========================================================
// ANSWER CALL
// =========================================================

function answerCall() {

    // FIRST stop ringing

    stopRinging();


    // Stop any previous speech

    stopSpeech();


    // Update connected caller name

    const connectedName =
        document.getElementById(
            "connectedName"
        );

    if (connectedName) {

        connectedName.textContent =
            callerName ||
            "Emergency Contact";

    }


    // Update avatar

    const connectedAvatar =
        document.getElementById(
            "connectedAvatar"
        );

    if (connectedAvatar) {

        connectedAvatar.textContent =
            (
                callerName ||
                "E"
            )
            .charAt(0)
            .toUpperCase();

    }


    // Show connected screen

    showScreen("connected");


    // Start call timer

    startTimer();


    // Give screen time to appear

    setTimeout(function () {

        speakConversation();

    }, 700);

}


// =========================================================
// GENERATE CONVERSATION
// =========================================================

function generateConversation() {

    const name =
        callerName ||
        "there";

    const vehicle =
        currentVehicle ||
        "vehicle";


    // HINDI

    if (selectedLanguage === "hi-IN") {

        return [

            `अरे ${name}, कहाँ हो अभी?`,

            `अच्छा, तुम ${vehicle} में हो ना?`,

            `हाँ, बस ऐसे ही पूछ रहा था। ठीक हो ना?`,

            `और कितनी देर लगेगी पहुँचने में?`,

            `ठीक है, पहुँचकर मुझे एक बार फोन कर देना।`,

            `अगर रास्ते में कुछ भी गड़बड़ लगे तो मुझे तुरंत फोन करना।`,

            `ठीक है, ध्यान रखना। मैं फोन पर हूँ।`

        ];

    }


    // ENGLISH

    return [

        `Hey ${name}, where are you?`,

        `Oh okay, you're in the ${vehicle}, right?`,

        `Yeah, I was just checking. You okay?`,

        `How much longer till you get there?`,

        `Okay, just call me when you reach.`,

        `And hey, if anything feels weird, just call me, okay?`,

        `Alright, take care. I'm right here.`

    ];

}


// =========================================================
// FIND SYNTHETIC BROWSER VOICE
// =========================================================

function getBestVoice() {

    if (!("speechSynthesis" in window)) {
        return null;
    }


    const voices =
        window.speechSynthesis.getVoices();


    if (!voices.length) {
        return null;
    }


    const prefix =
        selectedLanguage === "hi-IN"
            ? "hi"
            : "en";


    const matchingVoices =
        voices.filter(function (voice) {

            return voice.lang
                .toLowerCase()
                .startsWith(prefix);

        });


    if (!matchingVoices.length) {
        return null;
    }


    // Prefer commonly available synthetic voices

    const preferred = [

        /microsoft/i,
        /google/i,
        /natural/i,
        /online/i,
        /zira/i,
        /heera/i,
        /veena/i,
        /ravi/i

    ];


    for (const pattern of preferred) {

        const voice =
            matchingVoices.find(function (voice) {

                return pattern.test(
                    voice.name
                );

            });


        if (voice) {
            return voice;
        }
    }


    return matchingVoices[0];
}


// =========================================================
// SPEAK CONVERSATION
// =========================================================

function speakConversation() {

    if (!("speechSynthesis" in window)) {

        showSpeechError();

        return;

    }


    window.speechSynthesis.cancel();


    const script =
        generateConversation();


    const spokenElement =
        document.getElementById(
            "spoken"
        );


    if (!spokenElement) {
        return;
    }


    let index = 0;


    function speakNext() {

        if (index >= script.length) {

            spokenElement.textContent =
                "I'm still here. Tap Repeat to hear the conversation again.";

            return;
        }


        const sentence =
            script[index];


        // Display sentence

        spokenElement.textContent =
            sentence;


        const utterance =
            new SpeechSynthesisUtterance(
                sentence
            );


        utterance.lang =
            selectedLanguage;


        const voice =
            getBestVoice();


        if (voice) {

            utterance.voice =
                voice;

        }


        // Synthetic voice settings

        utterance.rate = 0.92;

        utterance.pitch = 1.0;

        utterance.volume = 1.0;


        utterance.onend =
            function () {

                index++;


                setTimeout(
                    speakNext,
                    700
                );

            };


        utterance.onerror =
            function (event) {

                console.error(
                    "Speech error:",
                    event
                );

                showSpeechError();

            };


        window.speechSynthesis.speak(
            utterance
        );

    }


    speakNext();

}


// =========================================================
// SPEECH ERROR
// =========================================================

function showSpeechError() {

    const spokenElement =
        document.getElementById(
            "spoken"
        );

    if (spokenElement) {

        spokenElement.textContent =
            "Unable to play the synthetic voice. Please try again.";

    }

}


// =========================================================
// REPEAT
// =========================================================

function repeatConversation() {

    stopSpeech();


    setTimeout(function () {

        speakConversation();

    }, 150);

}


// =========================================================
// STOP SPEECH
// =========================================================

function stopSpeech() {

    if ("speechSynthesis" in window) {

        window.speechSynthesis.cancel();

    }

}


// =========================================================
// TIMER
// =========================================================

function startTimer() {

    clearInterval(callTimer);

    callSeconds = 0;


    const timer =
        document.getElementById(
            "timer"
        );


    if (!timer) {
        return;
    }


    function updateTimer() {

        const minutes =
            Math.floor(
                callSeconds / 60
            )
            .toString()
            .padStart(2, "0");


        const seconds =
            (callSeconds % 60)
            .toString()
            .padStart(2, "0");


        timer.textContent =
            `${minutes}:${seconds}`;


        callSeconds++;

    }


    updateTimer();


    callTimer =
        setInterval(
            updateTimer,
            1000
        );

}


// =========================================================
// END CALL
// =========================================================

function endCall() {

    // Stop ringing

    stopRinging();


    // Stop synthetic voice

    stopSpeech();


    // Stop timer

    clearInterval(
        callTimer
    );

    callTimer = null;

    callSeconds = 0;


    // Return to setup

    showScreen("setup");

}


// =========================================================
// SHOW SCREEN
// =========================================================

function showScreen(id) {

    document
        .querySelectorAll(".screen")
        .forEach(function (screen) {

            screen.classList.remove(
                "active"
            );

        });


    const target =
        document.getElementById(id);


    if (target) {

        target.classList.add(
            "active"
        );

    }

}


// =========================================================
// LOAD SYNTHETIC VOICES
// =========================================================

if ("speechSynthesis" in window) {

    window.speechSynthesis.onvoiceschanged =
        function () {

            console.log(
                "Synthetic browser voices loaded:"
            );

            window.speechSynthesis
                .getVoices()
                .forEach(function (voice) {

                    console.log(
                        voice.name,
                        "|",
                        voice.lang
                    );

                });

        };

}