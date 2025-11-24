const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();

// File paths for persistent storage
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const MUSIC_FILE = path.join(__dirname, 'data', 'music.json');
const VOTES_FILE = path.join(__dirname, 'data', 'votes.json');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Load data from files
function loadUsers() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const data = fs.readFileSync(USERS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
    return []; // Return empty array if file doesn't exist or error
}

function loadMusic() {
    try {
        if (fs.existsSync(MUSIC_FILE)) {
            const data = fs.readFileSync(MUSIC_FILE, 'utf8');
            const musicData = JSON.parse(data);
            // Convert string dates back to Date objects
            return musicData.map(item => ({
                ...item,
                createdAt: new Date(item.createdAt)
            }));
        }
    } catch (error) {
        console.error('Error loading music:', error);
    }
    // Return default music if no file exists
    return [
        {
            id: '1',
            title: 'Moonlight Sonata',
            artist: 'Ludwig van Beethoven',
            chords: ['Cm', 'G', 'Dm', 'Am'],
            notes: 'Classic piano piece with emotional depth and technical challenges',
            difficulty: 'Advanced',
            style: 'Classical',
            bpm: 60,
            createdAt: new Date('2024-01-15')
        },
        {
            id: '2',
            title: 'Sweet Child O\' Mine',
            artist: 'Guns N\' Roses',
            chords: ['D', 'C', 'G', 'D'],
            notes: 'Iconic rock ballad with memorable guitar riff',
            difficulty: 'Intermediate',
            style: 'Rock',
            bpm: 125,
            createdAt: new Date('2024-01-16')
        },
        {
            id: '3',
            title: 'Autumn Leaves',
            artist: 'Joseph Kosma',
            chords: ['Cm', 'Fm', 'Bb', 'Eb'],
            notes: 'Jazz standard perfect for improvisation practice',
            difficulty: 'Intermediate',
            style: 'Jazz',
            bpm: 120,
            createdAt: new Date('2024-01-17')
        }
    ];
}

function loadVotes() {
    try {
        if (fs.existsSync(VOTES_FILE)) {
            const data = fs.readFileSync(VOTES_FILE, 'utf8');
            const votesData = JSON.parse(data);
            // Convert string dates back to Date objects
            return votesData.map(item => ({
                ...item,
                votedAt: new Date(item.votedAt)
            }));
        }
    } catch (error) {
        console.error('Error loading votes:', error);
    }
    return [];
}

// Save data to files
function saveUsers() {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        console.log('Users saved to file');
    } catch (error) {
        console.error('Error saving users:', error);
    }
}

function saveMusic() {
    try {
        fs.writeFileSync(MUSIC_FILE, JSON.stringify(music, null, 2));
        console.log('Music saved to file');
    } catch (error) {
        console.error('Error saving music:', error);
    }
}

function saveVotes() {
    try {
        fs.writeFileSync(VOTES_FILE, JSON.stringify(votes, null, 2));
        console.log('Votes saved to file');
    } catch (error) {
        console.error('Error saving votes:', error);
    }
}

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Trust proxy for secure cookies in production
app.set('trust proxy', 1);

// Session configuration - using MemoryStore with proper settings for Render
app.use(session({
    secret: process.env.SESSION_SECRET || 'music-app-secret-key-2025-comps381f-render-fix',
    resave: true, // Changed to true to force save on every request
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// Session debugging middleware
app.use((req, res, next) => {
    console.log('=== Session Debug ===');
    console.log('Session ID:', req.sessionID);
    console.log('Session data:', JSON.stringify(req.session));
    console.log('=====================');
    next();
});

// Load data from files
let users = loadUsers();
let music = loadMusic();
let votes = loadVotes();

// Add default demo accounts if no users exist
if (users.length === 0) {
    users = [
        {
            id: '1',
            username: 'user1',
            password: 'password123', // Plain text for demo
            email: 'user1@demo.com',
            createdAt: new Date()
        },
        {
            id: '2', 
            username: 'user2',
            password: 'password123',
            email: 'user2@demo.com',
            createdAt: new Date()
        }
    ];
    saveUsers();
}

// Authentication Middleware
const requireAuth = (req, res, next) => {
    console.log('=== Auth Middleware ===');
    console.log('Session ID:', req.sessionID);
    console.log('User ID in session:', req.session.userId);
    console.log('Full session:', req.session);
    
    if (req.session.userId) {
        console.log('User authenticated, proceeding...');
        next();
    } else {
        console.log('No user ID in session, redirecting to login');
        res.redirect('/login');
    }
};

// Helper function to generate IDs
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

// Debug routes for session testing
app.get('/debug-session', (req, res) => {
    res.json({
        session: req.session,
        sessionId: req.sessionID,
        headers: req.headers
    });
});

app.get('/debug-users', (req, res) => {
    res.json({
        users: users,
        currentUser: req.session.userId ? users.find(u => u.id === req.session.userId) : null
    });
});

// Test login route for debugging
app.get('/test-login', (req, res) => {
    req.session.userId = '1';
    req.session.username = 'user1';
    req.session.save((err) => {
        if (err) {
            console.error('Test login session save error:', err);
            return res.status(500).send('Session save failed');
        }
        console.log('Test login - Session saved:', req.session);
        res.redirect('/dashboard');
    });
});

// Reset demo data
app.get('/reset-demo', (req, res) => {
    // Reset to original demo data
    music = [
        {
            id: '1',
            title: 'Moonlight Sonata',
            artist: 'Ludwig van Beethoven',
            chords: ['Cm', 'G', 'Dm', 'Am'],
            notes: 'Classic piano piece with emotional depth and technical challenges',
            difficulty: 'Advanced',
            style: 'Classical',
            bpm: 60,
            createdAt: new Date('2024-01-15')
        },
        {
            id: '2',
            title: 'Sweet Child O\' Mine',
            artist: 'Guns N\' Roses',
            chords: ['D', 'C', 'G', 'D'],
            notes: 'Iconic rock ballad with memorable guitar riff',
            difficulty: 'Intermediate',
            style: 'Rock',
            bpm: 125,
            createdAt: new Date('2024-01-16')
        },
        {
            id: '3',
            title: 'Autumn Leaves',
            artist: 'Joseph Kosma',
            chords: ['Cm', 'Fm', 'Bb', 'Eb'],
            notes: 'Jazz standard perfect for improvisation practice',
            difficulty: 'Intermediate',
            style: 'Jazz',
            bpm: 120,
            createdAt: new Date('2024-01-17')
        }
    ];
    saveMusic();
    res.redirect('/music');
});

// Backup all data
app.get('/backup-data', (req, res) => {
    res.json({
        users: users,
        music: music,
        votes: votes
    });
});

// Routes

// Root route - redirect to login or dashboard
app.get('/', (req, res) => {
    console.log('Root route - Session userId:', req.session.userId);
    if (req.session.userId) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// Login Page
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt - Body:', { username, password });
    console.log('Current session before login:', req.session);
    
    try {
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            console.log('User found:', user);
            req.session.userId = user.id;
            req.session.username = user.username;
            
            // Explicitly save the session
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error during login:', err);
                    return res.render('login', { error: 'Login failed. Please try again.' });
                }
                console.log('Login successful - Session saved:', req.session);
                console.log('Session after save:', req.session);
                res.redirect('/dashboard');
            });
        } else {
            console.log('User not found or password incorrect');
            res.render('login', { error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'Login failed. Please try again.' });
    }
});

// Register Page
app.get('/register', (req, res) => {
    res.render('register', { error: null, success: null });
});

app.post('/register', (req, res) => {
    const { username, password, email, confirmPassword } = req.body;
    console.log('Registration attempt - Body:', { username, email });
    
    try {
        // Validation checks
        if (!username || !password || !email) {
            return res.render('register', { 
                error: 'All fields are required',
                success: null 
            });
        }
        
        if (password !== confirmPassword) {
            return res.render('register', { 
                error: 'Passwords do not match',
                success: null 
            });
        }
        
        if (password.length < 6) {
            return res.render('register', { 
                error: 'Password must be at least 6 characters long',
                success: null 
            });
        }
        
        // Check if username already exists
        const existingUser = users.find(u => u.username === username);
        if (existingUser) {
            return res.render('register', { 
                error: 'Username already exists',
                success: null 
            });
        }
        
        // Check if email already exists
        const existingEmail = users.find(u => u.email === email);
        if (existingEmail) {
            return res.render('register', { 
                error: 'Email already registered',
                success: null 
            });
        }
        
        // Create new user
        const newUser = {
            id: generateId(),
            username: username.trim(),
            password: password, // In real app, you should hash this!
            email: email.trim(),
            createdAt: new Date()
        };
        
        users.push(newUser);
        saveUsers(); // Save to file
        console.log('New user registered and saved:', newUser);
        
        res.render('register', { 
            error: null,
            success: 'Registration successful! You can now login.' 
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.render('register', { 
            error: 'Registration failed. Please try again.',
            success: null 
        });
    }
});

// Logout
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/login');
    });
});

// Dashboard
app.get('/dashboard', requireAuth, (req, res) => {
    console.log('Dashboard access - Session:', req.session);
    const userVote = votes.find(v => v.userId === req.session.userId);
    res.render('dashboard', { 
        musicCount: music.length, 
        voteCount: votes.length,
        username: req.session.username,
        userVote: userVote
    });
});

// CRUD Operations - Music

// Read - List all music
app.get('/music', requireAuth, (req, res) => {
    res.render('music-list', { 
        music: music,
        username: req.session.username
    });
});

// Create - Show add form
app.get('/music/add', requireAuth, (req, res) => {
    res.render('add-music', { username: req.session.username });
});

// Create - Handle add form
app.post('/music', requireAuth, (req, res) => {
    try {
        const { title, artist, chords, notes, difficulty, style, bpm } = req.body;
        const newMusic = {
            id: generateId(),
            title: title.trim(),
            artist: artist.trim(),
            chords: chords.split(',').map(chord => chord.trim()),
            notes: notes.trim(),
            difficulty,
            style,
            bpm: parseInt(bpm),
            createdAt: new Date()
        };
        music.push(newMusic);
        saveMusic(); // Save to file
        res.redirect('/music');
    } catch (error) {
        console.error('Error creating music:', error);
        res.status(500).render('add-music', { 
            error: 'Error creating music piece',
            username: req.session.username 
        });
    }
});

// Update - Show edit form
app.get('/music/edit/:id', requireAuth, (req, res) => {
    try {
        const musicItem = music.find(m => m.id === req.params.id);
        if (!musicItem) {
            return res.status(404).render('error', { 
                message: 'Music not found',
                username: req.session.username 
            });
        }
        res.render('edit-music', { 
            music: musicItem,
            username: req.session.username 
        });
    } catch (error) {
        console.error('Error loading edit form:', error);
        res.status(500).render('error', { 
            message: 'Error loading edit form',
            username: req.session.username 
        });
    }
});

// Update - Handle edit form
app.post('/music/update/:id', requireAuth, (req, res) => {
    try {
        const { title, artist, chords, notes, difficulty, style, bpm } = req.body;
        const index = music.findIndex(m => m.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).render('error', { 
                message: 'Music not found',
                username: req.session.username 
            });
        }
        
        music[index] = {
            ...music[index],
            title: title.trim(),
            artist: artist.trim(),
            chords: chords.split(',').map(chord => chord.trim()),
            notes: notes.trim(),
            difficulty,
            style,
            bpm: parseInt(bpm)
        };
        
        saveMusic(); // Save to file
        res.redirect('/music');
    } catch (error) {
        console.error('Error updating music:', error);
        res.status(500).render('error', { 
            message: 'Error updating music',
            username: req.session.username 
        });
    }
});

// Delete
app.post('/music/delete/:id', requireAuth, (req, res) => {
    try {
        const initialLength = music.length;
        music = music.filter(m => m.id !== req.params.id);
        
        if (music.length === initialLength) {
            return res.status(404).render('error', { 
                message: 'Music not found',
                username: req.session.username 
            });
        }
        
        saveMusic(); // Save to file
        res.redirect('/music');
    } catch (error) {
        console.error('Error deleting music:', error);
        res.status(500).render('error', { 
            message: 'Error deleting music',
            username: req.session.username 
        });
    }
});

// Voting System
app.get('/vote', requireAuth, (req, res) => {
    const userVote = votes.find(v => v.userId === req.session.userId);
    res.render('vote', { 
        votes: votes,
        userVote: userVote,
        username: req.session.username 
    });
});

app.post('/vote', requireAuth, (req, res) => {
    try {
        const { favoriteInstrument, favoriteStyle, difficultyPreference } = req.body;
        
        const existingVoteIndex = votes.findIndex(v => v.userId === req.session.userId);
        
        if (existingVoteIndex !== -1) {
            // Update existing vote
            votes[existingVoteIndex] = {
                ...votes[existingVoteIndex],
                favoriteInstrument,
                favoriteStyle,
                difficultyPreference,
                username: req.session.username, // Store username
                votedAt: new Date()
            };
        } else {
            // Create new vote
            const newVote = {
                id: generateId(),
                userId: req.session.userId,
                username: req.session.username, // Store username
                favoriteInstrument,
                favoriteStyle,
                difficultyPreference,
                votedAt: new Date()
            };
            votes.push(newVote);
        }
        
        saveVotes(); // Save to file
        res.redirect('/vote');
    } catch (error) {
        console.error('Error saving vote:', error);
        res.status(500).render('vote', { 
            error: 'Error saving your vote',
            votes: votes,
            userVote: votes.find(v => v.userId === req.session.userId),
            username: req.session.username 
        });
    }
});

// RESTful APIs (No authentication required)

// Read API - GET all music
app.get('/api/music', (req, res) => {
    res.json({
        success: true,
        count: music.length,
        data: music
    });
});

// Read API - GET music by ID
app.get('/api/music/:id', (req, res) => {
    const musicItem = music.find(m => m.id === req.params.id);
    if (!musicItem) {
        return res.status(404).json({
            success: false,
            error: 'Music not found'
        });
    }
    res.json({
        success: true,
        data: musicItem
    });
});

// Create API - POST new music
app.post('/api/music', (req, res) => {
    try {
        const { title, artist, chords, notes, difficulty, style, bpm } = req.body;
        
        if (!title || !artist || !difficulty || !style) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        
        const newMusic = {
            id: generateId(),
            title: title.trim(),
            artist: artist.trim(),
            chords: Array.isArray(chords) ? chords : [chords],
            notes: notes || '',
            difficulty,
            style,
            bpm: bpm ? parseInt(bpm) : 120,
            createdAt: new Date()
        };
        
        music.push(newMusic);
        saveMusic(); // Save to file
        
        res.status(201).json({
            success: true,
            data: newMusic
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to create music'
        });
    }
});

// Update API - PUT update music
app.put('/api/music/:id', (req, res) => {
    try {
        const index = music.findIndex(m => m.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({
                success: false,
                error: 'Music not found'
            });
        }
        
        music[index] = { 
            ...music[index], 
            ...req.body,
            id: music[index].id, // Prevent ID change
            createdAt: music[index].createdAt // Prevent creation date change
        };
        
        saveMusic(); // Save to file
        
        res.json({
            success: true,
            data: music[index]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update music'
        });
    }
});

// Delete API - DELETE music
app.delete('/api/music/:id', (req, res) => {
    try {
        const initialLength = music.length;
        music = music.filter(m => m.id !== req.params.id);
        
        if (music.length === initialLength) {
            return res.status(404).json({
                success: false,
                error: 'Music not found'
            });
        }
        
        saveMusic(); // Save to file
        
        res.json({
            success: true,
            message: 'Music deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete music'
        });
    }
});

// Additional RESTful APIs for voting
app.get('/api/votes', (req, res) => {
    res.json({
        success: true,
        count: votes.length,
        data: votes
    });
});

// Health check endpoint for cloud platforms
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
        session: {
            id: req.sessionID,
            userId: req.session.userId,
            username: req.session.username
        },
        data: {
            users: users.length,
            music: music.length,
            votes: votes.length
        }
    });
});

// Check current data
app.get('/check-data', (req, res) => {
    res.json({
        users: users,
        music: music,
        votes: votes,
        session: req.session
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).render('error', { 
        message: 'Something went wrong!',
        username: req.session.username 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', { 
        message: 'Page not found',
        username: req.session.username 
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`=== Music CRUD App Server Started ===`);
    console.log(`Server running on port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Access URL: http://0.0.0.0:${PORT}`);
    console.log(`Session Config: resave=true, saveUninitialized=false`);
    console.log(`Data Storage: JSON files (${users.length} users, ${music.length} music, ${votes.length} votes)`);
    console.log(`=== Demo Accounts ===`);
    console.log(`Username: user1 | Password: password123`);
    console.log(`Username: user2 | Password: password123`);
    console.log(`=== Debug Routes ===`);
    console.log(`/health - Server health check`);
    console.log(`/check-data - Check current data`);
    console.log(`/debug-session - Check current session`);
    console.log(`/debug-users - Check users data`);
    console.log(`/test-login - Test login (auto login as user1)`);
    console.log(`/reset-demo - Reset to demo data`);
    console.log(`/backup-data - Backup all data`);
    console.log(`=================================`);
});
