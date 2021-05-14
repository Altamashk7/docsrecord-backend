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
    default: "",
  },
  clinic_name: {
    type: String,

    default: "",
  },
  clinic_address: {
    type: String,
    default: "",
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

  visit_charges: {
    type: Number,
    default: 0,
  },
  timings: {
    type: Object,
  },
});

exports.Doctor = mongoose.model("Doctor", doctorSchema);
