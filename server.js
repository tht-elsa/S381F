const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session configuration - important for cloud deployment
app.use(session({
    secret: process.env.SESSION_SECRET || 'music-app-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// In-memory database (for demo purposes)
let users = [
    {
        id: '1',
        username: 'user1',
        password: 'password123', // Plain text for demo
        email: 'user1@demo.com'
    },
    {
        id: '2', 
        username: 'user2',
        password: 'password123',
        email: 'user2@demo.com'
    }
];

let music = [
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

let votes = [
    {
        id: '1',
        userId: '1',
        favoriteInstrument: 'Guitar',
        favoriteStyle: 'Rock',
        difficultyPreference: 'Medium',
        votedAt: new Date('2024-01-18')
    },
    {
        id: '2',
        userId: '2',
        favoriteInstrument: 'Piano',
        favoriteStyle: 'Classical',
        difficultyPreference: 'Hard',
        votedAt: new Date('2024-01-19')
    }
];

// Authentication Middleware
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Helper function to generate IDs
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

// Routes

// Root route - redirect to login or dashboard
app.get('/', (req, res) => {
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
    
    try {
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            req.session.userId = user.id;
            req.session.username = user.username;
            res.redirect('/dashboard');
        } else {
            res.render('login', { error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'Login failed. Please try again.' });
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
                votedAt: new Date()
            };
        } else {
            // Create new vote
            const newVote = {
                id: generateId(),
                userId: req.session.userId,
                favoriteInstrument,
                favoriteStyle,
                difficultyPreference,
                votedAt: new Date()
            };
            votes.push(newVote);
        }
        
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
        memory: process.memoryUsage()
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

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`🎵 Music CRUD App Server Started`);
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 Demo Accounts:`);
    console.log(`   Username: user1 | Password: password123`);
    console.log(`   Username: user2 | Password: password123`);
    console.log(`💾 Storage: In-memory (${music.length} sample music pieces loaded)`);
    console.log(`✅ Server ready for cloud deployment`);
});
