let userLatitude = null;
let userLongitude = null;
let routeUrl = null;


/* =====================================================
   FIND NEAREST POLICE STATION
===================================================== */

function findPoliceStation() {

    const locationBtn = document.getElementById("locationBtn");
    const result = document.getElementById("result");
    const coordinates = document.getElementById("coordinates");
    const stationText = document.getElementById("stationText");

    if (!navigator.geolocation) {

        showStatus(
            "Geolocation is not supported by your browser.",
            "error"
        );

        return;
    }

    locationBtn.disabled = true;

    locationBtn.innerHTML =
        "📍 Getting your location...";

    result.classList.add("hidden");

    showStatus(
        "Requesting your current location...",
        ""
    );


    navigator.geolocation.getCurrentPosition(

        async function(position) {

            userLatitude =
                position.coords.latitude;

            userLongitude =
                position.coords.longitude;
            console.log("USER LATITUDE:", userLatitude);
            console.log("USER LONGITUDE:", userLongitude);

            coordinates.textContent =
                userLatitude.toFixed(6)
                + ", "
                + userLongitude.toFixed(6);


            showStatus(
                "Finding the nearest police station...",
                ""
            );


            try {

                const response = await fetch(
                    "/api/nearby-police",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({

                            latitude: userLatitude,

                            longitude: userLongitude

                        })
                    }
                );


                const data = await response.json();


                if (!response.ok || !data.success) {

                    throw new Error(
                        data.message ||
                        "Unable to find a police station."
                    );
                }


                const station =
                    data.nearest_station;


                /*
                 * Save route URL for
                 * the Get Route button
                 */

                routeUrl =
                    data.route_url;


                /*
                 * Display station
                 */

                stationText.innerHTML = `

                    <strong>
                        ${station.name}
                    </strong>

                    <br>

                    ${station.address}

                    <br>

                    <small>
                        ${station.distance_km} km away
                    </small>

                `;


                result.classList.remove("hidden");


                showStatus(
                    "Nearest police station found successfully.",
                    "success"
                );


            } catch (error) {

                console.error(error);


                showStatus(
                    error.message ||
                    "Unable to find a nearby police station.",
                    "error"
                );

            }


            locationBtn.disabled = false;

            locationBtn.innerHTML =
                "📍 Find Nearest Police Station";

        },


        function(error) {

            let message =
                "Unable to get your location.";


            switch (error.code) {

                case error.PERMISSION_DENIED:

                    message =
                        "Location permission was denied. Please allow location access and try again.";

                    break;


                case error.POSITION_UNAVAILABLE:

                    message =
                        "Your location is currently unavailable. Please try again.";

                    break;


                case error.TIMEOUT:

                    message =
                        "Location request timed out. Please try again.";

                    break;

            }


            showStatus(
                message,
                "error"
            );


            locationBtn.disabled = false;

            locationBtn.innerHTML =
                "📍 Find Nearest Police Station";

        },


        {
            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 0
        }

    );
}


/* =====================================================
   SHOW STATUS
===================================================== */

function showStatus(message, type) {

    const status =
        document.getElementById("status");


    status.textContent =
        message;


    status.classList.remove(
        "hidden",
        "error",
        "success"
    );


    if (type) {

        status.classList.add(type);

    }

}


/* =====================================================
   OPEN ROUTE
===================================================== */

function openRoute() {

    if (!routeUrl) {

        showStatus(
            "Please find the nearest police station first.",
            "error"
        );

        return;
    }


    window.open(
        routeUrl,
        "_blank",
        "noopener,noreferrer"
    );

}


/* =====================================================
   PAGE LOAD
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "Tutelaris Safe Route Assistant loaded successfully."
        );

    }
);