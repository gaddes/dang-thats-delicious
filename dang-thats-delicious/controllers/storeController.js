const mongoose = require('mongoose');
const Store = mongoose.model('Store'); // See Store.js where this is exported!

exports.homePage = (req, res) => {
    res.render('index');
};

exports.addStore = (req, res) => {
    res.render('editStore', { title: 'Add Store' });
};

exports.createStore = async (req, res) => {
    const store = new Store(req.body);
    await store.save();
    console.log('It worked!');
    // Note: errors are handled within the exports.catchErrors() function in errorHandlers.js - see video 11 @ 12mins for explanation
};