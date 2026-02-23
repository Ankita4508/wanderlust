const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        url : String,
        filename: String,
    },
    price: Number,
    location: String,
    country: String,
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review",
        },
    ],
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    geometry: {
        type: {
            type: String,
            enum: ["Point"],
            required: true
        },
        coordinates: {
            type: [Number], //[lng, lat]
            required: true
        },
    },

    category: {
        type: String,
        required:true,
        enum: [
      "trending",
      "rooms",
      "iconic-cities",
      "mountains",
      "castles",
      "amazing-pools",
      "camping",
      "farms",
      "arctic",
      "domes",
      "boats"
    ]
    }
});

listingSchema.post("findOneAndDelete", async(listing)=>{
    if(listing){
        await Review.deleteMany({id : {$in: listing.reviews}});
    }
});

const Listing = mongoose.model("Listing",listingSchema);
module.exports = Listing;