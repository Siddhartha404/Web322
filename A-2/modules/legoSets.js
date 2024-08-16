// modules/legoSets.js

require('dotenv').config();
const Sequelize = require('sequelize');
const pg = require('pg');

// Initialize Sequelize instance
const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    dialectModule: pg,
    logging: console.log,
    dialectOptions: {
        ssl: {
            require: true, // This ensures SSL is used
            rejectUnauthorized: false
        }
    }
});

const Theme = sequelize.define('Theme', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: Sequelize.STRING,
    }
}, {
    timestamps: false, // Disable createdAt and updatedAt fields
});

// Define Set model
const Set = sequelize.define('Set', {
    set_num: {
        type: Sequelize.STRING,
        primaryKey: true,
    },
    name: {
        type: Sequelize.STRING,
    },
    year: {
        type: Sequelize.INTEGER,
    },
    num_parts: {
        type: Sequelize.INTEGER,
    },
    theme_id: {
        type: Sequelize.INTEGER,
    },
    img_url: {
        type: Sequelize.STRING,
    }
}, {
    timestamps: false, // Disable createdAt and updatedAt fields
});

// Define associations
Set.belongsTo(Theme, { foreignKey: 'theme_id' });

// Initialize database
function initialize() {
    return sequelize.sync()
        .then(() => {
            return Promise.resolve();
        })
        .catch(error => {
            return Promise.reject("Error initializing the database: " + error);
        });
}

// Retrieve all sets
function getAllSets() {
    return Set.findAll({ include: [Theme] })
        .then(sets => {
            return Promise.resolve(sets);
        })
        .catch(error => {
            return Promise.reject("Error retrieving sets: " + error);
        });
}

// Retrieve a set by its number
function getSetByNum(setNum) {
    return Set.findAll({
        include: [Theme],
        where: { set_num: setNum }
    })
    .then(sets => {
        if (sets.length > 0) {
            return Promise.resolve(sets[0]);
        } else {
            return Promise.reject("Unable to find requested set");
        }
    })
    .catch(error => {
        return Promise.reject("Error retrieving set: " + error);
    });
}

// Retrieve sets by theme
function getSetsByTheme(theme) {
    return Set.findAll({
        include: [Theme],
        where: {
            '$Theme.name$': {
                [Sequelize.Op.iLike]: `%${theme}%`
            }
        }
    })
    .then(sets => {
        if (sets.length > 0) {
            return Promise.resolve(sets);
        } else {
            return Promise.reject("Unable to find requested sets");
        }
    })
    .catch(error => {
        return Promise.reject("Error retrieving sets by theme: " + error);
    });
}

// Add a new set
function addSet(setData) {
    return Set.create(setData)
        .then(() => {
            return Promise.resolve();
        })
        .catch(error => {
            return Promise.reject("Error adding set: " + error.errors[0].message);
        });
}

// Retrieve all themes
function getAllThemes() {
    return Theme.findAll()
        .then(themes => {
            return Promise.resolve(themes);
        })
        .catch(error => {
            return Promise.reject("Error retrieving themes: " + error);
        });
}

function editSet(set_num, setData) {
    return Set.update(setData, {
        where: { set_num: set_num }
    })
    .then(() => {
        return Promise.resolve();
    })
    .catch(error => {
        return Promise.reject("Error updating set: " + error.errors[0].message);
    });
}
// Delete a set by its number
function deleteSet(setNum) {
    return Set.destroy({
        where: { set_num: setNum }
    })
    .then(deletedRows => {
        if (deletedRows > 0) {
            return Promise.resolve();
        } else {
            return Promise.reject("No set found with the provided number");
        }
    })
    .catch(error => {
        return Promise.reject("Error deleting set: " + error);
    });
}

// Export functions
module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme, addSet, getAllThemes, editSet };