/* =========================================================
   TUTELARIS - MY SAFE ROUTE
   POLICE STATION VERSION
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("TUTELARIS My Safe Route loaded");

    /* =====================================================
       VARIABLES
    ===================================================== */

    let map = null;
    let routeLine = null;

    let currentMarker = null;
    let vehicleMarker = null;
    let destinationMarker = null;

    let currentLocation = null;
    let selectedVehicle = "Cab";

    let routeCoordinates = [];
    let routeSegments = [];
    let routeDistance = 0;

    let journeyStarted = false;
    let journeySeconds = 0;
    let journeyTimer = null;

    let gpsWatchId = null;

    let policeMarkers = [];

    const MAX_POLICE = 5;

    /*
       If the user is more than this distance from
       the planned route, we consider it a deviation.
    */
    const DEVIATION_THRESHOLD_KM = 0.25; // 250 metres


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const startInput =
        document.getElementById("startLocation");

    const destinationInput =
        document.getElementById("destination");

    const currentButton =
        document.getElementById("useCurrentLocation");

    const locationStatus =
        document.getElementById("locationStatus");

    const destinationDropdown =
        document.getElementById("destinationDropdown");

    const destinationStatus =
        document.getElementById("destinationStatus");

    const routeStatus =
        document.getElementById("routeStatus");

    const gpsStatus =
        document.getElementById("gpsStatus");

    const safetyStatus =
        document.getElementById("safetyStatus");

    const journeyTime =
        document.getElementById("journeyTime");

    const distanceRemaining =
        document.getElementById("distanceRemaining");

    const routeFollowStatus =
        document.getElementById("routeFollowStatus");

    const vehicleStatus =
        document.getElementById("vehicleStatus");

    const nearestPolice =
        document.getElementById("nearestPolice");


    /* =====================================================
       INITIALIZE MAP
    ===================================================== */

    function initializeMap() {

        map = L.map("map", {
            zoomControl: true
        }).setView(
            [13.3409, 74.7421],
            12
        );

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,
                attribution:
                    "&copy; OpenStreetMap contributors"
            }
        ).addTo(map);

        console.log("Map initialized");
    }

    initializeMap();


    /* =====================================================
       VEHICLE SELECTION
    ===================================================== */

    const vehicleButtons =
        document.querySelectorAll(".vehicle-option");

    vehicleButtons.forEach(button => {

        button.addEventListener("click", function () {

            vehicleButtons.forEach(b => {
                b.classList.remove("selected");
            });

            this.classList.add("selected");

            selectedVehicle =
                this.dataset.vehicle;

            if (vehicleStatus) {
                vehicleStatus.textContent =
                    selectedVehicle;
            }

            updateVehicleMarker();
        });

    });


    /* =====================================================
       VEHICLE ICON
    ===================================================== */

    function vehicleEmoji() {

        switch (selectedVehicle) {

            case "Cab":
                return "🚕";

            case "Auto":
                return "🛺";

            case "Bus":
                return "🚌";

            default:
                return "🚗";
        }
    }


    /* =====================================================
       VEHICLE MARKER
    ===================================================== */

    function updateVehicleMarker() {

        if (!currentLocation || !map) {
            return;
        }

        if (vehicleMarker) {
            map.removeLayer(vehicleMarker);
        }

        const icon = L.divIcon({

            className:
                "vehicle-map-marker",

            html: `
                <div class="vehicle-circle">
                    ${vehicleEmoji()}
                </div>
            `,

            iconSize: [64, 64],

            iconAnchor: [32, 32]
        });

        vehicleMarker =
            L.marker(
                [
                    currentLocation.lat,
                    currentLocation.lon
                ],
                {
                    icon: icon,
                    zIndexOffset: 2000
                }
            )
            .addTo(map);

        vehicleMarker.bindPopup(
            `<b>${vehicleEmoji()} Your ${escapeHtml(selectedVehicle)}</b>`
        );
    }


    /* =====================================================
       CURRENT LOCATION BUTTON
    ===================================================== */

    if (currentButton) {

        currentButton.addEventListener(
            "click",
            getCurrentLocation
        );
    }


    /* =====================================================
       GET CURRENT LOCATION
    ===================================================== */

    function getCurrentLocation() {

        console.log("Requesting real GPS...");

        if (!navigator.geolocation) {

            setLocationError(
                "GPS is not supported by this browser."
            );

            return;
        }

        currentButton.disabled = true;

        currentButton.textContent =
            "📍 Detecting location...";

        locationStatus.textContent =
            "Requesting GPS permission...";

        locationStatus.className =
            "location-status";

        navigator.geolocation.getCurrentPosition(

            function (position) {

                setCurrentLocation(
                    position
                );

                currentButton.disabled = false;

                currentButton.textContent =
                    "✓ Current Location Detected";

                startLiveGPS();

                /*
                   If destination already exists,
                   calculate route.
                */

                if (
                    destinationInput.value.trim()
                ) {

                    calculateRoute();
                }
            },

            function (error) {

                console.error(
                    "GPS ERROR:",
                    error.code,
                    error.message
                );

                let message =
                    "Unable to get your location.";

                if (
                    error.code ===
                    error.PERMISSION_DENIED
                ) {

                    message =
                        "Location permission denied. Please allow location access.";

                } else if (
                    error.code ===
                    error.POSITION_UNAVAILABLE
                ) {

                    message =
                        "GPS location is unavailable. Turn ON Location/GPS.";

                } else if (
                    error.code ===
                    error.TIMEOUT
                ) {

                    message =
                        "GPS timed out. Please try again.";

                }

                setLocationError(message);

                currentButton.disabled = false;

                currentButton.textContent =
                    "📍 Use My Current Location";
            },

            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 0
            }
        );
    }


    /* =====================================================
       SET CURRENT LOCATION
    ===================================================== */

    function setCurrentLocation(position) {

        currentLocation = {

            lat:
                position.coords.latitude,

            lon:
                position.coords.longitude
        };

        startInput.value =
            currentLocation.lat.toFixed(6)
            +
            ", "
            +
            currentLocation.lon.toFixed(6);

        locationStatus.textContent =
            "✓ Current location detected";

        locationStatus.className =
            "location-status success";

        if (gpsStatus) {
            gpsStatus.textContent =
                "Location Active";
        }

        map.setView(
            [
                currentLocation.lat,
                currentLocation.lon
            ],
            15
        );

        if (currentMarker) {
            map.removeLayer(currentMarker);
        }

        currentMarker =
            L.marker(
                [
                    currentLocation.lat,
                    currentLocation.lon
                ]
            )
            .addTo(map)
            .bindPopup(
                "<b>📍 Your Current Location</b>"
            );

        updateVehicleMarker();

        if (
            journeyStarted &&
            routeCoordinates.length
        ) {

            updateJourneyProgress();
        }
    }


    /* =====================================================
       LOCATION ERROR
    ===================================================== */

    function setLocationError(message) {

        locationStatus.textContent =
            "✕ " + message;

        locationStatus.className =
            "location-status error";

        if (gpsStatus) {
            gpsStatus.textContent =
                "GPS Error";
        }
    }


    /* =====================================================
       LIVE GPS
    ===================================================== */

    function startLiveGPS() {

        if (!navigator.geolocation) {
            return;
        }

        if (gpsWatchId !== null) {

            navigator.geolocation.clearWatch(
                gpsWatchId
            );
        }

        gpsWatchId =
            navigator.geolocation.watchPosition(

                function (position) {

                    setCurrentLocation(position);

                    if (
                        journeyStarted &&
                        routeCoordinates.length
                    ) {

                        updateJourneyProgress();
                    }
                },

                function (error) {

                    console.log(
                        "Live GPS:",
                        error.message
                    );

                    if (gpsStatus) {
                        gpsStatus.textContent =
                            "GPS Signal Issue";
                    }
                },

                {
                    enableHighAccuracy: true,
                    maximumAge: 3000,
                    timeout: 20000
                }
            );
    }


    /* =====================================================
       DESTINATION SEARCH
    ===================================================== */

    let searchTimeout = null;

    destinationInput.addEventListener(
        "input",
        function () {

            const text =
                this.value.trim();

            clearTimeout(searchTimeout);

            destinationStatus.textContent =
                "Enter your destination";

            destinationStatus.className =
                "destination-status";

            if (text.length < 2) {

                destinationDropdown.classList.remove(
                    "show"
                );

                return;
            }

            searchTimeout =
                setTimeout(
                    function () {

                        searchDestination(text);

                    },
                    500
                );
        }
    );


    /* =====================================================
       SEARCH DESTINATION
    ===================================================== */

    async function searchDestination(text) {

        try {

            const url =
                "https://nominatim.openstreetmap.org/search"
                +
                "?format=json"
                +
                "&addressdetails=1"
                +
                "&limit=5"
                +
                "&countrycodes=in"
                +
                "&q="
                +
                encodeURIComponent(
                    text + ", India"
                );

            const response =
                await fetch(url, {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                });

            if (!response.ok) {
                throw new Error(
                    "Destination search failed"
                );
            }

            const results =
                await response.json();

            destinationDropdown.innerHTML = "";

            if (!results.length) {

                destinationDropdown.innerHTML =
                    `
                    <div class="destination-option">
                        No Indian location found
                    </div>
                    `;

                destinationDropdown.classList.add(
                    "show"
                );

                return;
            }

            results.forEach(result => {

                const option =
                    document.createElement(
                        "div"
                    );

                option.className =
                    "destination-option";

                option.textContent =
                    "📍 " +
                    result.display_name;

                option.addEventListener(
                    "click",
                    function () {

                        destinationInput.value =
                            result.display_name;

                        destinationDropdown.classList.remove(
                            "show"
                        );

                        destinationStatus.textContent =
                            "✓ Destination selected";

                        destinationStatus.className =
                            "destination-status success";

                        calculateRoute();
                    }
                );

                destinationDropdown.appendChild(
                    option
                );
            });

            destinationDropdown.classList.add(
                "show"
            );

        } catch (error) {

            console.error(
                "Destination search:",
                error
            );

            destinationDropdown.innerHTML =
                `
                <div class="destination-option">
                    Search temporarily unavailable
                </div>
                `;

            destinationDropdown.classList.add(
                "show"
            );
        }
    }


    /* =====================================================
       CLOSE DROPDOWN
    ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            if (
                !event.target.closest(
                    ".destination-wrapper"
                )
            ) {

                destinationDropdown.classList.remove(
                    "show"
                );
            }
        }
    );


    /* =====================================================
       DESTINATION ENTER
    ===================================================== */

    destinationInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                destinationDropdown.classList.remove(
                    "show"
                );

                calculateRoute();
            }
        }
    );


    /* =====================================================
       CALCULATE ROUTE
    ===================================================== */

    async function calculateRoute() {

        const destinationText =
            destinationInput.value.trim();

        if (!destinationText) {
            return;
        }

        if (routeStatus) {
            routeStatus.textContent =
                "Calculating route...";
        }

        destinationStatus.textContent =
            "Searching destination...";

        destinationStatus.className =
            "destination-status";

        let start = null;

        /*
           Prefer actual GPS.
        */

        if (currentLocation) {

            start =
                currentLocation;

        } else if (
            startInput.value.trim()
        ) {

            start =
                await geocode(
                    startInput.value
                );
        }

        if (!start) {

            alert(
                "Please click 'Use My Current Location' first."
            );

            return;
        }

        const destination =
            await geocode(
                destinationText
            );

        if (!destination) {

            destinationStatus.textContent =
                "✕ Destination not found";

            destinationStatus.className =
                "destination-status error";

            if (routeStatus) {
                routeStatus.textContent =
                    "Destination not found";
            }

            return;
        }

        destinationStatus.textContent =
            "✓ Destination found";

        destinationStatus.className =
            "destination-status success";

        const route =
            await getOSRMRoute(
                start,
                destination
            );

        if (!route) {
            return;
        }

        routeCoordinates =
            route.coordinates;

        routeDistance =
            route.distance;

        buildRouteSegments(
            routeCoordinates
        );

        drawRoute(
            route.coordinates
        );

        updateDistance(
            route.distance
        );

        if (routeStatus) {
            routeStatus.textContent =
                "Route Ready";
        }

        if (routeFollowStatus) {
            routeFollowStatus.textContent =
                "Following Planned Route";
        }

        /*
           Search hardcoded police stations
           through Flask.
        */

        searchSafetyFacilities(
            route.coordinates
        );

        startJourneyTimer();
    }


    /* =====================================================
       GEOCODE
    ===================================================== */

    async function geocode(place) {

        try {

            let query =
                place.trim();

            if (
                !query.toLowerCase().includes(
                    "india"
                )
            ) {

                query +=
                    ", India";
            }

            const url =
                "https://nominatim.openstreetmap.org/search"
                +
                "?format=json"
                +
                "&limit=1"
                +
                "&countrycodes=in"
                +
                "&q="
                +
                encodeURIComponent(query);

            const response =
                await fetch(url);

            if (!response.ok) {
                throw new Error(
                    "Geocoding failed"
                );
            }

            const data =
                await response.json();

            if (!data.length) {
                return null;
            }

            return {

                lat:
                    parseFloat(
                        data[0].lat
                    ),

                lon:
                    parseFloat(
                        data[0].lon
                    )
            };

        } catch (error) {

            console.error(
                "Geocode error:",
                error
            );

            return null;
        }
    }


    /* =====================================================
       OSRM ROUTE
    ===================================================== */

    async function getOSRMRoute(
        start,
        destination
    ) {

        try {

            const url =
                "https://router.project-osrm.org/route/v1/driving/"
                +
                start.lon
                +
                ","
                +
                start.lat
                +
                ";"
                +
                destination.lon
                +
                ","
                +
                destination.lat
                +
                "?overview=full&geometries=geojson";

            const response =
                await fetch(url);

            if (!response.ok) {
                throw new Error(
                    "Routing service unavailable"
                );
            }

            const data =
                await response.json();

            if (
                data.code !== "Ok" ||
                !data.routes ||
                !data.routes.length
            ) {

                alert(
                    "Route unavailable."
                );

                if (routeStatus) {
                    routeStatus.textContent =
                        "Route unavailable";
                }

                return null;
            }

            return {

                coordinates:
                    data.routes[0]
                        .geometry
                        .coordinates,

                distance:
                    data.routes[0]
                        .distance,

                duration:
                    data.routes[0]
                        .duration
            };

        } catch (error) {

            console.error(
                "Routing error:",
                error
            );

            alert(
                "Could not calculate route. Check your internet connection."
            );

            if (routeStatus) {
                routeStatus.textContent =
                    "Routing unavailable";
            }

            return null;
        }
    }


    /* =====================================================
       BUILD ROUTE SEGMENTS
    ===================================================== */

    function buildRouteSegments(coordinates) {

        routeSegments = [];

        let total = 0;

        for (
            let i = 1;
            i < coordinates.length;
            i++
        ) {

            const previous =
                coordinates[i - 1];

            const current =
                coordinates[i];

            const segmentDistance =
                distanceKm(
                    previous[1],
                    previous[0],
                    current[1],
                    current[0]
                );

            routeSegments.push({

                start:
                    previous,

                end:
                    current,

                distance:
                    segmentDistance,

                cumulative:
                    total
            });

            total += segmentDistance;
        }
    }


    /* =====================================================
       DRAW ROUTE
    ===================================================== */

    function drawRoute(coordinates) {

        if (routeLine) {
            map.removeLayer(routeLine);
        }

        routeLine =
            L.polyline(

                coordinates.map(
                    point => [
                        point[1],
                        point[0]
                    ]
                ),

                {
                    color: "#6b2aa5",
                    weight: 6,
                    opacity: 0.95
                }
            )
            .addTo(map);

        const last =
            coordinates[
                coordinates.length - 1
            ];

        if (destinationMarker) {
            map.removeLayer(
                destinationMarker
            );
        }

        destinationMarker =
            L.marker(
                [
                    last[1],
                    last[0]
                ]
            )
            .addTo(map)
            .bindPopup(
                "<b>🎯 Destination</b>"
            );

        map.fitBounds(
            routeLine.getBounds(),
            {
                padding: [40, 40]
            }
        );

        if (vehicleMarker) {
            vehicleMarker.setZIndexOffset(1000);
        }
    }


    /* =====================================================
       SEARCH POLICE STATIONS
    ===================================================== */

    async function searchSafetyFacilities(route) {

        nearestPolice.textContent =
            "Searching police stations...";

        try {

            const response =
                await fetch(
                    "/api/facilities",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            route:
                                route.map(
                                    point => [
                                        point[1],
                                        point[0]
                                    ]
                                )
                        })
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Police station search failed"
                );
            }


            clearSafetyMarkers();


            const police =
                data.police || [];


            displaySafetyMarkers(
                police.slice(
                    0,
                    MAX_POLICE
                ),
                "police"
            );


            if (police.length) {

                nearestPolice.textContent =
                    police[0].name;

            } else {

                nearestPolice.textContent =
                    "No police station found";

            }


        } catch (error) {

            console.error(
                "Police station search failed:",
                error
            );

            nearestPolice.textContent =
                "Unable to load police stations";
        }
    }


    /* =====================================================
       DISPLAY POLICE MARKERS
    ===================================================== */

    function displaySafetyMarkers(
        facilities,
        type
    ) {

        facilities.forEach(
            facility => {

                const emoji = "👮";

                const icon =
                    L.divIcon({

                        className:
                            "safety-map-marker",

                        html:
                            `
                            <div class="
                                safety-circle
                                police-marker
                            ">
                                ${emoji}
                            </div>
                            `,

                        iconSize:
                            [46, 46],

                        iconAnchor:
                            [23, 23]
                    });


                const marker =
                    L.marker(
                        [
                            facility.latitude,
                            facility.longitude
                        ],
                        {
                            icon: icon
                        }
                    )
                    .addTo(map);


                marker.bindPopup(
                    `
                    <b>
                        ${emoji}
                        ${escapeHtml(
                            facility.name
                        )}
                    </b>
                    <br>
                    Police Station
                    <br>
                    ${escapeHtml(
                        facility.address || ""
                    )}
                    `
                );


                policeMarkers.push(
                    marker
                );

            }
        );
    }


    /* =====================================================
       CLEAR POLICE MARKERS
    ===================================================== */

    function clearSafetyMarkers() {

        policeMarkers.forEach(
            marker => {

                if (map.hasLayer(marker)) {

                    map.removeLayer(
                        marker
                    );

                }

            }
        );

        policeMarkers = [];
    }


    /* =====================================================
       INITIAL DISTANCE
    ===================================================== */

    function updateDistance(meters) {

        if (
            meters === undefined ||
            meters === null ||
            isNaN(meters)
        ) {
            return;
        }

        const km =
            meters / 1000;

        distanceRemaining.textContent =
            km.toFixed(1) +
            " km";
    }


    /* =====================================================
       JOURNEY TIMER
    ===================================================== */

    function startJourneyTimer() {

        if (journeyStarted) {
            return;
        }

        journeyStarted = true;

        safetyStatus.textContent =
            "SAFE — ON ROUTE";

        routeFollowStatus.textContent =
            "Following Planned Route";

        if (gpsStatus) {
            gpsStatus.textContent =
                "Location Active";
        }

        journeyTimer =
            setInterval(
                function () {

                    journeySeconds++;

                    const minutes =
                        Math.floor(
                            journeySeconds / 60
                        );

                    const seconds =
                        journeySeconds % 60;

                    journeyTime.textContent =
                        String(minutes)
                            .padStart(2, "0")
                        +
                        ":"
                        +
                        String(seconds)
                            .padStart(2, "0");

                },
                1000
            );
    }


    /* =====================================================
       JOURNEY PROGRESS + DEVIATION
    ===================================================== */

    function updateJourneyProgress() {

        if (
            !currentLocation ||
            !routeCoordinates.length
        ) {
            return;
        }

        const progress =
            getNearestRoutePosition(
                currentLocation.lat,
                currentLocation.lon
            );

        if (!progress) {
            return;
        }

        const remainingKm =
            Math.max(
                0,
                routeDistance / 1000 -
                progress.distanceAlongRoute
            );

        distanceRemaining.textContent =
            remainingKm.toFixed(1) +
            " km";


        if (
            progress.distanceFromRoute >
            DEVIATION_THRESHOLD_KM
        ) {

            safetyStatus.textContent =
                "⚠️ OFF ROUTE";

            routeFollowStatus.textContent =
                "Route Deviation Detected";

            routeStatus.textContent =
                "⚠️ Route Deviation";

        } else {

            safetyStatus.textContent =
                "SAFE — ON ROUTE";

            routeFollowStatus.textContent =
                "Following Planned Route";

            routeStatus.textContent =
                "Route Active";
        }
    }


    /* =====================================================
       FIND NEAREST ROUTE POSITION
    ===================================================== */

    function getNearestRoutePosition(
        lat,
        lon
    ) {

        if (!routeSegments.length) {
            return null;
        }

        let bestDistance =
            Infinity;

        let bestAlongRoute = 0;

        routeSegments.forEach(
            segment => {

                const start =
                    segment.start;

                const end =
                    segment.end;

                const projection =
                    projectPointOntoSegment(
                        lat,
                        lon,
                        start[1],
                        start[0],
                        end[1],
                        end[0]
                    );

                if (
                    projection.distance <
                    bestDistance
                ) {

                    bestDistance =
                        projection.distance;

                    bestAlongRoute =
                        segment.cumulative
                        +
                        segment.distance *
                        projection.fraction;
                }
            }
        );

        return {

            distanceFromRoute:
                bestDistance,

            distanceAlongRoute:
                bestAlongRoute
        };
    }


    /* =====================================================
       PROJECT GPS POINT ONTO ROUTE SEGMENT
    ===================================================== */

    function projectPointOntoSegment(
        pointLat,
        pointLon,
        startLat,
        startLon,
        endLat,
        endLon
    ) {

        const latScale =
            111.32;

        const lonScale =
            111.32 *
            Math.cos(
                pointLat *
                Math.PI /
                180
            );

        const px =
            pointLon *
            lonScale;

        const py =
            pointLat *
            latScale;

        const ax =
            startLon *
            lonScale;

        const ay =
            startLat *
            latScale;

        const bx =
            endLon *
            lonScale;

        const by =
            endLat *
            latScale;

        const dx =
            bx - ax;

        const dy =
            by - ay;

        const lengthSquared =
            dx * dx +
            dy * dy;

        let fraction = 0;

        if (lengthSquared !== 0) {

            fraction =
                (
                    (px - ax) * dx +
                    (py - ay) * dy
                )
                /
                lengthSquared;
        }

        fraction =
            Math.max(
                0,
                Math.min(
                    1,
                    fraction
                )
            );

        const closestX =
            ax +
            fraction * dx;

        const closestY =
            ay +
            fraction * dy;

        const differenceX =
            px - closestX;

        const differenceY =
            py - closestY;

        const distance =
            Math.sqrt(
                differenceX *
                differenceX
                +
                differenceY *
                differenceY
            );

        return {

            fraction:
                fraction,

            distance:
                distance
        };
    }


    /* =====================================================
       HAVERSINE DISTANCE
    ===================================================== */

    function distanceKm(
        lat1,
        lon1,
        lat2,
        lon2
    ) {

        const R = 6371;

        const dLat =
            (
                lat2 -
                lat1
            )
            *
            Math.PI /
            180;

        const dLon =
            (
                lon2 -
                lon1
            )
            *
            Math.PI /
            180;

        const a =
            Math.sin(
                dLat / 2
            ) ** 2
            +
            Math.cos(
                lat1 *
                Math.PI /
                180
            )
            *
            Math.cos(
                lat2 *
                Math.PI /
                180
            )
            *
            Math.sin(
                dLon / 2
            ) ** 2;

        return (
            R *
            2 *
            Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            )
        );
    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHtml(text) {

        return String(text)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }

});