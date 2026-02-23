const express = require("express");
const router = express.Router();
const User = require("../model/user");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl } = require("../middelware.js");
const usercontroller = require("../controllers/users.js");

router
  .route("/signup")
  .get(usercontroller.renderSignupForm)
  .post(wrapAsync(usercontroller.signup));

router
  .route("/login")
  .get(usercontroller.renderLoginForm)
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    usercontroller.login,
  );

router.get("/logout", usercontroller.logout);

module.exports = router;
