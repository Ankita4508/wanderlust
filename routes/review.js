const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("../schema.js");
const Listing = require("../model/listing.js");
const { validateReview , isLoggedIn , isReviewOwner} = require("../middelware.js");
const Review = require("../model/review.js");
const reviewController = require("../controllers/reviews.js");

//reviews
//post review route
router.post(
  "/",
  isLoggedIn,
  validateReview,
  wrapAsync(reviewController.createReview),
);

//delete review route
router.delete(
  "/:reviewId",
  isLoggedIn,
  isReviewOwner,
  wrapAsync(reviewController.destoryReview),
);

module.exports = router;
