const express = require("express");
const router = express.Router();
const controller = require("../controllers/admin");
const { isLoggedIn, isAdmin } = require("../middleware");

// Protect all admin routes
router.use(isLoggedIn, isAdmin);

// Dashboard routes
router.get("/dashboard", controller.dashboard);

// Users Management routes
router.get("/users", controller.indexUsers);
router.patch("/users/:id/role", controller.updateUserRole);
router.delete("/users/:id", controller.deleteUser);

// Listings Management routes
router.get("/listings", controller.indexListings);
router.patch("/listings/:id/approve", controller.toggleListingApproval);
router.delete("/listings/:id", controller.deleteListing);

// Bookings Management routes
router.get("/bookings", controller.indexBookings);
router.patch("/bookings/:id/status", controller.updateBookingStatus);

// Reviews Management routes
router.get("/reviews", controller.indexReviews);
router.delete("/reviews/:id", controller.deleteReview);

module.exports = router;
