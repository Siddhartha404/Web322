/********************************************************************************
*  WEB322 – Assignment 02
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Siddhartha Thapa Chhetri Student ID: 147913222 Date: 2024/06/04
*
********************************************************************************/

const express = require('express');
const path = require('path');
const legoData = require('./modules/legoSets');

const app = express();
const PORT = process.env.PORT || 3000;

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Serve static files from the "public" directory
app.use(express.static('public'));

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
    res.render('home', { page: '/' });
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

// Route for custom 404 page
app.use((req, res) => {
    res.status(404).render('404', { message: "I'm sorry, we're unable to find what you're looking for", page: '' });
});
