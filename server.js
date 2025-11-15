const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'music-app-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// In-memory data storage (for demo purposes)
let users = [
    { id: 1, username: 'user1', password: 'password123' },
    { id: 2, username: 'user2', password: 'password123' }
];

let music = [
    { id: 1, title: 'Sample Song 1', artist: 'Artist A', votes: 5 },
    { id: 2, title: 'Sample Song 2', artist: 'Artist B', votes: 3 },
    { id: 3, title: 'Sample Song 3', artist: 'Artist C', votes: 7 }
];

// Routes

// Home route
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Login page
app.get('/login', (req, res) => {
    const error = req.query.error || null;
    res.render('login', { error: error });
});

// Login handler - ENHANCED WITH DEBUGGING
app.post('/login', (req, res) => {
    console.log('Login attempt - Body:', req.body);
    
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            console.log('Missing username or password');
            return res.redirect('/login?error=Username and password are required');
        }
        
        // Find user in memory
        const user = users.find(u => u.username === username);
        console.log('User found:', user);
        
        if (!user) {
            console.log('User not found:', username);
            return res.redirect('/login?error=User not found');
        }
        
        // Simple password check
        if (user.password !== password) {
            console.log('Invalid password for user:', username);
            return res.redirect('/login?error=Invalid password');
        }
        
        // Set session
        req.session.userId = user.id;
        req.session.username = user.username;
        
        console.log('Login successful - Session set:', req.session);
        
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        res.redirect('/login?error=Server error during login');
    }
});

// Dashboard - ENHANCED WITH DEBUGGING
app.get('/dashboard', (req, res) => {
    console.log('Dashboard access attempt - Session:', req.session);
    
    if (!req.session.userId) {
        console.log('No user ID in session, redirecting to login');
        return res.redirect('/login');
    }
    
    try {
        // Sort music by votes (descending)
        const sortedMusic = [...music].sort((a, b) => b.votes - a.votes);
        
        console.log('Rendering dashboard for user:', req.session.username);
        
        res.render('dashboard', { 
            username: req.session.username,
            music: sortedMusic
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.redirect('/login');
    }
});

// Add music page
app.get('/add-music', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.render('add-music');
});

// Add music handler
app.post('/add-music', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    
    try {
        const { title, artist } = req.body;
        const newMusic = {
            id: music.length + 1,
            title,
            artist,
            votes: 0
        };
        music.push(newMusic);
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Add music error:', error);
        res.redirect('/dashboard');
    }
});

// Vote for music
app.post('/vote/:id', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    
    try {
        const musicId = parseInt(req.params.id);
        const musicItem = music.find(m => m.id === musicId);
        
        if (musicItem) {
            musicItem.votes += 1;
        }
        
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Vote error:', error);
        res.redirect('/dashboard');
    }
});

// Edit music page
app.get('/edit-music/:id', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    
    try {
        const musicId = parseInt(req.params.id);
        const musicItem = music.find(m => m.id === musicId);
        
        if (!musicItem) {
            return res.redirect('/dashboard');
        }
        
        res.render('edit-music', { music: musicItem });
    } catch (error) {
        console.error('Edit music error:', error);
        res.redirect('/dashboard');
    }
});

// Update music handler
app.post('/edit-music/:id', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    
    try {
        const musicId = parseInt(req.params.id);
        const musicItem = music.find(m => m.id === musicId);
        
        if (musicItem) {
            musicItem.title = req.body.title;
            musicItem.artist = req.body.artist;
        }
        
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Update music error:', error);
        res.redirect('/dashboard');
    }
});

// Delete music
app.post('/delete-music/:id', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    
    try {
        const musicId = parseInt(req.params.id);
        const index = music.findIndex(m => m.id === musicId);
        
        if (index !== -1) {
            music.splice(index, 1);
        }
        
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Delete music error:', error);
        res.redirect('/dashboard');
    }
});

// Music list page
app.get('/music-list', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    
    try {
        const sortedMusic = [...music].sort((a, b) => b.votes - a.votes);
        res.render('music-list', { music: sortedMusic });
    } catch (error) {
        console.error('Music list error:', error);
        res.redirect('/dashboard');
    }
});

// Vote page
app.get('/vote', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    
    try {
        res.render('vote', { music: music });
    } catch (error) {
        console.error('Vote page error:', error);
        res.redirect('/dashboard');
    }
});

// Debug routes for Render

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        memoryUsage: process.memoryUsage()
    });
});

// Check data status
app.get('/check-data', (req, res) => {
    res.json({ 
        users: users.length,
        music: music.length,
        currentUsers: users.map(u => u.username)
    });
});

// Debug: Check current session
app.get('/debug-session', (req, res) => {
    res.json({
        session: req.session,
        userId: req.session.userId,
        username: req.session.username
    });
});

// Debug: Check if users exist
app.get('/debug-users', (req, res) => {
    res.json({
        users: users,
        userCount: users.length
    });
});

// Debug login test route
app.get('/test-login', (req, res) => {
    // Simulate a successful login
    req.session.userId = 1;
    req.session.username = 'user1';
    res.redirect('/dashboard');
});

// Reset demo data
app.get('/reset-demo', (req, res) => {
    // Reset to original demo data
    users = [
        { id: 1, username: 'user1', password: 'password123' },
        { id: 2, username: 'user2', password: 'password123' }
    ];
    
    music = [
        { id: 1, title: 'Sample Song 1', artist: 'Artist A', votes: 5 },
        { id: 2, title: 'Sample Song 2', artist: 'Artist B', votes: 3 },
        { id: 3, title: 'Sample Song 3', artist: 'Artist C', votes: 7 }
    ];
    
    res.json({ 
        message: 'Demo data reset successfully',
        users: users.length,
        music: music.length
    });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send(`
        <div style="text-align: center; padding: 50px; font-family: Arial;">
            <h1>500 - Server Error</h1>
            <p>Something went wrong on our end.</p>
            <p><a href="/">Go back to Home</a></p>
        </div>
    `);
});

// 404 handler
app.use((req, res) => {
    res.status(404).send(`
        <div style="text-align: center; padding: 50px; font-family: Arial;">
            <h1>404 - Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
            <p><a href="/">Go back to Home</a></p>
        </div>
    `);
});

// Start server - CRITICAL FOR RENDER
const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`=== Music CRUD App Server Started ===`);
    console.log(`Server running on port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Access URL: http://${HOST}:${PORT}`);
    console.log(`=== Demo Accounts ===`);
    console.log('Username: user1 | Password: password123');
    console.log('Username: user2 | Password: password123');
    console.log(`=== Debug Routes ===`);
    console.log('/health - Server health check');
    console.log('/check-data - Check current data');
    console.log('/debug-session - Check current session');
    console.log('/debug-users - Check users data');
    console.log('/test-login - Test login (auto login as user1)');
    console.log('/reset-demo - Reset to demo data');
    console.log(`=================================`);
});

module.exports = app;
