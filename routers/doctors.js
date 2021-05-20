const { Doctor } = require("../models/doctor");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const _ = require("lodash");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now());
  },
});

const uploadOptions = multer({ storage: storage });

router.get("/", async (req, res) => {
  if (req.user !== undefined) {
    res.json(req.user);
  } else {
    res.status(401).send("unauthorized user");
  }
});

router.put("/", uploadOptions.single("image"), async (req, res) => {
  if (req.user) {
    const file = req.file;
    if (file) {
      // var obj = JSON.parse(req.body.timings);
      let params = {
        email: req.body.email,
        name: req.body.name,
        payment_valid_till: req.body.payment_valid_till,
        clinic_name: req.body.clinic_name,
        clinic_address: req.body.clinic_address,
        image: {
          data: fs.readFileSync(
            path.join(__dirname + "//../public/uploads/" + req.file.filename)
          ),
          contentType: "image/png",
        },
        free_trial: req.body.free_trial,
        visit_charges: req.body.visit_charges,
        // timings: obj,
        qualifications: req.body.qualifications,
        phone_number: req.body.phone_number,
      };
      for (let prop in params) if (!params[prop]) delete params[prop];

      const doctor = await Doctor.findByIdAndUpdate(req.user._id, params, {
        new: true,
      });

      if (!doctor) return res.status(400).send("the doctor cannot be updated!");

      if (doctor) {
        const directory = path.join(__dirname + "//../public/uploads/");
        fs.readdir(directory, (err, files) => {
          if (err) throw err;

          for (const file of files) {
            if (file !== "demo.txt") {
              fs.unlink(path.join(directory, file), (err) => {
                if (err) throw err;
              });
            }
          }
        });
      }

      res.status(200).send({ doctor: doctor });
    } else {
      // var obj = JSON.parse(req.body.timings);
      let params = {
        email: req.body.email,
        name: req.body.name,
        payment_valid_till: req.body.payment_valid_till,
        clinic_name: req.body.clinic_name,
        clinic_address: req.body.clinic_address,
        free_trial: req.body.free_trial,
        visit_charges: req.body.visit_charges,
        // timings: obj,
        qualifications: req.body.qualifications,
        phone_number: req.body.phone_number,
      };
      for (let prop in params) if (!params[prop]) delete params[prop];

      const doctor = await Doctor.findByIdAndUpdate(req.user._id, params, {
        new: true,
      });

      if (!doctor) return res.status(400).send("the doctor cannot be updated!");

      res.status(200).send({ doctor: doctor });
    }
  } else {
    res.send(401).send("unauthorized user");
  }
});

router.delete("/", async (req, res) => {
  if (req.user) {
    try {
      const doctor = await Doctor.findByIdAndDelete(req.user._id);
      if (!doctor) {
        return res.status(404).send();
      }
      res.send("Doctor succesfully deleted");
    } catch (error) {
      res.status(500).send(error);
    }
  } else {
    res.send(401).send("unauthorized user");
  }
});

module.exports = router;
