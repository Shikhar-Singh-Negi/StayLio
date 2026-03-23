const User = require("../models/user");
const Listing = require("../models/listing");
const Review = require("../models/review");
const Booking = require("../models/booking");

module.exports.dashboard = async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalListings = await Listing.countDocuments();
  const totalReviews = await Review.countDocuments();
  const totalBookings = await Booking.countDocuments();
  
  // Calculate total revenue from confirmed bookings
  const bookings = await Booking.find({ status: "Confirmed" });
  const totalRevenue = bookings.reduce((acc, booking) => acc + booking.totalPrice, 0);

  // Group by month for chart (example logic)
  const monthlyData = await Booking.aggregate([
    { $match: { status: "Confirmed" } },
    {
      $group: {
        _id: { $month: "$createdAt" },
        bookings: { $sum: 1 },
        revenue: { $sum: "$totalPrice" }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  res.render("admin/dashboard", { 
    stats: { totalUsers, totalListings, totalReviews, totalBookings, totalRevenue },
    monthlyData: JSON.stringify(monthlyData),
    active: "dashboard"
  });
};

module.exports.indexUsers = async (req, res) => {
  const users = await User.find({});
  res.render("admin/users", { users, active: "users" });
};

module.exports.updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    await User.findByIdAndUpdate(id, { role });
    req.flash("success", "User role updated successfully");
    res.redirect("/admin/users");
};

module.exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    req.flash("success", "User deleted successfully");
    res.redirect("/admin/users");
};

module.exports.indexListings = async (req, res) => {
  const listings = await Listing.find({}).populate("owner");
  res.render("admin/listings", { listings, active: "listings" });
};

module.exports.toggleListingApproval = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  listing.isApproved = !listing.isApproved;
  await listing.save();
  req.flash("success", `Listing ${listing.isApproved ? "approved" : "rejected"} successfully`);
  res.redirect("/admin/listings");
};

module.exports.deleteListing = async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing deleted successfully");
    res.redirect("/admin/listings");
};

module.exports.indexBookings = async (req, res) => {
  const bookings = await Booking.find({}).populate("listing").populate("user");
  res.render("admin/bookings", { bookings, active: "bookings" });
};

module.exports.updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  await Booking.findByIdAndUpdate(id, { status });
  req.flash("success", "Booking status updated");
  res.redirect("/admin/bookings");
};

module.exports.indexReviews = async (req, res) => {
  const reviews = await Review.find({}).populate("author");
  res.render("admin/reviews", { reviews, active: "reviews" });
};

module.exports.deleteReview = async (req, res) => {
  const { id } = req.params;
  // Note: we might need to remove reference from listing too if we want to be thorough, 
  // but findOneAndDelete hook on Listing handles it from review side. 
  // Here we just delete the review.
  await Review.findByIdAndDelete(id);
  req.flash("success", "Review deleted successfully");
  res.redirect("/admin/reviews");
};
