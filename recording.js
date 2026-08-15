/* =========================================================
   TUTELARIS
   AUTOMATIC SAFETY RECORDING
========================================================= */


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let audioStream = null;
let mediaRecorder = null;
let audioChunks = [];

let audioContext = null;
let analyser = null;
let microphoneSource = null;

let monitoringActive = false;
let recordingActive = false;

let speechRecognition = null;

let recordingTimer = null;

let locationData = {
    latitude: "",
    longitude: "",
    accuracy: ""
};


/* =========================================================
   DISTRESS WORDS
========================================================= */

const distressWords = [
    "help",
    "help me",
    "save me",
    "please help",
    "stop",
    "leave me",
    "don't touch me",
    "dont touch me",
    "let me go",
    "emergency",
    "danger",
    "call police",
    "police",
    "bachao",
    "madad",
    "mujhe bachao",
    "ಬಚಾವ್",
    "ಸಹಾಯ",
    "ಸಹಾಯ ಮಾಡಿ"
];


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log(
        "Tutelaris recording system starting..."
    );

    startSafetySystem();

});


/* =========================================================
   START SAFETY SYSTEM
========================================================= */

async function startSafetySystem() {

    updateMonitor(
        "active",
        "Safety Monitoring Active",
        "Requesting microphone permission..."
    );

    updateMicrophoneStatus("Requesting...");

    getUserLocation();


    /* -----------------------------------------------------
       CHECK MICROPHONE SUPPORT
    ----------------------------------------------------- */

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        updateMicrophoneStatus(
            "Not supported"
        );

        updateSpeechStatus(
            "Unavailable"
        );

        updateDetectionStatus(
            "Microphone unavailable"
        );

        updateMonitor(
            "inactive",
            "Safety Monitoring Inactive",
            "This browser does not support microphone access."
        );

        return;
    }


    /* -----------------------------------------------------
       REQUEST MICROPHONE
    ----------------------------------------------------- */

    try {

        audioStream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });


        console.log(
            "Microphone permission granted."
        );


        updateMicrophoneStatus(
            "Connected"
        );


        monitoringActive = true;


        updateMonitor(
            "active",
            "Safety Monitoring Active",
            "Automatically monitoring microphone"
        );


        setupAudioAnalysis();

        setupSpeechRecognition();

    }

    catch (error) {

        console.error(
            "Microphone error:",
            error
        );


        updateMicrophoneStatus(
            "Permission denied"
        );


        updateSpeechStatus(
            "Unavailable"
        );


        updateDetectionStatus(
            "Microphone unavailable"
        );


        updateMonitor(
            "inactive",
            "Safety Monitoring Inactive",
            "Microphone permission is required."
        );

    }

}


/* =========================================================
   AUDIO ANALYSIS
========================================================= */

function setupAudioAnalysis() {

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;


        if (!AudioContext) {

            updateDetectionStatus(
                "Audio analysis unavailable"
            );

            return;
        }


        audioContext =
            new AudioContext();


        analyser =
            audioContext.createAnalyser();


        analyser.fftSize = 2048;


        microphoneSource =
            audioContext.createMediaStreamSource(
                audioStream
            );


        microphoneSource.connect(
            analyser
        );


        monitorAudioLevel();

    }

    catch (error) {

        console.error(
            "Audio analysis error:",
            error
        );

        updateDetectionStatus(
            "Audio analysis unavailable"
        );

    }

}


/* =========================================================
   MONITOR AUDIO LEVEL
========================================================= */

function monitorAudioLevel() {

    if (
        !monitoringActive ||
        !analyser
    ) {

        return;
    }


    const bufferLength =
        analyser.fftSize;


    const dataArray =
        new Uint8Array(bufferLength);


    analyser.getByteTimeDomainData(
        dataArray
    );


    let sum = 0;


    for (
        let i = 0;
        i < bufferLength;
        i++
    ) {

        const normalized =
            (dataArray[i] - 128) / 128;


        sum +=
            normalized * normalized;

    }


    const rms =
        Math.sqrt(
            sum / bufferLength
        );


    if (recordingActive) {

        updateDetectionStatus(
            "Recording incident"
        );

    }

    else if (rms > 0.18) {

        updateDetectionStatus(
            "Strong sound detected"
        );

    }

    else {

        updateDetectionStatus(
            "Monitoring"
        );

    }


    requestAnimationFrame(
        monitorAudioLevel
    );

}


/* =========================================================
   SPEECH RECOGNITION
========================================================= */

function setupSpeechRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        console.log(
            "Speech Recognition is not supported."
        );


        updateSpeechStatus(
            "Not supported"
        );

        return;
    }


    speechRecognition =
        new SpeechRecognition();


    speechRecognition.continuous = true;

    speechRecognition.interimResults = true;

    speechRecognition.lang = "en-IN";


    updateSpeechStatus(
        "Listening"
    );


    speechRecognition.onresult =
        function (event) {

            let transcript = "";


            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                transcript +=
                    event.results[i][0].transcript;

            }


            transcript =
                transcript
                    .toLowerCase()
                    .trim();


            console.log(
                "Speech:",
                transcript
            );


            checkForDistressWords(
                transcript
            );

        };


    speechRecognition.onerror =
        function (event) {

            console.warn(
                "Speech recognition error:",
                event.error
            );


            if (
                event.error === "not-allowed" ||
                event.error === "service-not-allowed"
            ) {

                updateSpeechStatus(
                    "Permission denied"
                );

            }

            else {

                updateSpeechStatus(
                    "Listening unavailable"
                );

            }

        };


    speechRecognition.onend =
        function () {

            if (
                monitoringActive &&
                !recordingActive
            ) {

                try {

                    speechRecognition.start();

                }

                catch (error) {

                    console.log(
                        "Speech recognition restart:",
                        error
                    );

                }

            }

        };


    try {

        speechRecognition.start();

    }

    catch (error) {

        console.log(
            "Speech recognition start:",
            error
        );

    }

}


/* =========================================================
   CHECK DISTRESS WORDS
========================================================= */

function checkForDistressWords(
    transcript
) {

    if (recordingActive) {
        return;
    }


    for (
        const word of distressWords
    ) {

        if (
            transcript.includes(
                word.toLowerCase()
            )
        ) {

            console.warn(
                "DISTRESS WORD DETECTED:",
                word
            );


            triggerIncident(
                "Distress word detected: " + word
            );


            return;
        }

    }

}


/* =========================================================
   GET LOCATION
========================================================= */

function getUserLocation() {

    const locationStatus =
        document.getElementById(
            "locationStatus"
        );


    if (!locationStatus) {
        return;
    }


    if (!navigator.geolocation) {

        locationStatus.textContent =
            "Geolocation is not supported by this browser.";

        return;
    }


    locationStatus.textContent =
        "Requesting location permission...";


    navigator.geolocation.getCurrentPosition(

        function (position) {

            locationData.latitude =
                position.coords.latitude;

            locationData.longitude =
                position.coords.longitude;

            locationData.accuracy =
                position.coords.accuracy;


            console.log(
                "Location:",
                locationData
            );


            locationStatus.textContent =
                "Location detected successfully.";


            const latitudeElement =
                document.getElementById(
                    "latitude"
                );


            const longitudeElement =
                document.getElementById(
                    "longitude"
                );


            const accuracyElement =
                document.getElementById(
                    "accuracy"
                );


            if (latitudeElement) {

                latitudeElement.textContent =
                    locationData.latitude.toFixed(6);

            }


            if (longitudeElement) {

                longitudeElement.textContent =
                    locationData.longitude.toFixed(6);

            }


            if (accuracyElement) {

                accuracyElement.textContent =
                    Math.round(
                        locationData.accuracy
                    ) + " m";

            }

        },


        function (error) {

            console.warn(
                "Location error:",
                error
            );


            locationStatus.textContent =
                "Location permission unavailable.";

        },


        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }

    );

}


/* =========================================================
   TRIGGER INCIDENT
========================================================= */

function triggerIncident(
    reason
) {

    if (recordingActive) {

        console.log(
            "Recording already active."
        );

        return;
    }


    if (!audioStream) {

        console.error(
            "No microphone stream available."
        );

        return;
    }


    recordingActive = true;


    /* -----------------------------------------------------
       STOP SPEECH RECOGNITION
    ----------------------------------------------------- */

    if (speechRecognition) {

        try {

            speechRecognition.stop();

        }

        catch (error) {

            console.log(
                "Speech stop:",
                error
            );

        }

    }


    /* -----------------------------------------------------
       UPDATE UI
    ----------------------------------------------------- */

    showDangerState(
        reason
    );


    startRecording(
        reason
    );

}


/* =========================================================
   START RECORDING
========================================================= */

function startRecording(
    reason
) {

    audioChunks = [];


    if (
        !window.MediaRecorder
    ) {

        showResult(
            "Recording Error",
            "This browser does not support audio recording.",
            true
        );


        recordingActive = false;

        return;
    }


    let mimeType = "";


    if (
        MediaRecorder.isTypeSupported(
            "audio/webm;codecs=opus"
        )
    ) {

        mimeType =
            "audio/webm;codecs=opus";

    }

    else if (
        MediaRecorder.isTypeSupported(
            "audio/webm"
        )
    ) {

        mimeType =
            "audio/webm";

    }


    try {

        mediaRecorder =
            mimeType
                ? new MediaRecorder(
                    audioStream,
                    {
                        mimeType: mimeType
                    }
                )
                : new MediaRecorder(
                    audioStream
                );

    }

    catch (error) {

        console.error(
            "MediaRecorder error:",
            error
        );


        showResult(
            "Recording Error",
            "The browser could not start audio recording.",
            true
        );


        recordingActive = false;

        return;
    }


    mediaRecorder.ondataavailable =
        function (event) {

            if (
                event.data &&
                event.data.size > 0
            ) {

                audioChunks.push(
                    event.data
                );

            }

        };


    mediaRecorder.onerror =
        function (event) {

            console.error(
                "MediaRecorder error:",
                event
            );

        };


    mediaRecorder.onstop =
        function () {

            const recordingType =
                mediaRecorder.mimeType ||
                "audio/webm";


            const audioBlob =
                new Blob(
                    audioChunks,
                    {
                        type: recordingType
                    }
                );


            if (audioBlob.size === 0) {

                showResult(
                    "Recording Error",
                    "No audio data was captured.",
                    true
                );


                recordingActive = false;

                return;
            }


            uploadRecording(
                audioBlob,
                reason
            );

        };


    try {

        mediaRecorder.start();

    }

    catch (error) {

        console.error(
            "Could not start recording:",
            error
        );


        showResult(
            "Recording Error",
            "The browser could not start recording.",
            true
        );


        recordingActive = false;

        return;
    }


    console.log(
        "Automatic recording started."
    );


    const recordingBox =
        document.getElementById(
            "recordingBox"
        );


    if (recordingBox) {

        recordingBox.classList.add(
            "active"
        );

    }


    updateDetectionStatus(
        "Recording incident"
    );


    /* -----------------------------------------------------
       RECORD FOR 15 SECONDS
    ----------------------------------------------------- */

    recordingTimer =
        setTimeout(
            function () {

                stopRecording();

            },
            15000
        );

}


/* =========================================================
   STOP RECORDING
========================================================= */

function stopRecording() {

    if (recordingTimer) {

        clearTimeout(
            recordingTimer
        );

        recordingTimer = null;

    }


    if (
        mediaRecorder &&
        mediaRecorder.state !== "inactive"
    ) {

        mediaRecorder.stop();

    }

}


/* =========================================================
   UPLOAD RECORDING
========================================================= */

async function uploadRecording(
    audioBlob,
    reason
) {

    console.log(
        "Uploading evidence..."
    );


    updateDetectionStatus(
        "Uploading evidence..."
    );


    const formData =
        new FormData();


    formData.append(
        "audio",
        audioBlob,
        "incident.webm"
    );


    formData.append(
        "reason",
        reason
    );


    formData.append(
        "timestamp",
        new Date().toISOString()
    );


    formData.append(
        "latitude",
        locationData.latitude
    );


    formData.append(
        "longitude",
        locationData.longitude
    );


    formData.append(
        "accuracy",
        locationData.accuracy
    );


    try {

        const response =
            await fetch(
                "/api/recording",
                {
                    method: "POST",
                    body: formData
                }
            );


        let data;


        try {

            data =
                await response.json();

        }

        catch (jsonError) {

            data = {
                success: false,
                error: "Invalid server response."
            };

        }


        console.log(
            "Server response:",
            data
        );


        if (
            response.ok &&
            data.success
        ) {

            showResult(
                "Evidence Saved Successfully",
                "The detected incident has been recorded and saved by Tutelaris.",
                false
            );


            updateDetectionStatus(
                "Evidence saved"
            );

        }

        else {

            showResult(
                "Evidence Upload Failed",
                data.error ||
                "The recording could not be saved.",
                true
            );


            updateDetectionStatus(
                "Upload failed"
            );

        }

    }

    catch (error) {

        console.error(
            "Upload error:",
            error
        );


        showResult(
            "Connection Error",
            "The recording was created but could not be sent to the Flask server.",
            true
        );


        updateDetectionStatus(
            "Server unavailable"
        );

    }


    const recordingBox =
        document.getElementById(
            "recordingBox"
        );


    if (recordingBox) {

        recordingBox.classList.remove(
            "active"
        );

    }


    recordingActive = false;


    /* -----------------------------------------------------
       RESTART SPEECH RECOGNITION
    ----------------------------------------------------- */

    if (
        monitoringActive &&
        speechRecognition
    ) {

        try {

            speechRecognition.start();

        }

        catch (error) {

            console.log(
                "Speech recognition restart:",
                error
            );

        }

    }

}


/* =========================================================
   DANGER UI
========================================================= */

function showDangerState(
    reason
) {

    const dangerBox =
        document.getElementById(
            "dangerBox"
        );


    const dangerIcon =
        document.getElementById(
            "dangerIcon"
        );


    const dangerTitle =
        document.getElementById(
            "dangerTitle"
        );


    const dangerMessage =
        document.getElementById(
            "dangerMessage"
        );


    if (dangerBox) {

        dangerBox.classList.remove(
            "safe"
        );

        dangerBox.classList.add(
            "danger"
        );

    }


    if (dangerIcon) {

        dangerIcon.textContent =
            "!";

    }


    if (dangerTitle) {

        dangerTitle.textContent =
            "Possible distress detected";

    }


    if (dangerMessage) {

        dangerMessage.textContent =
            reason +
            ". Evidence recording has started automatically.";

    }

}


/* =========================================================
   MONITOR UI
========================================================= */

function updateMonitor(
    state,
    title,
    message
) {

    const monitorStatus =
        document.getElementById(
            "monitorStatus"
        );


    const monitorTitle =
        document.getElementById(
            "monitorTitle"
        );


    const monitorText =
        document.getElementById(
            "monitorText"
        );


    if (monitorStatus) {

        monitorStatus.classList.remove(
            "active",
            "inactive"
        );


        monitorStatus.classList.add(
            state
        );

    }


    if (monitorTitle) {

        monitorTitle.textContent =
            title;

    }


    if (monitorText) {

        monitorText.textContent =
            message;

    }

}


/* =========================================================
   MICROPHONE STATUS
========================================================= */

function updateMicrophoneStatus(
    text
) {

    const element =
        document.getElementById(
            "microphoneStatus"
        );


    if (element) {

        element.textContent =
            text;

    }

}


/* =========================================================
   SPEECH STATUS
========================================================= */

function updateSpeechStatus(
    text
) {

    const element =
        document.getElementById(
            "speechStatus"
        );


    if (element) {

        element.textContent =
            text;

    }

}


/* =========================================================
   DETECTION STATUS
========================================================= */

function updateDetectionStatus(
    text
) {

    const element =
        document.getElementById(
            "detectionStatus"
        );


    if (element) {

        element.textContent =
            text;

    }

}


/* =========================================================
   RESULT BOX
========================================================= */

function showResult(
    title,
    message,
    error = false
) {

    const box =
        document.getElementById(
            "resultBox"
        );


    const resultTitle =
        document.getElementById(
            "resultTitle"
        );


    const resultMessage =
        document.getElementById(
            "resultMessage"
        );


    if (!box) {
        return;
    }


    box.classList.add(
        "show"
    );


    box.classList.toggle(
        "error",
        error
    );


    if (resultTitle) {

        resultTitle.textContent =
            title;

    }


    if (resultMessage) {

        resultMessage.textContent =
            message;

    }

}