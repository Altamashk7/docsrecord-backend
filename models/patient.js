const mongoose = require("mongoose");

const Doctor = require("../models/doctor");

const patientSchema = mongoose.Schema({
  email: {
    type: String,
  },

  name: {
    type: String,
    required: true,
  },

  phone_number: {
    type: String,
  },
  age: {
    type: Number,
  },
  gender: {
    type: String,
  },
  address: {
    type: String,
  },
  payment_method: {
    type: String,
  },
  total_treatments: {
    type: Number,
  },
  total_cost: {
    type: Number,
  },
  visit_date: {
    type: String,
  },
  next_appointment_date: {
    type: String,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
  treatments: [
    {
      treatment: String,
      charges: Number, //charges
    },
  ],
  date: {
    type: Date,
  },
  images: [
    {
      type: String,
    },
  ],
});

exports.Patient = mongoose.model("Patient", patientSchema);
