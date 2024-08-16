const express = require('express');
const path = require('path');
const legoData = require('./modules/legoSets');
const authData = require('./modules/auth-service');
const clientSessions = require('client-sessions');

const app = express();
const HTTP_PORT = process.env.PORT || 3000;

// Configure client-sessions middleware
app.use(clientSessions({
    cookieName: 'session',
    secret: 'your-secret-key', // Replace with a strong secret
    duration: 24 * 60 * 60 * 1000, // 24 hours
    activeDuration: 30 * 60 * 1000 // 30 minutes
}));

// Custom middleware to expose session object to templates
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// Ensure user is logged in middleware
function ensureLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
}

// Initialize legoData and authData, then start the server
legoData.initialize()
    .then(authData.initialize)
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log(`App listening on port ${HTTP_PORT}`);
        });
    })
    .catch((err) => {
        console.log(`Unable to start server: ${err}`);
    });

// Set view engine to EJS and configure views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the "public" directory
app.use(express.static('public'));

// Middleware for parsing URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Route for home page
app.get('/', (req, res) => {
    legoData.getAllSets()
        .then((sets) => {
            const limitedSets = sets.slice(0, 3);
            res.render('home', { sets: limitedSets, page: '/' });
        })
        .catch((err) => {
            res.status(500).render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
        });
});

// Route for about page
app.get('/about', (req, res) => {
    res.render('about', { page: '/about' });
});

// Route for Lego sets with optional theme query parameter
app.get('/lego/sets', (req, res) => {
    const theme = req.query.theme;
    if (theme) {
        legoData.getSetsByTheme(theme)
            .then((sets) => {
                res.render('sets', { sets: sets, page: '/lego/sets' });
            })
            .catch((err) => {
                res.status(404).render('404', { message: err.message, page: '/lego/sets' });
            });
    } else {
        legoData.getAllSets()
            .then((sets) => {
                res.render('sets', { sets: sets, page: '/lego/sets' });
            })
            .catch((err) => {
                res.status(404).render('404', { message: err.message, page: '/lego/sets' });
            });
    }
});

// Route for individual Lego set by set number
app.get('/lego/sets/:set_num', (req, res) => {
    const setNum = req.params.set_num;
    legoData.getSetByNum(setNum)
        .then((set) => {
            res.render('set', { set: set });
        })
        .catch((err) => {
            res.status(404).render('404', { message: err.message, page: '/lego/sets' });
        });
});

// Route for rendering the addSet form
app.get('/lego/addSet', ensureLogin, (req, res) => {
    legoData.getAllThemes()
        .then((themes) => {
            res.render('addSet', { themes: themes, page: '/lego/addSet' });
        })
        .catch((err) => {
            res.status(500).render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
        });
});

// Route for handling form submission for adding a set
app.post('/lego/addSet', ensureLogin, (req, res) => {
    legoData.addSet(req.body)
        .then(() => {
            res.redirect('/lego/sets');
        })
        .catch((err) => {
            res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
        });
});

// Route for rendering the editSet form
app.get('/lego/editSet/:num', ensureLogin, (req, res) => {
    const setNum = req.params.num;
    Promise.all([legoData.getSetByNum(setNum), legoData.getAllThemes()])
        .then(([set, themes]) => {
            res.render('editSet', { set: set, themes: themes, page: '' });
        })
        .catch((err) => {
            res.status(404).render('404', { message: `Error retrieving set or themes: ${err}` });
        });
});

// Route for handling form submission for editing a set
app.post('/lego/editSet', ensureLogin, (req, res) => {
    const setNum = req.body.set_num;
    const setData = {
        name: req.body.name,
        year: req.body.year,
        num_parts: req.body.num_parts,
        img_url: req.body.img_url,
        theme_id: req.body.theme_id
    };

    legoData.editSet(setNum, setData)
        .then(() => {
            res.redirect('/lego/sets');
        })
        .catch((err) => {
            res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
        });
});

// Route for deleting a set
app.get('/lego/deleteSet/:num', ensureLogin, (req, res) => {
    const setNum = req.params.num;
    legoData.deleteSet(setNum)
        .then(() => {
            res.redirect('/lego/sets');
        })
        .catch((err) => {
            res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
        });
});

// Route for user registration
app.get('/register', (req, res) => {
    const { errorMessage, successMessage, userName } = req.query;
    res.render('register', {
        errorMessage: errorMessage || null,
        successMessage: successMessage || null,
        userName: userName || ''
    });
});


app.post('/register', (req, res) => {
    authData.registerUser(req.body)
        .then(() => {
            res.redirect('/register?successMessage=User created');
        })
        .catch((err) => {
            res.redirect(`/register?errorMessage=${encodeURIComponent(err.message)}&userName=${encodeURIComponent(req.body.userName)}`);
        });
});


// Route for user login
app.get('/login', (req, res) => {
    res.render('login', { errorMessage: req.query.errorMessage });
});

app.post('/login', (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    authData.checkUser(req.body)
        .then((user) => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            };
            res.redirect('/lego/sets');
        })
        .catch((err) => {
            res.redirect(`/login?errorMessage=${err}&userName=${req.body.userName}`);
        });
});

// Route for user logout
app.get('/logout', (req, res) => {
    req.session.reset();
    res.redirect('/');
});

// Route for user history
app.get('/userHistory', ensureLogin, (req, res) => {
    res.render('userHistory', { loginHistory: req.session.user.loginHistory });
});

// Custom 404 page
app.use((req, res) => {
    res.status(404).render('404', { message: "I'm sorry, we're unable to find what you're looking for", page: '' });
});
