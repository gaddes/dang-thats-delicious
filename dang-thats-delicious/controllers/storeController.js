const mongoose = require('mongoose');
const Store = mongoose.model('Store'); // See Store.js where this is exported!

exports.homePage = (req, res) => {
    res.render('index');
};

exports.addStore = (req, res) => {
    res.render('editStore', { title: 'Add Store' });
};

exports.createStore = async (req, res) => {
    const store = await (new Store(req.body)).save();
    req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`)
    res.redirect(`/store/${store.slug}`);
    // Note: errors are handled within the exports.catchErrors() function in errorHandlers.js - see video 11 @ 12mins for explanation
};