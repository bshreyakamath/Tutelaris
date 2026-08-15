from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    flash,
    jsonify,
    send_file
)

import sqlite3

from math import radians, sin, cos, sqrt, atan2

from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)

from werkzeug.utils import secure_filename

from functools import wraps

from datetime import datetime

import os
import uuid
import json
import io
from dotenv import load_dotenv
from gtts import gTTS
load_dotenv()

app = Flask(__name__)

app.secret_key = os.environ.get("TUTELARIS_SECRET_KEY")
DATABASE = "tutelaris.db"


# =========================================================
# RECORDING UPLOAD CONFIGURATION
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

UPLOAD_FOLDER = os.path.join(
    BASE_DIR,
    "uploads"
)

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

app.config["MAX_CONTENT_LENGTH"] = (
    100 * 1024 * 1024
)


# =========================================================
# POLICE STATION DATASET
# =========================================================

POLICE_STATIONS = [

    # ---------------- Udupi ----------------

    {
        "name": "Udupi Town Police Station",
        "latitude": 13.3307,
        "longitude": 74.74819,
        "address": "Udupi, Karnataka"
    },

    {
        "name": "Udupi Traffic Police Station",
        "latitude": 13.33219,
        "longitude": 74.74812,
        "address": "Udupi, Karnataka"
    },

    {
        "name": "Manipal Police Station",
        "latitude": 13.34919,
        "longitude": 74.78597,
        "address": "Manipal, Udupi, Karnataka"
    },

    {
        "name": "Malpe Police Station",
        "latitude": 13.36065,
        "longitude": 74.70368,
        "address": "Malpe, Udupi, Karnataka"
    },

    {
        "name": "Shirva Police Station",
        "latitude": 13.217283,
        "longitude": 74.821398,
        "address": "Shirva, Udupi, Karnataka"
    },


    # ---------------- Mangaluru ----------------

    {
        "name": "Kadri Police Station",
        "latitude": 12.890255,
        "longitude": 74.852746,
        "address": "Bejai Main Road, Bejai, Mangaluru, Karnataka"
    },

    {
        "name": "Urwa Police Station",
        "latitude": 12.902246,
        "longitude": 74.835687,
        "address": "Urwa Store, Mangaluru, Karnataka"
    },

    {
        "name": "Barke Police Station",
        "latitude": 12.886586,
        "longitude": 74.831969,
        "address": "Gandhinagar, Mangaluru, Karnataka"
    },

    {
        "name": "Kankanady Town Police Station",
        "latitude": 12.869734,
        "longitude": 74.872677,
        "address": "Kankanady, Mangaluru, Karnataka"
    },

    {
        "name": "Mangaluru South Police Station",
        "latitude": 12.856060,
        "longitude": 74.839336,
        "address": "Pandeshwar, Mangaluru, Karnataka"
    },

    {
        "name": "Mangaluru North Police Station",
        "latitude": 12.864159,
        "longitude": 74.833509,
        "address": "Bunder, Mangaluru, Karnataka"
    },

    {
        "name": "Kavoor Police Station",
        "latitude": 12.922233,
        "longitude": 74.859583,
        "address": "Kavoor, Mangaluru, Karnataka"
    },

    {
        "name": "Surathkal Police Station",
        "latitude": 12.984274,
        "longitude": 74.802465,
        "address": "Surathkal, Mangaluru, Karnataka"
    },

    {
        "name": "Bajpe Police Station",
        "latitude": 12.980962,
        "longitude": 74.892457,
        "address": "Bajpe, Mangaluru, Karnataka"
    },

    {
        "name": "Mangaluru Rural Police Station",
        "latitude": 12.881892,
        "longitude": 74.877335,
        "address": "Kulashekara, Mangaluru, Karnataka"
    },

    {
        "name": "Ullal Police Station",
        "latitude": 12.819505,
        "longitude": 74.841539,
        "address": "Ullal, Mangaluru, Karnataka"
    },

    {
        "name": "Railway Police Station",
        "latitude": 12.863409,
        "longitude": 74.842428,
        "address": "Mangaluru Central Railway Station, Mangaluru, Karnataka"
    },


    # ---------------- Bengaluru ----------------

    {
        "name": "R T Nagar Police Station",
        "latitude": 13.0247282,
        "longitude": 77.5931992,
        "address": "R T Nagar, Bengaluru, Karnataka"
    },

    {
        "name": "Hebbal Police Station",
        "latitude": 13.0383923,
        "longitude": 77.5896368,
        "address": "Hebbal, Bengaluru, Karnataka"
    },

    {
        "name": "Koramangala Police Station",
        "latitude": 12.9411643,
        "longitude": 77.6212899,
        "address": "Koramangala, Bengaluru, Karnataka"
    },

    {
        "name": "JP Nagar Police Station",
        "latitude": 12.9118162,
        "longitude": 77.5876236,
        "address": "JP Nagar, Bengaluru, Karnataka"
    },

    {
        "name": "Mahadevapura Police Station",
        "latitude": 12.9967228,
        "longitude": 77.692824,
        "address": "Mahadevapura, Bengaluru, Karnataka"
    },

    {
        "name": "HAL Police Station",
        "latitude": 12.9550809,
        "longitude": 77.6837176,
        "address": "HAL, Bengaluru, Karnataka"
    },

    {
        "name": "Ashoka Nagar Police Station",
        "latitude": 12.9716635,
        "longitude": 77.6101324,
        "address": "Ashoka Nagar, Bengaluru, Karnataka"
    },

    {
        "name": "Kadugudi Police Station",
        "latitude": 12.9954639,
        "longitude": 77.7577067,
        "address": "Kadugudi, Bengaluru, Karnataka"
    },

    {
        "name": "Seshadripuram Police Station",
        "latitude": 12.9880533,
        "longitude": 77.5743464,
        "address": "Seshadripuram, Bengaluru, Karnataka"
    },

    {
        "name": "Thilaknagar Police Station",
        "latitude": 12.9283631,
        "longitude": 77.5905724,
        "address": "Jayanagar, Bengaluru, Karnataka"
    },

    {
        "name": "Byatarayanapura Police Station",
        "latitude": 12.9514004,
        "longitude": 77.5401571,
        "address": "Byatarayanapura, Bengaluru, Karnataka"
    },

    {
        "name": "Vidyaranyapura Police Station",
        "latitude": 13.0839961,
        "longitude": 77.5645451,
        "address": "Vidyaranyapura, Bengaluru, Karnataka"
    },

    {
        "name": "Malleshwaram Police Station",
        "latitude": 12.9966667,
        "longitude": 77.5697222,
        "address": "Malleshwaram, Bengaluru, Karnataka"
    },

    {
        "name": "JC Nagar Police Station",
        "latitude": 13.0055787,
        "longitude": 77.593574,
        "address": "JC Nagar, Bengaluru, Karnataka"
    },

    {
        "name": "Basavanagudi Police Station",
        "latitude": 12.9567,
        "longitude": 77.5750,
        "address": "Basavanagudi, Bengaluru, Karnataka"
    },

    {
        "name": "Indiranagar Police Station",
        "latitude": 12.9784,
        "longitude": 77.6408,
        "address": "Indiranagar, Bengaluru, Karnataka"
    },

    {
        "name": "Wilson Garden Police Station",
        "latitude": 12.9519,
        "longitude": 77.5953,
        "address": "Wilson Garden, Bengaluru, Karnataka"
    },

    {
        "name": "Baiyappanahalli Police Station",
        "latitude": 13.0018,
        "longitude": 77.6586,
        "address": "Baiyappanahalli, Bengaluru, Karnataka"
    },

    {
        "name": "Ramamurthy Nagar Police Station",
        "latitude": 13.0120,
        "longitude": 77.6780,
        "address": "Ramamurthy Nagar, Bengaluru, Karnataka"
    }

]


# =========================================================
# DISTANCE CALCULATION
# =========================================================

def calculate_distance(
    lat1,
    lon1,
    lat2,
    lon2
):

    earth_radius = 6371.0

    lat1 = radians(lat1)
    lon1 = radians(lon1)

    lat2 = radians(lat2)
    lon2 = radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        sin(dlat / 2) ** 2
        + cos(lat1)
        * cos(lat2)
        * sin(dlon / 2) ** 2
    )

    c = 2 * atan2(
        sqrt(a),
        sqrt(1 - a)
    )

    return earth_radius * c


# =========================================================
# DATABASE
# =========================================================

def get_db():

    conn = sqlite3.connect(
        DATABASE
    )

    conn.row_factory = sqlite3.Row

    return conn


# =========================================================
# CREATE DATABASE TABLE
# =========================================================

def init_db():

    conn = get_db()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            email TEXT UNIQUE NOT NULL,

            password TEXT NOT NULL,

            nickname TEXT NOT NULL,

            emergency_contact TEXT NOT NULL,

            age INTEGER NOT NULL,

            terms_accepted INTEGER NOT NULL,

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP

        )
    """)

    conn.commit()

    conn.close()


# =========================================================
# LOGIN REQUIRED
# =========================================================

def login_required(function):

    @wraps(function)
    def wrapper(*args, **kwargs):

        if "user_id" not in session:

            flash(
                "Please login first.",
                "error"
            )

            return redirect(
                url_for("login")
            )

        return function(
            *args,
            **kwargs
        )

    return wrapper


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():

    if "user_id" in session:

        return redirect(
            url_for("dashboard")
        )

    return redirect(
        url_for("login")
    )


# =========================================================
# SIGNUP
# =========================================================

@app.route(
    "/signup",
    methods=["GET", "POST"]
)
def signup():

    if request.method == "POST":

        name = request.form.get(
            "name",
            ""
        ).strip()

        email = request.form.get(
            "email",
            ""
        ).strip().lower()

        password = request.form.get(
            "password",
            ""
        )

        nickname = request.form.get(
            "nickname",
            ""
        ).strip()

        emergency_contact = request.form.get(
            "emergency_contact",
            ""
        ).strip()

        age = request.form.get(
            "age",
            ""
        )

        terms = request.form.get(
            "terms"
        )


        if not name:

            flash(
                "Please enter your full name.",
                "error"
            )

            return redirect(
                url_for("signup")
            )


        if not email:

            flash(
                "Please enter your email.",
                "error"
            )

            return redirect(
                url_for("signup")
            )


        if not password:

            flash(
                "Please create a password.",
                "error"
            )

            return redirect(
                url_for("signup")
            )


        if not nickname:

            flash(
                "Please enter a nickname for the AI fake call.",
                "error"
            )

            return redirect(
                url_for("signup")
            )


        if not emergency_contact:

            flash(
                "Please enter an emergency contact number.",
                "error"
            )

            return redirect(
                url_for("signup")
            )


        if not age:

            flash(
                "Please enter your age.",
                "error"
            )

            return redirect(
                url_for("signup")
            )


        if not terms:

            flash(
                "You must accept the Terms of Service and Privacy Policy.",
                "error"
            )

            return redirect(
                url_for("signup")
            )


        if len(password) < 6:

            flash(
                "Password must contain at least 6 characters.",
                "error"
            )

            return redirect(
                url_for("signup")
            )


        try:

            age = int(age)

        except ValueError:

            flash(
                "Please enter a valid age.",
                "error"
            )

            return redirect(
                url_for("signup")
            )


        if age < 1 or age > 120:

            flash(
                "Please enter a valid age.",
                "error"
            )

            return redirect(
                url_for("signup")
            )


        hashed_password = generate_password_hash(
            password
        )


        conn = get_db()

        try:

            conn.execute(
                """
                INSERT INTO users
                (
                    name,
                    email,
                    password,
                    nickname,
                    emergency_contact,
                    age,
                    terms_accepted
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    name,
                    email,
                    hashed_password,
                    nickname,
                    emergency_contact,
                    age,
                    1
                )
            )

            conn.commit()

        except sqlite3.IntegrityError:

            conn.close()

            flash(
                "An account with this email already exists.",
                "error"
            )

            return redirect(
                url_for("signup")
            )

        conn.close()


        flash(
            "Account created successfully! Please login.",
            "success"
        )

        return redirect(
            url_for("login")
        )


    return render_template(
        "signup.html"
    )


# =========================================================
# LOGIN
# =========================================================

@app.route(
    "/login",
    methods=["GET", "POST"]
)
def login():

    if request.method == "POST":

        email = request.form.get(
            "email",
            ""
        ).strip().lower()

        password = request.form.get(
            "password",
            ""
        )


        if not email or not password:

            flash(
                "Please enter email and password.",
                "error"
            )

            return redirect(
                url_for("login")
            )


        conn = get_db()

        user = conn.execute(
            """
            SELECT *
            FROM users
            WHERE email = ?
            """,
            (email,)
        ).fetchone()

        conn.close()


        if user is None:

            flash(
                "No account found with this email.",
                "error"
            )

            return redirect(
                url_for("login")
            )


        if not check_password_hash(
            user["password"],
            password
        ):

            flash(
                "Incorrect password.",
                "error"
            )

            return redirect(
                url_for("login")
            )


        session["user_id"] = user["id"]

        session["user_name"] = user["name"]

        session["user_email"] = user["email"]

        session["nickname"] = user["nickname"]

        session["emergency_contact"] = (
            user["emergency_contact"]
        )

        session["age"] = user["age"]


        flash(
            "Login successful!",
            "success"
        )


        return redirect(
            url_for("dashboard")
        )


    return render_template(
        "login.html"
    )


# =========================================================
# DASHBOARD
# =========================================================

@app.route("/dashboard")
@login_required
def dashboard():

    return render_template(

        "dashboard.html",

        name=session.get(
            "user_name"
        ),

        email=session.get(
            "user_email"
        ),

        nickname=session.get(
            "nickname"
        ),

        emergency_contact=session.get(
            "emergency_contact"
        ),

        age=session.get(
            "age"
        )

    )


# =========================================================
# LOGOUT
# =========================================================

@app.route("/logout")
def logout():

    session.clear()

    flash(
        "You have been logged out.",
        "success"
    )

    return redirect(
        url_for("login")
    )


# =========================================================
# PROFILE
# =========================================================

@app.route("/profile")
@login_required
def profile():

    return render_template(
        "profile.html"
    )


# =========================================================
# FAKE CALL PAGE
# =========================================================

@app.route("/fake-call")
@login_required
def fake_call():

    return render_template(
        "fake_call.html",
        nickname=session.get("nickname", "Emergency Contact")
    )


# =========================================================
# RECORDING PAGE
# =========================================================

@app.route("/recording")
@login_required
def recording():

    return render_template(
        "recording.html"
    )


# =========================================================
# TEXT TO SPEECH
# =========================================================
#
# This is the new part for the fake-call voice.
#
# It uses gTTS.
#
# No Google Cloud project.
# No service account.
# No JSON credentials.
# No API key.
#
# =========================================================

@app.route(
    "/api/tts",
    methods=["POST"]
)
@login_required
def text_to_speech():

    try:

        data = request.get_json()

        if not data:

            return jsonify({
                "success": False,
                "error": "No data received."
            }), 400


        text = data.get(
            "text",
            ""
        ).strip()

        language = data.get(
            "language",
            "en-IN"
        )


        if not text:

            return jsonify({
                "success": False,
                "error": "No text provided."
            }), 400


        # -------------------------------------------------
        # ONLY ENGLISH AND HINDI
        # -------------------------------------------------

        if language == "hi-IN":

            language_code = "hi"

        else:

            language_code = "en"


        # -------------------------------------------------
        # GENERATE VOICE
        # -------------------------------------------------

        audio_buffer = io.BytesIO()


        tts = gTTS(
            text=text,
            lang=language_code,
            slow=False
        )


        tts.write_to_fp(
            audio_buffer
        )


        audio_buffer.seek(0)


        # -------------------------------------------------
        # SEND MP3 TO BROWSER
        # -------------------------------------------------

        return send_file(

            audio_buffer,

            mimetype="audio/mpeg",

            as_attachment=False,

            download_name="tutelaris_voice.mp3"

        )


    except Exception as error:

        print(
            "TTS ERROR:",
            error
        )

        return jsonify({

            "success": False,

            "error":
                str(error)

        }), 500


# =========================================================
# AUTOMATIC SAFETY RECORDING
# =========================================================

@app.route(
    "/api/recording",
    methods=["POST"]
)
@login_required
def upload_recording():

    try:

        if "audio" not in request.files:

            return jsonify({

                "success": False,

                "error":
                    "No audio file received."

            }), 400


        audio_file = request.files[
            "audio"
        ]


        if audio_file.filename == "":

            return jsonify({

                "success": False,

                "error":
                    "Empty audio file."

            }), 400


        user_id = str(
            session.get(
                "user_id",
                "unknown"
            )
        )


        user_name = session.get(
            "user_name",
            "Unknown User"
        )


        reason = request.form.get(
            "reason",
            "Possible distress"
        )


        client_timestamp = request.form.get(
            "timestamp",
            ""
        )


        server_time = datetime.now()


        timestamp = server_time.strftime(
            "%Y%m%d_%H%M%S"
        )


        unique_id = uuid.uuid4().hex[:8]


        safe_user = secure_filename(
            user_id
        )


        if not safe_user:

            safe_user = "UNKNOWN"


        audio_filename = (

            f"incident_"
            f"{timestamp}_"
            f"{safe_user}_"
            f"{unique_id}.webm"

        )


        audio_path = os.path.join(

            app.config[
                "UPLOAD_FOLDER"
            ],

            audio_filename

        )


        audio_file.save(
            audio_path
        )


        metadata = {

            "incident_id":
                unique_id,

            "user_id":
                user_id,

            "user_name":
                user_name,

            "reason":
                reason,

            "client_timestamp":
                client_timestamp,

            "server_received":
                server_time.isoformat(),

            "audio_file":
                audio_filename

        }


        metadata_filename = (

            f"incident_"
            f"{timestamp}_"
            f"{safe_user}_"
            f"{unique_id}.json"

        )


        metadata_path = os.path.join(

            app.config[
                "UPLOAD_FOLDER"
            ],

            metadata_filename

        )


        with open(

            metadata_path,

            "w",

            encoding="utf-8"

        ) as file:

            json.dump(

                metadata,

                file,

                indent=4,

                ensure_ascii=False

            )


        print()
        print("=" * 70)
        print("TUTELARIS AUTOMATIC INCIDENT")
        print("=" * 70)

        print(
            "User Name :",
            user_name
        )

        print(
            "User ID   :",
            user_id
        )

        print(
            "Reason    :",
            reason
        )

        print(
            "Timestamp :",
            client_timestamp
        )

        print(
            "Audio     :",
            audio_filename
        )

        print(
            "Metadata  :",
            metadata_filename
        )

        print(
            "Location  :",
            app.config[
                "UPLOAD_FOLDER"
            ]
        )

        print("=" * 70)
        print()


        return jsonify({

            "success": True,

            "message":
                "Evidence saved successfully.",

            "filename":
                audio_filename,

            "metadata":
                metadata_filename,

            "user_id":
                user_id,

            "user_name":
                user_name,

            "reason":
                reason

        })


    except Exception as error:

        print(
            "RECORDING UPLOAD ERROR:",
            error
        )

        return jsonify({

            "success": False,

            "error":
                str(error)

        }), 500


# =========================================================
# SAFE ROUTE
# =========================================================

@app.route("/safe-route")
@login_required
def safe_route():

    return render_template(
        "safe_route.html"
    )


# =========================================================
# NEAREST POLICE STATION
# =========================================================

@app.route(
    "/api/nearby-police",
    methods=["POST"]
)
@login_required
def nearby_police():

    try:

        data = request.get_json()

        latitude = float(
            data["latitude"]
        )

        longitude = float(
            data["longitude"]
        )

    except (
        KeyError,
        TypeError,
        ValueError
    ):

        return jsonify({

            "success": False,

            "message":
                "Invalid latitude or longitude."

        }), 400


    stations = []


    for station in POLICE_STATIONS:

        distance = calculate_distance(

            latitude,

            longitude,

            station["latitude"],

            station["longitude"]

        )


        station_copy = station.copy()


        station_copy[
            "distance_km"
        ] = round(
            distance,
            2
        )


        stations.append(
            station_copy
        )


    if not stations:

        return jsonify({

            "success": False,

            "message":
                "No police stations available."

        }), 404


    stations.sort(

        key=lambda station:
        station["distance_km"]

    )


    nearest = stations[0]


    # Google Maps navigation URL.
    # This is NOT the Google Maps API.

    route_url = (

        "https://www.google.com/maps/dir/?api=1"

        f"&origin={latitude},{longitude}"

        f"&destination="
        f"{nearest['latitude']},"
        f"{nearest['longitude']}"

        "&travelmode=driving"

    )


    return jsonify({

        "success": True,

        "user_location": {

            "latitude":
                latitude,

            "longitude":
                longitude

        },

        "nearest_station":
            nearest,

        "route_url":
            route_url,

        "all_stations":
            stations

    })


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":

    init_db()

    app.run(

        debug=True,

        host="127.0.0.1",

        port=5000

    )