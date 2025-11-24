# Music CRUD Application

## 1. Project Info
**Project Name:** Music CRUD & Voting System  
**Course:** COMP S381F/3810SEF Autumn 2025  
**Group:** Group X  
**Students:** 
- Student 1 (SID: 12345678)
- Student 2 (SID: 23456789)
- Student 3 (SID: 34567890)

## 2. Project File Introduction

### server.js
Main server file providing:
- User authentication (login/logout with session management)
- Complete CRUD operations for music data
- Voting system for music preferences
- RESTful APIs for all operations
- Ready for cloud deployment

### package.json
Lists dependencies:
- express: Web framework
- ejs: Template engine
- express-session: Session management
- body-parser: Request parsing

### views/
EJS templates for all UI pages:
- login.ejs: User authentication interface
- dashboard.ejs: Main dashboard with statistics
- music-list.ejs: Display and manage music collection
- add-music.ejs: Form to add new music pieces
- edit-music.ejs: Form to edit existing music
- vote.ejs: Voting interface and results

### public/
Static resources:
- css/style.css: Complete styling with modern design
- js/script.js: Client-side functionality

## 3. Cloud-based Server URL
**Live Application:** https://music-crud-app.onrender.com  
**Note:** Replace with your actual deployed URL

## 4. Operation Guides

### Login/Logout System
**Demo Accounts:**
- Username: `user1` | Password: `password123`
- Username: `user2` | Password: `password123`

**Authentication Flow:**
1. Navigate to the application URL
2. Enter username and password
3. Click "Login" to access the dashboard
4. Use "Logout" button in any page to sign out

### CRUD Web Pages Usage

**Create Music:**
1. Go to "Manage Music" from dashboard
2. Click "Add New Music" button
3. Fill in the form:
   - Title and Artist (required)
   - Chords (comma-separated)
   - Music notes/description
   - Difficulty level and style
   - BPM (beats per minute)
4. Click "Add Music" to save

**Read/View Music:**
- All music pieces displayed in table format
- View details: title, artist, style, difficulty, BPM
- Automatic sorting by creation date

**Update Music:**
1. Click "Edit" button next to any music item
2. Modify any field in the form
3. Click "Update Music" to save changes

**Delete Music:**
1. Click "Delete" button next to any music item
2. Item is immediately removed from collection

**Voting System:**
1. Go to "Voting System" from dashboard
2. Select your preferences:
   - Favorite instrument
   - Favorite music style
   - Preferred difficulty level
3. Click "Submit Vote"
4. View community voting results

### RESTful CRUD Services

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/music` | Get all music pieces |
| GET | `/api/music/:id` | Get specific music by ID |
| POST | `/api/music` | Create new music piece |
| PUT | `/api/music/:id` | Update existing music |
| DELETE | `/api/music/:id` | Delete music piece |
| GET | `/api/votes` | Get all votes |

**CURL Testing Commands:**

```bash
# Get all music
curl -X GET https://s381f-1.onrender.com/api/music

# Get specific music
curl -X GET https://s381f-1.onrender.com/api/music/1

# Create new music
curl -X POST https://s381f-1.onrender.com/api/music \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Song CRUD",
    "artist": "Test Artist",
    "chords": ["C", "G", "Am", "F"],
    "notes": "This is a test song for CRUD operations",
    "difficulty": "Intermediate",
    "style": "Pop",
    "bpm": 120
  }'

# Update music
curl -X PUT https://s381f-1.onrender.com/api/music/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Test Song",
    "artist": "Updated Artist",
    "chords": ["D", "A", "Bm", "G"],
    "notes": "This song has been updated via CRUD",
    "difficulty": "Advanced",
    "style": "Rock",
    "bpm": 140
  }'

# Delete music
curl -X DELETE https://s381f-1.onrender.com/api/music/1

