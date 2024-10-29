// Archivo principal de configuración para la aplicación Express
const express = require('express');
const { create } = require('express-handlebars');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const User = require('./Models/User');
const cors = require('cors');
const mongosanitize = require('express-mongo-sanitize');
const mongoStore = require('connect-mongo');
const { connectMongoDB } = require('./db/sqlMongoose');
const Handlebars = require('handlebars');

require('dotenv').config();
require('./db/sqlMongoose');

const app = express();

// CORS configuration
app.use(cors({
    credentials: true,
    origin: process.env.PATHRENDER || '*',
    methods: ['GET', 'POST']
}));

// Session configuration
app.use(session({
    secret: '52D5FA11-9E49-49D4-A0FD-394E0D0FE98E',
    resave: false,
    saveUninitialized: false,
    name: "secret-name-yolo",
    store: mongoStore.create({
        clientPromise: connectMongoDB,
        dbName: process.env.BD_NAME
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000
    }
}));

// Flash messages
app.use(flash());

// Handlebars helper for date formatting
Handlebars.registerHelper('formatDate', function(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 10); // Returns "YYYY-MM-DD"
});

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, { id: user._id, userName: user.userName }));
passport.deserializeUser(async (user, done) => {
    try {
        const userdb = await User.findById(user.id);
        if (!userdb) return done(new Error('User not found'));
        return done(null, { id: userdb._id, username: userdb.userName });
    } catch (error) {
        return done(error);
    }
});

// Handlebars configuration
const hbs = create({
    extname: 'hbs',
    layoutsDir: 'views/Layouts',
    partialsDir: 'views/Components',
    defaultLayout: 'main'
});
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', './views');

// Middleware for form data and JSON
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Routes configuration
app.use('/auth', require('./Routes/authRoutes'));
app.use('/', require('./Routes/homeRoutes'));

// Static files
app.use(express.static(__dirname + '/public'));

// Server listening
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
