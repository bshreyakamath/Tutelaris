# Tutelaris

Tutelaris is a web-based personal safety prototype designed to provide discreet assistance, evidence collection, and safer navigation for individuals travelling alone.

## Features

### 1. AI Fake Call Assistant
Provides a simulated phone-call experience designed to help a user discreetly signal that someone is aware of their journey.

- User selects the preferred language.
- User provides journey/vehicle details.
- The system generates a contextual conversation.
- Text-to-speech converts the conversation into audio.
- Supports English and Hindi voice output using gTTS.

### 2. Safety Recording
Allows users to record potential safety incidents.

- Uses the browser's recording capabilities.
- Audio evidence is uploaded to the local Flask server.
- Incident metadata is stored along with the recording.
- Each incident receives a unique identifier and timestamp.

### 3. Safe Route Assistant
Helps users identify a nearby police station based on their current location.

- Uses browser geolocation.
- Calculates the distance between the user's location and predefined police stations.
- Identifies the nearest station.
- Generates a Google Maps navigation link.

### 4. User Authentication
The application provides a basic account system.

- User registration and login.
- Passwords are securely hashed using Werkzeug.
- Flask sessions are used for authentication.
- Protected pages require the user to be logged in.

---

## Technology Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Python
- Flask
- SQLite

### APIs / Services
- Browser Geolocation API
- Google Maps navigation links
- gTTS (Google Text-to-Speech)
