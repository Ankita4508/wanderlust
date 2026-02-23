const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../model/listing.js");
require("dotenv").config();
const axios = require("axios");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("connected to db");
    initDB();
  })
  .catch((err) => {
    console.log(err);
  });
async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});

  const categories = [
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
  ];

  const updatedData = initData.data.map((obj, index) => ({
    ...obj,

    owner: "698829cfa0eeadbd88848a94",

    category: categories[index % categories.length],   // ⭐ ADD THIS LINE

    geometry: {
      type: "Point",
      coordinates: [77.2090, 28.6139],
    },
  }));

  await Listing.insertMany(updatedData);

  console.log("data was initialized");
};

const addCoordinatesToOldListings = async () => {
  const allListings = await Listing.find({});

  for (let listing of allListings) {

    if (listing.geometry && listing.geometry.coordinates.length > 0) {
      continue;
    }

    try {
      const location = encodeURIComponent(listing.location);

      const response = await axios.get(
        `https://api.geoapify.com/v1/geocode/search?text=${location}&apiKey=${process.env.GEOAPIFY_KEY}`
      );

      const coordinates = response.data.features[0].geometry.coordinates;

      listing.geometry = {
        type: "Point",
        coordinates: coordinates,
      };

      await listing.save();

      console.log("updated:", listing.title);

    } catch (err) {
      console.log("failed:", listing.title);
    }
  }

  mongoose.connection.close();
};

// addCoordinatesToOldListings();


