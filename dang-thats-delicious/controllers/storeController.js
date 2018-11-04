const mongoose = require('mongoose');
const Store = mongoose.model('Store'); // See Store.js where this is exported!
const multer = require('multer'); // This package allows us to UPLOAD our photos
const jimp = require('jimp'); // This package allows us to RESIZE our photos
const uuid = require('uuid'); // This package gives us unique identifiers (i.e. filenames) for each image upload

const multerOptions = {
    storage: multer.memoryStorage(), // This tells multer to store image in RAM (not to file, because we still need to resize it and do some other work)
    fileFilter(req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/'); // Tell multer to only accept image files
        if(isPhoto) {
            next(null, true);
        } else {
            next({ message: 'That filetype isn\'t allowed!' }, false);
        }
    }
};

exports.homePage = (req, res) => {
    res.render('index');
};

exports.addStore = (req, res) => {
    res.render('editStore', { title: 'Add Store' });
};

exports.upload = multer(multerOptions).single('photo'); // This doesn't save the file to disk, it just stores it in the memory of the server (i.e. temporary)

exports.resize = async (req, res, next) => {
    // Check if there is no new file to resize
    if (!req.file) {
        next(); // Skip to the next middleware
        return;
    }
    const extension = req.file.mimetype.split('/')[1]; // Grab file extension from mimetype
    req.body.photo = `${uuid.v4()}.${extension}`; // Generate unique filename with correct extension
    // Now we resize
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    // Once we have written the photo to our filesystem, keep going!
    next();
};

exports.createStore = async (req, res) => {
    const store = await (new Store(req.body)).save();
    req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`)
    res.redirect(`/store/${store.slug}`);
    // Note: errors are handled within the exports.catchErrors() function in errorHandlers.js - see video 11 @ 12mins for explanation
};

exports.getStores = async (req, res) => {
    // Query the database for a list of all stores
    const stores = await Store.find();
    res.render('stores', { title: 'Stores', stores: stores });
};

exports.editStore = async (req, res) => {
    // Find the store given the ID
    const store = await Store.findOne({ _id: req.params.id });
    // Confirm they are the owner of the store
    // TODO:
    // Render out the edit form so the user can update their store
    res.render('editStore', { title: `Edit ${store.name}`, store: store });
};

exports.updateStore = async (req, res) => {
    // Set the location data to be a point
    req.body.location.type = 'Point';
    // Find and update the store
    const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true, // return the new store instead of the old one
        runValidators: true
    }).exec();
    req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store</a>`);
    // Redirect them to the store and tell them it worked
    res.redirect(`/stores/${store._id}/edit`);
};