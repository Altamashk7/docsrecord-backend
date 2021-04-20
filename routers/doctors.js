const { Doctor } = require("../models/doctor");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");

// Requiring the lodash library
const _ = require("lodash");
const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("invalid image type");

    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, "public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
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

router.post("/", uploadOptions.single("image"), async (req, res) => {
  const file = req.file;
  var day = new Date();
  var pay = new Date();
  pay = pay.setDate(pay.getDate() + 7);

  if (file) {
    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

    let doctor = new Doctor({
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
      name: req.body.name,
      register_date: day,
      paymnet_valid_till: pay,
      clinic_name: req.body.clinic_name,
      clinic_address: req.body.clinic_address,
      image: `${basePath}${fileName}`,
      visit_charges: req.body.visit_charges,
      timings: req.body.timings,
    });
    doctor = await doctor.save();

    if (!doctor) return res.status(400).send("the doctor cannot be created!");

    var sanitizeddoctor = _.omit(doctor.toObject(), "password");

    res.status(200).send({ doctor: sanitizeddoctor });
  } else {
    let doctor = new Doctor({
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
      name: req.body.name,
      register_date: day,
      paymnet_valid_till: pay,
      clinic_name: req.body.clinic_name,
      clinic_address: req.body.clinic_address,
      visit_charges: req.body.visit_charges,
      timings: req.body.timings,
    });
    doctor = await doctor.save();

    if (!doctor) return res.status(400).send("the doctor cannot be created!");

    var sanitizeddoctor = _.omit(doctor.toObject(), "password");

    res.status(200).send({ doctor: sanitizeddoctor });
  }
});

router.put("/:id", uploadOptions.single("image"), async (req, res) => {
  const file = req.file;
  if (file) {
    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

    let params = {
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      name: req.body.name,
      paymnet_valid_till: req.body.paymnet_valid_till,
      clinic_name: req.body.clinic_name,
      clinic_address: req.body.clinic_address,
      image: `${basePath}${fileName}`,
      free_trial: req.body.free_trial,
      visit_charges: req.body.visit_charges,
      timings: req.body.timings,
    };
    for (let prop in params) if (!params[prop]) delete params[prop];

    const doctor = await Doctor.findByIdAndUpdate(req.params.id, params, {
      new: true,
    });

    if (!doctor) return res.status(400).send("the doctor cannot be created!");

    var sanitizeddoctor = _.omit(doctor.toObject(), "password");

    res.status(200).send({ doctor: sanitizeddoctor });
  } else {
    let params = {
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      name: req.body.name,
      paymnet_valid_till: req.body.paymnet_valid_till,
      clinic_name: req.body.clinic_name,
      clinic_address: req.body.clinic_address,
      free_trial: req.body.free_trial,
      visit_charges: req.body.visit_charges,
      timings: req.body.timings,
    };
    for (let prop in params) if (!params[prop]) delete params[prop];

    const doctor = await Doctor.findByIdAndUpdate(req.params.id, params, {
      new: true,
    });

    if (!doctor) return res.status(400).send("the doctor cannot be created!");

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
  var pay = new Date();
  pay = pay.setDate(pay.getDate() + 7);

  if (file) {
    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    const secret = process.env.secret;
    let doctor = new Doctor({
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
      name: req.body.name,
      register_date: day,
      paymnet_valid_till: pay,
      clinic_name: req.body.clinic_name,
      clinic_address: req.body.clinic_address,
      image: `${basePath}${fileName}`,
      visit_charges: req.body.visit_charges,
      timings: req.body.timings,
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
