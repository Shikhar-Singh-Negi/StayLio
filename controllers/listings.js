const Listing = require("../models/listing");
// const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
// const mapToken = process.env.MAP_TOKEN;
// let geocodingClient;
// if (mapToken && mapToken !== "maptoken") {
//   geocodingClient = mbxGeocoding({ accessToken: mapToken });
// } else {
//   console.warn("Invalid or missing MAP_TOKEN. Geocoding will not work.");
// }

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({ isApproved: { $ne: false } });
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }
  console.log(listing);
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  let url = req.file.path;
  let filename = req.file.filename;

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };

  // if (geocodingClient) {
  //   let response = await geocodingClient
  //     .forwardGeocode({
  //       query: req.body.listing.location,
  //       limit: 1,
  //     })
  //     .send();
  //   if (response.body.features.length) {
  //     newListing.geometry = response.body.features[0].geometry;
  //   }
  // } else {
    // Default or fallback geometry if geocoding fails
    newListing.geometry = { type: "Point", coordinates: [77.209, 28.6139] }; // Default to Delhi coords for now
  // }

  let savedListing = await newListing.save();
  console.log(savedListing);

  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;

  // if (geocodingClient) {
  //   let coordinate = await geocodingClient
  //     .forwardGeocode({
  //       query: `${req.body.listing.location},${req.body.listing.country}`,
  //       limit: 2,
  //     })
  //     .send();
  //   if (coordinate.body.features.length) {
  //     req.body.listing.geometry = coordinate.body.features[0].geometry;
  //   }
  // }

  let updatedListing = await Listing.findByIdAndUpdate(id, req.body.listing);

  if (req.file) {
    let url = req.file.path;
    let filename = req.file.filename;
    updatedListing.image = { url, filename };
    await updatedListing.save();
  }
  req.flash("success", "Listing Updated !!");
  res.redirect(`/listings/${id}`);
};

// module.exports.updateListing = async (req, res) => {
//   let { id } = req.params;
//   let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

//   if (typeof req.file !== "undefined") {
//     let url = req.file.path;
//     let filename = req.file.filename;
//     listing.image = { url, filename };
//     await listing.save();
//   }

//   req.flash("success", "Listing Updated!");
//   res.redirect(`/listings/${id}`);
// };

// --- Display listings by category ---

module.exports.filterAdvanced = async (req, res) => {
  let { bedrooms, beds, bathrooms, propertyType, amenities, minPrice, maxPrice } = req.query;
  let query = {};

  // Price range filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseInt(minPrice);
    if (maxPrice) query.price.$lte = parseInt(maxPrice);
  }

  if (bedrooms && bedrooms !== "Any") {
    query.bedrooms = bedrooms.includes("+") ? { $gte: parseInt(bedrooms) } : parseInt(bedrooms);
  }
  if (beds && beds !== "Any") {
    query.beds = beds.includes("+") ? { $gte: parseInt(beds) } : parseInt(beds);
  }
  if (bathrooms && bathrooms !== "Any") {
    query.bathrooms = bathrooms.includes("+") ? { $gte: parseInt(bathrooms) } : parseInt(bathrooms);
  }
  if (propertyType && propertyType !== "Any") {
    query.propertyType = propertyType;
  }
  if (amenities) {
    if (Array.isArray(amenities)) {
      query.amenities = { $all: amenities };
    } else {
      query.amenities = amenities;
    }
  }

  query.isApproved = { $ne: false };
  let allListings = await Listing.find(query);
  if (allListings.length != 0) {
    res.locals.success = "Filters applied!";
    res.render("listings/index.ejs", { allListings });
  } else {
    req.flash("error", "No listings match these filters!");
    res.redirect("/listings");
  }
};

module.exports.filter = async (req, res, next) => {
  let { id } = req.params;
  let allListings = await Listing.find({ 
    category: { $regex: `^${id}$`, $options: "i" },
    isApproved: { $ne: false } 
  });
  console.log(allListings);
  if (allListings.length != 0) {
    res.locals.success = `Listings Find by ${id}`;
    res.render("listings/index.ejs", { allListings });
  } else {
    req.flash("error", "Listings is not here !!!");
    res.redirect("/listings");
  }
};

// --- Search ---

module.exports.search = async (req, res) => {
  console.log(req.query.q);
  let input = req.query.q.trim().replace(/\s+/g, " ");
  console.log(input);
  if (input == "" || input == " ") {
    req.flash("error", "Search value empty !!!");
    res.redirect("/listings");
  }

  let data = input.split("");
  let element = "";
  let flag = false;
  for (let index = 0; index < data.length; index++) {
    if (index == 0 || flag) {
      element = element + data[index].toUpperCase();
    } else {
      element = element + data[index].toLowerCase();
    }
    flag = data[index] == " ";
  }
  console.log(element);
  let allListings = await Listing.find({
    title: { $regex: element, $options: "i" },
    isApproved: { $ne: false }
  });
  if (allListings.length != 0) {
    res.locals.success = "Listings searched by Title";
    res.render("listings/index.ejs", { allListings });
    return;
  }

  if (allListings.length == 0) {
    allListings = await Listing.find({
      category: { $regex: element, $options: "i" },
    }).sort({ _id: -1 });
    if (allListings.length != 0) {
      res.locals.success = "Listings searched by Category";
      res.render("listings/index.ejs", { allListings });
      return;
    }
  }
  if (allListings.length == 0) {
    allListings = await Listing.find({
      country: { $regex: element, $options: "i" },
    }).sort({ _id: -1 });
    if (allListings.length != 0) {
      res.locals.success = "Listings searched by Location";
      res.render("listings/index.ejs", { allListings });
      return;
    }
  }

  const intValue = parseInt(element, 10);
  const intDec = Number.isInteger(intValue);

  if (allListings.length == 0 && intDec) {
    allListings = await Listing.find({ price: { $lte: element } }).sort({
      price: 1,
    });
    if (allListings.length != 0) {
      res.locals.success = `Listings searched for less than Rs ${element}`;
      res.render("listings/index.ejs", { allListings });
      return;
    }
  }
  if (allListings.length == 0) {
    req.flash("error", "Listings is not here !!!");
    res.redirect("/listings");
  }
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
