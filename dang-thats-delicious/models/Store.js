const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true, // Remove whitespace
        required: 'Please enter a store name!'
    },
    slug: String,
    description: {
        type: String,
        trim: true
    },
    tags: [String],
    created: {
        type: Date,
        default: Date.now
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [{
            type: Number,
            required: 'You must supply coordinates!'
        }],
        address: {
            type: String,
            required: 'You must supply an address!'
        }
    },
    photo: String,
    // This (author) is going to be the relationship between the Store and the actual User
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an author'
    }
}, {
    // Make sure virtuals are visible when we take a pre= h.dump (by default they are not!)
    // Note we can still use the virtual fields without this step, but it's nice to see them for debugging (and dumping!)
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Define our indexes
storeSchema.index({
    name: 'text',
    description: 'text'
});

storeSchema.index({ location: '2dsphere' });

storeSchema.pre('save', async function(next) {
    if (!this.isModified('name')) {
        next(); // Skip it
        return; // Stop this function from running
    }
    this.slug = slug(this.name);
    // Find other stores that have a slug of wes, wes-1, wes-2, etc.
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
    const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
    if(storesWithSlug.length) {
        this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
    }
    next();
});

storeSchema.statics.getTagsList = function() {
    return this.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
};

storeSchema.statics.getTopStores = function() {
    return this.aggregate([
        // NOTE: 'aggregate' is a lower-level MongoDB function. It does not know about Mongoose, therefore we can't use Mongoose functions.

        // Lookup stores and populate their reviews
        { $lookup: { from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews' } },
        // Filter for only items that have 2 or more reviews
        { $match: { 'reviews.1': { $exists: true } } },
        // Add the average reviews field
        { $project: {
            photo: '$$ROOT.photo',
            name: '$$ROOT.name',
            reviews: '$$ROOT.reviews',
            slug: '$$ROOT.slug',
            averageRating: { $avg: '$reviews.rating' }
        } },
        // Sort it by our new field, highest reviews first
        { $sort: { averageRating: -1 } },
        // Limit to at most 10
        { $limit: 10 }
    ]);
}

// Find reviews where the stores _id property === reviews store property
storeSchema.virtual('reviews', {
    ref: 'Review', // What model to link? (this matches the name of the export at the bottom of Review.js)
    localField: '_id', // Which field on the store?
    foreignField: 'store' // Which field on the review?
});

// When we query a store, autopopulate all the reviews for that store
function autopopulate(next) {
    this.populate('reviews');
    next();
};

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);