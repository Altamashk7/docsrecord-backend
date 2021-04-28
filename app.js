const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv/config");
const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/error-handler");

const app = express();
app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: "https://docsrecord-backend.herokuapp.com",
  })
);
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  dbName: "docsrecordDB",
});

const doctorsRouter = require("./routers/doctors");
const patientsRouter = require("./routers/patients");
const cookieParser = require("cookie-parser");

app.use(cookieParser());
//routes
app.use(authJwt());
app.use(errorHandler);
app.use("/doctors", doctorsRouter);
app.use("/patients", patientsRouter);

app.get("/", (req, res) => {
  res.send("API is working fine !");
});

app.listen(process.env.PORT, () =>
  console.log("Server is running on port : " + process.env.PORT)
);
