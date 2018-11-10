const passport = require('passport');

exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Failed Login!',
    successRedirect: '/',
    successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'You are now logged out!');
    res.redirect('/');
};

// This is a new piece of middleware that's called in index.js - router.get('/add', authController.isLoggedIn, storeController.addStore);
// It checks whether the user is already logged in before allowing the user to add a store.
exports.isLoggedIn = (req, res, next) => {
    // First check if the user is authenticated
    if (req.isAuthenticated()) {
        next(); // Carrt on! They are logged in!
        return;
    }
    req.flash('error', 'Oops you must be logged in to do that!');
    res.redirect('/login');
};