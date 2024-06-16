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
  res.sendFile(path.join(__dirname, 'views/home.html'));
});

// Route for about page
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/about.html'));
});

// Route for Lego sets with optional theme query parameter
app.get('/lego/sets', (req, res) => {
  const theme = req.query.theme;
  if (theme) {
    legoData.getSetsByTheme(theme)
      .then((sets) => {
        res.json(sets);
      })
      .catch((err) => {
        res.status(404).json({ error: err.message });
      });
  } else {
    legoData.getAllSets()
      .then((sets) => {
        res.json(sets);
      })
      .catch((err) => {
        res.status(404).json({ error: err.message });
      });
  }
});

// Route for individual Lego set by set number
app.get('/lego/sets/:set_num', (req, res) => {
  const setNum = req.params.set_num;
  legoData.getSetByNum(setNum)
    .then((set) => {
      res.json(set);
    })
    .catch((err) => {
      res.status(404).json({ error: err.message });
    });
});

// Route for custom 404 page
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views/404.html'));
});
