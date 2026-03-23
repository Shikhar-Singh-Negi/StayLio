if (process.env.NODE_ENV != "production") {
  require("dotenv").config({ path: "../.env" });
}
const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/StayLio";

main()
  .then(() => {
    console.log("connected to db");
    initDB();
  })
  .catch((err) => {
    console.log(err);
  });
async function main() {
  await mongoose.connect(dbUrl);
}

const initDB = async () => {
  await Listing.deleteMany({});
  const categories = [
    "Beachfront", "Farms", "Omg", "Lake", "Design", "Amazing Pools",
    "Amazing Views", "Rooms", "Lakefront", "Tiny Homes", "Countryside",
    "Cabins", "Treehouse", "Tropical", "National Parks", "Castles",
    "Camping", "Top Of The World", "Luxe", "Iconic Cities", "Earth Homes"
  ];

  initData.data = initData.data.map((obj) => ({
    ...obj,
    owner: "69bd500923a357070e8ab1c7",
    geometry: {
      type: "Point",
      coordinates: [0, 0],
    },
    category: [categories[Math.floor(Math.random() * categories.length)]],
    bedrooms: Math.floor(Math.random() * 5) + 1,
    beds: Math.floor(Math.random() * 6) + 1,
    bathrooms: Math.floor(Math.random() * 3) + 1,
    amenities: ["Wifi", "Kitchen", "Free Parking", "Air conditioning"].slice(0, Math.floor(Math.random() * 4) + 1),
    propertyType: ["House", "Flat", "Guests house", "Hotel"][Math.floor(Math.random() * 4)],
  }));
  await Listing.insertMany(initData.data);
  console.log("data was intilized");
};

