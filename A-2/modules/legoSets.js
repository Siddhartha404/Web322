// modules/legoSets.js

const setData = require("../data/setData.json");
const themeData = require("../data/themeData.json");

let sets = [];

function initialize() {
    return new Promise((resolve, reject) => {
        try {
            sets = setData.map(set => {
                const theme = themeData.find(theme => theme.id === set.theme_id);
                return {
                    ...set,
                    theme: theme ? theme.name : "Unknown"
                };
            });
            resolve();
        } catch (error) {
            reject("Error initializing sets");
        }
    });
}

function getAllSets() {
    return new Promise((resolve, reject) => {
        if (sets.length > 0) {
            resolve(sets);
        } else {
            reject("No sets available");
        }
    });
}

function getSetByNum(setNum) {
    return new Promise((resolve, reject) => {
        const foundSet = sets.find(set => set.set_num === setNum);
        if (foundSet) {
            resolve(foundSet);
        } else {
            reject("Set not found");
        }
    });
}

function getSetsByTheme(theme) {
    return new Promise((resolve, reject) => {
        const filteredSets = sets.filter(set =>
            set.theme.toLowerCase().includes(theme.toLowerCase())
        );
        if (filteredSets.length > 0) {
            resolve(filteredSets);
        } else {
            reject("Sets not found for this theme");
        }
    });
}

module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme };
