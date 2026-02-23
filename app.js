if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./model/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const dbUrl = process.env.ATLASDB_URL;

/* ---------------- DATABASE CONNECTION ---------------- */

async function startServer() {
  await mongoose.connect(dbUrl);
  console.log(" connected to db");
  console.log("DB NAME:", mongoose.connection.name);

  /* ---------------- SESSION STORE ---------------- */

  const store = MongoStore.create({
    mongoUrl: dbUrl,
    secret: process.env.SECRET,

  stringify: false,   
});

  store.on("error", (err) => {
    console.log("SESSION STORE ERROR", err);
  });

  const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    },
  };

  app.use(session(sessionOptions));
  app.use(flash());

  /* ---------------- PASSPORT ---------------- */

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(User.authenticate()));
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

  /* ---------------- LOCALS ---------------- */

   app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
  });


  /* ---------------- ROUTES ---------------- */

  app.use("/listings", listingRouter);
  app.use("/listings/:id/reviews", reviewRouter);
  app.use("/", userRouter);

  /* ---------------- ERROR HANDLING ---------------- */

  app.use((req, res, next) => {
    next(new ExpressError(404, "Page not found!"));
  });

  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    let { statusCode = 500, message = "Something Went Wrong!" } = err;
    res.status(statusCode).render("error.ejs", { message });
  });

  /* ---------------- START SERVER ---------------- */

  app.listen(8080, () => {
    console.log("server is listening on port 8080");
  });
}

startServer().catch((err) => {
  console.log(" DB CONNECTION FAILED", err);
});

/* ---------------- APP CONFIG (outside) ---------------- */

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));