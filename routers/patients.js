const { Patient } = require("../models/patient");
const express = require("express");
const { Doctor } = require("../models/doctor");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const _ = require("lodash");
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
  // localhost:3000/patients?doctor=2342342

  let filter = {};
  if (req.query.doctor) {
    filter = { doctor: req.query.doctor };
  }

  const patientList = await Patient.find(filter);

  if (!patientList) {
    res.status(500).json({ success: false });
  }
  res.send(patientList);
});

function convert(str) {
  var date = new Date(str),
    mnth = ("0" + (date.getMonth() + 1)).slice(-2),
    day = ("0" + date.getDate()).slice(-2);
  return [date.getFullYear(), mnth, day].join("-");
}
router.post(`/`, uploadOptions.array("images", 10), async (req, res) => {
  const files = req.files;
  let imagesPaths = [];
  const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

  if (files) {
    files.map((file) => {
      imagesPaths.push(`${basePath}${file.filename}`);
    });
  }
  var doctorid = mongoose.Types.ObjectId(req.body.doctor);
  const doctor = await Doctor.findById(doctorid);
  if (!doctor) return res.status(400).send("Invalid doctor");
  oldDate = new Date();
  nextday = new Date(
    oldDate.getFullYear(),
    oldDate.getMonth(),
    oldDate.getDate()
  );
  const date = convert(nextday);
  const datei = new Date();
  let total_cost = doctor.visit_charges;
  let total_treatments = 0;
  let treatments = req.body.treatments;
  if (treatments) {
    treatments.forEach(function (obj) {
      let charges = parseInt(obj.charges, 10);
      total_cost = total_cost + charges;
      total_treatments = total_treatments + 1;
    });
  }

  let patient = new Patient({
    email: req.body.email,
    name: req.body.name,
    phone_number: req.body.phone_number,
    age: req.body.age,
    gender: req.body.gender,
    address: req.body.address,
    total_treatments: total_treatments,
    total_cost: total_cost,
    visit_date: date,
    next_appointment_date: req.body.next_appointment_date,
    doctor: doctorid,
    treatments: req.body.treatments,
    date: datei,
    images: imagesPaths,
    payment_method: req.body.payment_method,
  });

  patient = await patient.save();

  if (!patient) return res.status(500).send("The patient cannot be created");

  const doc = await Doctor.findById(doctorid);
  if (patient && doc) {
    const msg = {
      to: patient.email, // Change to your recipient
      from: "aditya.malik.cs.2018@miet.ac.in", // Change to your verified sender
      subject: "Thanks for visiting " + doc.clinic_name,
      html: `<div>Hello ${patient.name}, <br /> Thanks for visiting <strong> ${doc.clinic_name} </strong> We are happy to help you in your problems. <br />We hope to see you soon. Regards. </div>`,
    };
    sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
      })
      .catch((error) => {
        console.error(error);
      });
  }

  res.send(patient);
});

router.put("/:id", uploadOptions.array("images", 10), async (req, res) => {
  const files = req.files;
  let total_cost = 0;
  let total_treatments = 0;
  let treatments = req.body.treatments;
  if (treatments) {
    // const treatments = req.body.treatments;
    treatments.forEach(function (obj) {
      // const issue = obj.issu;
      let charges = parseInt(obj.charges, 10);
      total_cost = total_cost + charges;
      total_treatments = total_treatments + 1;
    });
  }
  if (files) {
    const patientdata = await Patient.findById(req.params.id);
    const patientimages = patientdata.images;

    let imagesPaths = patientimages;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    files.map((file) => {
      imagesPaths.push(`${basePath}${file.filename}`);
    });
    let params = {
      email: req.body.email,
      name: req.body.name,
      phone_number: req.body.phone_number,
      age: req.body.age,
      gender: req.body.gender,
      address: req.body.address,
      total_treatments: total_treatments,
      total_cost: total_cost,
      next_appointment_date: req.body.next_appointment_date,
      treatments: req.body.treatments,
      images: imagesPaths,
      payment_method: req.body.payment_method,
    };
    for (let prop in params) if (!params[prop]) delete params[prop];

    let patient = await Patient.findByIdAndUpdate(req.params.id, params, {
      new: true,
    });

    const doctor = await Doctor.findById(patient.doctor);
    total_cost = total_cost + doctor.visit_charges;

    patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { total_cost: total_cost },
      {
        new: true,
      }
    );
    if (!patient) return res.status(500).send("the patient cannot be updated!");
    res.send(patient);
  } else {
    let params = {
      email: req.body.email,
      name: req.body.name,
      phone_number: req.body.phone_number,
      age: req.body.age,
      gender: req.body.gender,
      address: req.body.address,
      total_treatments: total_treatments,
      total_cost: total_cost,
      next_appointment_date: req.body.next_appointment_date,
      treatments: req.body.treatments,
      payment_method: req.body.payment_method,
    };
    for (let prop in params) if (!params[prop]) delete params[prop];

    const patient = await Patient.findByIdAndUpdate(req.params.id, params, {
      new: true,
    });

    if (!patient) return res.status(500).send("the patient cannot be updated!");

    const appointment = new Date(req.body.next_appointment_date);

    const doc = await Doctor.findById(patient.doctor);

    if (patient && doc && req.body.next_appointment_date) {
      const msg = {
        to: patient.email, // Change to your recipient
        from: "aditya.malik.cs.2018@miet.ac.in", // Change to your verified sender
        subject:
          "Next Appointment at " +
          doc.clinic_name +
          " on " +
          +appointment.getDate() +
          "/" +
          appointment.getMonth() +
          "/" +
          appointment.getFullYear(),
        html: `<div>Hello ${
          patient.name
        }, <br /> Your Next appointment at <strong> ${
          doc.clinic_name
        } </strong> is scheduled on <strong> ${appointment.getDate()} / ${appointment.getMonth()} / ${appointment.getFullYear()}</strong>. <br />We hope to see you soon. Regards. </div>`,
      };
      sgMail
        .send(msg)
        .then(() => {
          console.log("Email sent");
        })
        .catch((error) => {
          console.error(error);
        });
    }

    res.send(patient);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      return res.status(404).send();
    }
    res.send("patient succesfully deleted");
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get(`/get/count`, async (req, res) => {
  const patientCount = await Patient.countDocuments((count) => count);

  if (!patientCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    patientCount: patientCount,
  });
});
router.get(`/get/count/:id`, async (req, res) => {
  const patientCount = await Patient.countDocuments({ doctor: req.params.id });

  if (!patientCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    patientCount: patientCount,
  });
});

router.get(`/:id`, async (req, res) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    res.status(500).json({ success: false });
  }
  res.send(patient);
});

// stats

async function previousmonthf(id) {
  var d = mongoose.Types.ObjectId(id);
  monthData = new Date();

  monthData.setDate(1);
  pmonthData = new Date();

  pmonthData.setDate(1);
  pmonthData.setMonth(pmonthData.getMonth() - 1);

  console.log(monthData);
  console.log(pmonthData);

  TODAY = new Date();
  const patientList = await Patient.find({
    date: {
      $gte: pmonthData,
      $lte: monthData,
    },
    doctor: d,
  }).sort({ date: -1 });

  var count = 0;
  for (let key in patientList) {
    const patient = patientList[key];
    const day = patient.date.getDay();
    count = count + 1;
  }
  return count;
}

async function currentmonthf(id) {
  var d = mongoose.Types.ObjectId(id);
  monthData = new Date();

  monthData.setDate(1);
  pmonthData = new Date();

  pmonthData.setDate(1);
  pmonthData.setMonth(pmonthData.getMonth() + 1);

  console.log(monthData);
  console.log(pmonthData);

  TODAY = new Date();
  const patientList = await Patient.find({
    date: {
      $gte: monthData,
      $lte: pmonthData,
    },
    doctor: d,
  }).sort({ date: -1 });

  var count = 0;
  for (let key in patientList) {
    const patient = patientList[key];
    const day = patient.date.getDay();
    count = count + 1;
  }
  return count;
}

async function monthstatsf(id) {
  const FIRST_MONTH = 1;
  const LAST_MONTH = 12;
  const MONTHS_ARRAY = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];

  let TODAY = new Date("2021-12-06T23:59:59");
  let YEAR_BEFORE = new Date("2021-01-07T00:00:00");
  var d = mongoose.Types.ObjectId(id);

  const monthsstats = await Patient.aggregate([
    {
      $match: {
        doctor: d,
        date: { $gte: YEAR_BEFORE, $lte: TODAY },
      },
    },
    {
      $group: {
        _id: { year_month: { $substrCP: ["$date", 0, 7] } },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year_month": 1 },
    },
    {
      $project: {
        _id: 0,
        count: 1,
        month_year: {
          $concat: [
            {
              $arrayElemAt: [
                MONTHS_ARRAY,
                {
                  $subtract: [
                    { $toInt: { $substrCP: ["$_id.year_month", 5, 2] } },
                    1,
                  ],
                },
              ],
            },
            "-",
            { $substrCP: ["$_id.year_month", 0, 4] },
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        data: { $push: { k: "$month_year", v: "$count" } },
      },
    },
    {
      $addFields: {
        start_year: { $substrCP: [YEAR_BEFORE, 0, 4] },
        end_year: { $substrCP: [TODAY, 0, 4] },
        months1: {
          $range: [
            { $toInt: { $substrCP: [YEAR_BEFORE, 5, 2] } },
            { $add: [LAST_MONTH, 1] },
          ],
        },
        months2: {
          $range: [
            FIRST_MONTH,
            { $add: [{ $toInt: { $substrCP: [TODAY, 5, 2] } }, 1] },
          ],
        },
      },
    },
    {
      $addFields: {
        template_data: {
          $concatArrays: [
            {
              $map: {
                input: "$months1",
                as: "m1",
                in: {
                  count: 0,
                  month_year: {
                    $concat: [
                      {
                        $arrayElemAt: [
                          MONTHS_ARRAY,
                          { $subtract: ["$$m1", 1] },
                        ],
                      },
                      "-",
                      "$start_year",
                    ],
                  },
                },
              },
            },
            {
              $map: {
                input: "$months2",
                as: "m2",
                in: {
                  count: 0,
                  month_year: {
                    $concat: [
                      {
                        $arrayElemAt: [
                          MONTHS_ARRAY,
                          { $subtract: ["$$m2", 1] },
                        ],
                      },
                      "-",
                      "$end_year",
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    },
    {
      $addFields: {
        data: {
          $map: {
            input: "$template_data",
            as: "t",
            in: {
              k: "$$t.month_year",
              v: {
                $reduce: {
                  input: "$data",
                  initialValue: 0,
                  in: {
                    $cond: [
                      { $eq: ["$$t.month_year", "$$this.k"] },
                      { $add: ["$$this.v", "$$value"] },
                      { $add: [0, "$$value"] },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      $project: {
        data: { $arrayToObject: "$data" },
        _id: 0,
      },
    },
  ]);

  return monthsstats;
}

async function weekstatsf(id) {
  var doctorid = mongoose.Types.ObjectId(id);
  var daytoday = new Date();
  daytoday = daytoday.getDay();
  var x = 1;
  var y = 7;
  x = x + daytoday - 2;
  y = y - daytoday;
  console.log(x);
  var k = new Date(new Date().getTime() - x * 24 * 60 * 60 * 1000);
  var h = new Date(new Date().getTime() + y * 24 * 60 * 60 * 1000);
  console.log(k);
  console.log(h);

  const patientListweek = await Patient.find({
    date: {
      $gte: new Date(new Date().getTime() - x * 24 * 60 * 60 * 1000),
      $lte: new Date(new Date().getTime() + y * 24 * 60 * 60 * 1000),
    },
    doctor: doctorid,
  }).sort({ date: -1 });

  var week = [0, 0, 0, 0, 0, 0, 0];

  for (let key in patientListweek) {
    const patient = patientListweek[key];
    const day = patient.date.getDay();

    week[day] = week[day] + 1;
  }

  return week;
}
async function bothweekstatsf(id) {
  var doctorid = mongoose.Types.ObjectId(id);
  var daytoday = new Date();
  daytoday = daytoday.getDay();
  var x = 1;
  var y = 7;
  x = x + daytoday - 2;
  y = y - daytoday;
  console.log(x);
  var k = new Date(new Date().getTime() - x * 24 * 60 * 60 * 1000);
  var h = new Date(new Date().getTime() + y * 24 * 60 * 60 * 1000);
  console.log(k);
  console.log(h);

  const patientListweek = await Patient.find({
    date: {
      $gte: new Date(new Date().getTime() - x * 24 * 60 * 60 * 1000),
      $lte: new Date(new Date().getTime() + y * 24 * 60 * 60 * 1000),
    },
    doctor: doctorid,
  }).sort({ date: -1 });

  var week = [0, 0];

  for (let key in patientListweek) {
    const patient = patientListweek[key];

    week[0] = week[0] + 1;
  }

  x = x + 7;
  y = y - 7 - 1;
  const patientListlastweek = await Patient.find({
    date: {
      $gte: new Date(new Date().getTime() - x * 24 * 60 * 60 * 1000),
      $lte: new Date(new Date().getTime() + y * 24 * 60 * 60 * 1000),
    },
    doctor: doctorid,
  }).sort({ date: -1 });

  for (let key in patientListlastweek) {
    const patient = patientListlastweek[key];
    const day = patient.date.getDay();

    week[1] = week[1] + 1;
  }

  return week;
}

router.get(`/stats/:id`, async (req, res) => {
  const monthstats = await monthstatsf(req.params.id);
  if (!monthstats) return res.status(500).send("error at backend! monthstats");
  const weekstats = await weekstatsf(req.params.id);
  if (!weekstats) return res.status(500).send("error at backend! weekstats");
  const currentmonth = await currentmonthf(req.params.id);
  if (!currentmonth) return res.status(500).send("error at backend! currmonth");
  const previousmonth = await previousmonthf(req.params.id);
  if (!previousmonth)
    return res.status(500).send("error at backend! prev month");
  const bothweekstats = await bothweekstatsf(req.params.id);
  if (!bothweekstats) return res.status(500).send("error at backend! bothweek");

  const monthpercentage =
    ((currentmonth - previousmonth) / previousmonth) * 100;
  const weekpercentage =
    ((bothweekstats[0] - bothweekstats[1]) / bothweekstats[1]) * 100;

  res.json({
    monthstats: monthstats,
    weekstats: weekstats,
    currentmonth: currentmonth,
    currentweek: bothweekstats[0],
    monthpercentage: monthpercentage,
    weekpercentage: weekpercentage,
  });
});

module.exports = router;
