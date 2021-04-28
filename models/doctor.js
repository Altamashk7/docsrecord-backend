const mongoose = require("mongoose");

const doctorSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,

    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  phone_number: {
    type: Number,
    required: true,
  },
  qualifications: {
    type: String,
    required: true,
  },
  clinic_name: {
    type: String,
    required: true,
  },
  clinic_address: {
    type: String,
    required: true,
  },
  image: {
    data: Buffer,
    contentType: String,
  },
  register_date: {
    type: Date,
  },
  payment_valid_till: {
    type: Date,
  },
  free_trial: {
    type: Boolean,
    default: true,
  },
  visit_charges: {
    type: Number,
    default: 0,
  },
  timings: {
    type: String,
  },
});

exports.Doctor = mongoose.model("Doctor", doctorSchema);
