/********************************************************************************
*  WEB322 – Assignment 05
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Siddhartha Thapa Chhetri Student ID: 147913222 Date: 2024/07/31
*
********************************************************************************/

const express = require('express');
const path = require('path');
const legoData = require('./modules/legoSets');

const app = express();
const PORT = process.env.PORT || 3000;

// Set view engine to EJS and configure views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the "public" directory
app.use(express.static('public'));

// Middleware for parsing URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Initialize legoData and start the server
legoData.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is listening on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to initialize legoData:', err);
    });

// Route for home page
app.get('/', (req, res) => {
    legoData.getAllSets()  // Fetch all sets from the database
        .then((sets) => {
            // Show only 3 sets
            const limitedSets = sets.slice(0, 3);
            res.render('home', { sets: limitedSets, page: '/views/' });
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
app.get('/lego/addSet', (req, res) => {
    legoData.getAllThemes()
        .then((themes) => {
            res.render('addSet', { themes: themes, page: '/lego/addSet' });
        })
        .catch((err) => {
            res.status(500).render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
        });
});

// Route for handling form submission for adding a set
app.post('/lego/addSet', (req, res) => {
    legoData.addSet(req.body)
        .then(() => {
            res.redirect('/lego/sets');
        })
        .catch((err) => {
            res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
        });
});

// Route for rendering the editSet form
app.get('/lego/editSet/:num', (req, res) => {
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
app.post('/lego/editSet', (req, res) => {
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
app.get('/lego/deleteSet/:num', (req, res) => {
    const setNum = req.params.num;
    legoData.deleteSet(setNum)
        .then(() => {
            res.redirect('/lego/sets');
        })
        .catch((err) => {
            res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
        });
});

// Route for custom 404 page
app.use((req, res) => {
    res.status(404).render('404', { message: "I'm sorry, we're unable to find what you're looking for", page: '' });
});
