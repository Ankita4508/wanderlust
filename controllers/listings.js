const Listing = require("../model/listing");
const axios = require("axios");

module.exports.index = async (req, res) => {
  let { category, search } = req.query;

  console.log("CATEGORY:", category);
  console.log("SEARCH:", search);

  // base query object
  let query = {};

  // 📌 Category filter
  if (category) {
    query.category = category;
  }

  // 📌 Search filter (location OR country)
  if (search) {
    const regex = new RegExp(search, "i");

    query.$or = [
      { location: regex },
      { country: regex }
    ];
  }

  const allListings = await Listing.find(query);

  console.log("TOTAL LISTINGS:", allListings.length);

  res.render("listings/index.ejs", {
    allListings,
    category,
    search,
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
      .populate({ path: "reviews", populate: { path: "author" } })
      .populate("owner");
    if (!listing) {
      req.flash("error", "Listing you requested for does not exist!");
      return res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs", { 
      listing ,
      GEOAPIFY_KEY: process.env.GEOAPIFY_KEY
    });
  };

module.exports.createListing = async (req, res, next) => {
  try {
    let url = req.file.path;
    let filename = req.file.filename;

    const GEOAPIFY_KEY = process.env.GEOAPIFY_KEY;

    //  convert location → coordinates
    const location = encodeURIComponent(req.body.listing.location);
    console.log("location: ",req.body.listing.location);
    console.log("before geofify");

    const geoResponse = await axios.get(
      `https://api.geoapify.com/v1/geocode/search?text=${location}&apiKey=${GEOAPIFY_KEY}`,
      {timeout: 5000}
    );

    console.log("after geoapify");
    
    const coordinates =
      geoResponse.data.features[0].geometry.coordinates;

    const newListing = new Listing(req.body.listing);

    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    //  save geo data
    newListing.geometry = {
      type: "Point",
      coordinates: coordinates,
    };

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");

  } catch (err) {
    console.log(err);
    req.flash("error", "Invalid location");
    res.redirect("/listings/new");
  }
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing you requested for does not exist!");
      return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload","/upload/h_300,w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
  };

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;

  // Get existing listing
  let listing = await Listing.findById(id);

  const newLocation = req.body.listing.location;

  //  If location changed → fetch new coordinates
  if (newLocation) {
    try {
      const location = encodeURIComponent(newLocation);

      const geoResponse = await axios.get(
        `https://api.geoapify.com/v1/geocode/search?text=${location}&apiKey=${process.env.GEOAPIFY_KEY}`
      );

      if (geoResponse.data.features.length > 0) {
        listing.geometry = {
          type: "Point",
          coordinates:
            geoResponse.data.features[0].geometry.coordinates,
        };
      } else {
        req.flash("error", "Invalid updated location");
        return res.redirect(`/listings/${id}/edit`);
      }

    } catch (err) {
      console.log(err);
      req.flash("error", "Location update failed");
      return res.redirect(`/listings/${id}/edit`);
    }
  }

  // 3️Update other fields
  listing.set(req.body.listing);

  // Update image if new uploaded
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
  }

  //  Save everything
  await listing.save();

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroy = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
  };