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
const legoData = require("./modules/legoSets");
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

legoData.initialize().then(() => {
    // Start the server
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Error initializing Lego data:', err);
});

// Route: GET "/"
app.get('/', (req, res) => {
    res.send(`Assignment 2: Siddhartha Thapa Chhetri - 147913222`);
});

// Route: GET "/lego/sets"
app.get('/lego/sets', (req, res) => {
    legoData.getAllSets()
        .then(allSets => {
            res.json(allSets);
        })
        .catch(err => {
            res.status(500).send('Error: ' + err);
        });
});

// Route: GET "/lego/sets/num-demo"
app.get('/lego/sets/num-demo', (req, res) => {
    const setNum = '001-1'; 
    legoData.getSetByNum(setNum)
        .then(set => {
            if (set) {
                res.json(set);
            } else {
                res.status(404).send('Set not found');
            }
        })
        .catch(err => {
            res.status(500).send('Error: ' + err);
        });
});

// Route: GET "/lego/sets/theme-demo"
app.get('/lego/sets/theme-demo', (req, res) => {
    const theme = 'technic'; 
    legoData.getSetsByTheme(theme)
        .then(sets => {
            res.json(sets);
        })
        .catch(err => {
            res.status(500).send('Error: ' + err);
        });
});
