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

router.get(`/`, async (req, res) => {
  const doctorList = await Doctor.find().select("-password");

  if (!doctorList) {
    res.status(500).json({ success: false });
  }
  res.status(200).send(doctorList);
});

router.get("/:id", async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).select("-password");

  if (!doctor) {
    res
      .status(500)
      .json({ message: "The Doctor with the given ID was not found." });
  }
  res.status(200).send(doctor);
});

router.put("/:id", uploadOptions.single("image"), async (req, res) => {
  const file = req.file;
  if (file) {
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
      timings: req.body.timings,
      qualifications: req.body.qualifications,
      phone_number: req.body.phone_number,
    };
    for (let prop in params) if (!params[prop]) delete params[prop];

    const doctor = await Doctor.findByIdAndUpdate(req.params.id, params, {
      new: true,
    });

    var sanitizeddoctor = _.omit(doctor.toObject(), "password");

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

    res.status(200).send({ doctor: sanitizeddoctor });
  } else {
    let params = {
      email: req.body.email,
      name: req.body.name,
      payment_valid_till: req.body.payment_valid_till,
      clinic_name: req.body.clinic_name,
      clinic_address: req.body.clinic_address,
      free_trial: req.body.free_trial,
      visit_charges: req.body.visit_charges,
      timings: req.body.timings,
      qualifications: req.body.qualifications,
      phone_number: req.body.phone_number,
    };
    for (let prop in params) if (!params[prop]) delete params[prop];

    const doctor = await Doctor.findByIdAndUpdate(req.params.id, params, {
      new: true,
    });

    if (!doctor) return res.status(400).send("the doctor cannot be updated!");

    var sanitizeddoctor = _.omit(doctor.toObject(), "password");

    res.status(200).send({ doctor: sanitizeddoctor });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) {
      return res.status(404).send();
    }
    res.send("Doctor succesfully deleted");
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/login", async (req, res) => {
  const doctor = await Doctor.findOne({ email: req.body.email });
  const secret = process.env.secret;
  if (!doctor) {
    return res.status(400).send("email incorrect");
  }

  if (doctor && bcrypt.compareSync(req.body.password, doctor.password)) {
    const token = jwt.sign(
      {
        doctorId: doctor._id,
      },
      secret,
      { expiresIn: "1d" }
    );

    res.status(200).send({ doctor: doctor._id, token: token });
  } else {
    res.status(400).send("password incorrect");
  }
});

router.post("/register", uploadOptions.single("image"), async (req, res) => {
  const file = req.file;

  var day = new Date();
  let offset = day.getTimezoneOffset();
  day = new Date(day.getTime() - offset * 60000);
  var pay = new Date();

  pay = new Date(pay.getTime() - offset * 60000);
  pay = pay.setDate(pay.getDate() + 7);

  if (file) {
    const secret = process.env.secret;
    let doctor = new Doctor({
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
      name: req.body.name,
      register_date: day,
      payment_valid_till: pay,
      clinic_name: req.body.clinic_name,
      clinic_address: req.body.clinic_address,
      image: {
        data: fs.readFileSync(
          path.join(__dirname + "//../public/uploads/" + req.file.filename)
        ),
        contentType: "image/png",
      },
      visit_charges: req.body.visit_charges,
      timings: req.body.timings,
      qualifications: req.body.qualifications,
      phone_number: req.body.phone_number,
    });
    doctor = await doctor.save();

    if (!doctor) return res.status(400).send("the doctor cannot be created!");
    const token = jwt.sign(
      {
        doctoremail: req.body.email,
      },
      secret,
      { expiresIn: "1d" }
    );
    var sanitizeddoctor = _.omit(doctor.toObject(), "password");
    res.status(200).send({ doctor: sanitizeddoctor, token: token });
  } else {
    const secret = process.env.secret;

    let doctor = new Doctor({
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
      name: req.body.name,
      register_date: day,
      payment_valid_till: pay,
      clinic_name: req.body.clinic_name,
      clinic_address: req.body.clinic_address,
      visit_charges: req.body.visit_charges,
      timings: req.body.timings,
      qualifications: req.body.qualifications,
      phone_number: req.body.phone_number,
    });
    doctor = await doctor.save();

    if (!doctor) return res.status(400).send("the doctor cannot be created!");
    const token = jwt.sign(
      {
        doctoremail: req.body.email,
      },
      secret,
      { expiresIn: "1d" }
    );
    var sanitizeddoctor = _.omit(doctor.toObject(), "password");
    res.status(200).send({ doctor: sanitizeddoctor, token: token });
  }
});

module.exports = router;
