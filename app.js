const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv/config");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { Doctor } = require("./models/doctor");

const app = express();
app.set("trust proxy", 1);

//to generate random ids
function makeid(length) {
  var result = [];
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result.push(
      characters.charAt(Math.floor(Math.random() * charactersLength))
    );
  }
  return result.join("");
}

mongoose.connect(process.env.CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  dbName: "docsrecordDB",
});

//middleware

app.use(express.json());
app.use(cors({ origin: "https://www.docsrecord.com", credentials: true }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.secret,
    resave: true,
    saveUninitialized: true,
    cookie: {
      sameSite: "none",
      httpOnly: true,
      secure: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  return done(null, user._id);
});

passport.deserializeUser((id, done) => {
  Doctor.findById(id, (err, doc) => {
    //whatever we return here, goes to the client and get binds to req.user property
    return done(null, doc);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, cb) {
      //called on successful authentication

      Doctor.findOne({ googleId: profile.id }, async (err, doc) => {
        if (err) {
          return cb(err, null);
        }

        if (!doc) {
          //create one
          var day = new Date();
          let offset = day.getTimezoneOffset();
          day = new Date(day.getTime() - offset * 60000);

          var pay = new Date();
          pay = new Date(pay.getTime() - offset * 60000);
          pay = pay.setDate(pay.getDate() + 30);

          const newDoctor = new Doctor({
            googleId: profile.id,
            name: profile.name.givenName + " " + profile.name.familyName,
            username:
              profile.name.familyName + profile.name.givenName + makeid(10),
            register_date: day,
            payment_valid_till: pay,
          });

          await newDoctor.save();
          cb(null, newDoctor);
        }
        cb(null, doc);
      });
    }
  )
);

const doctorsRouter = require("./routers/doctors");
const patientsRouter = require("./routers/patients");
const paymentsRouter = require("./routers/payments");

app.use("/doctor", doctorsRouter);
app.use("/patient", patientsRouter);
app.use("/payment", paymentsRouter);

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "https://www.docsrecord.com",
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("https://www.docsrecord.com/records");
  }
);

app.get("/auth/logout", (req, res) => {
  if (req.user) {
    req.logout();
    res.send("done");
  }
});

app.get("/", (req, res) => {
  res.send("API is working fine !");
});

app.listen(process.env.PORT, () =>
  console.log("Server is running on port : " + process.env.PORT)
);
