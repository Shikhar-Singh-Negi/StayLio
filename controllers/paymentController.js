const Razorpay = require("razorpay");
const Booking = require("../models/booking");
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

let razorpayInstance;
if (RAZORPAY_ID_KEY && RAZORPAY_SECRET_KEY) {
  razorpayInstance = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY,
  });
} else {
  console.warn("Razorpay keys missing. Payment functionality will not work.");
}

const renderProductPage = async (req, res) => {
  try {
    res.render("product");
  } catch (error) {
    console.log(error.message);
  }
};

const createOrder = async (req, res) => {
  try {
    if (!razorpayInstance) {
       return res.status(400).send({ success: false, msg: "Razorpay keys are missing in .env!" });
    }
    const amount = req.body.amount * 100;

    // Create a pending booking record
    if (req.user && req.body.listingId) {
      const newBooking = new Booking({
          listing: req.body.listingId,
          user: req.user._id,
          checkIn: new Date(),
          checkOut: new Date(Date.now() + 86400000), // 1 day later
          totalPrice: req.body.amount,
          status: "Pending"
      });
      await newBooking.save();
    }
    const options = {
      amount: amount,
      currency: "INR",
      receipt: "razorUser@gmail.com",
    };

    razorpayInstance.orders.create(options, (err, order) => {
      if (!err) {
        res.status(200).send({
          success: true,
          msg: "Order Created",
          order_id: order.id,
          amount: amount,
          key_id: RAZORPAY_ID_KEY,
          product_name: req.body.name,
          description: req.body.description,
          contact: "9339828230",
          name: "MD Affan Asghar",
          email: "mdaffanasghar15@gmail.com",
        });
      } else {
        res.status(400).send({ success: false, msg: "Razorpay Error: " + err.description });
      }
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ success: false, msg: "Internal Server Error" });
  }
};

module.exports = {
  renderProductPage,
  createOrder,
};
