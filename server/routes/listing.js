const router = require("express").Router();
const multer = require("multer");
const mongoose = require("mongoose");

const Listing = require("../models/Listing");
const User = require("../models/User");

/* Configuration Multer for File Upload */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/"); // Store uploaded files in the 'uploads' folder
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({ storage });

/* Middleware to log incoming requests */
router.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.path}`);
  next();
});

/* CREATE LISTING */
router.post("/create", upload.array("listingPhotos"), async (req, res) => {
  try {
    /* Take the information from the form */
    const {
      creator,
      category,
      type,
      streetAddress,
      aptSuite,
      city,
      province,
      country,
      guestCount,
      bedroomCount,
      bedCount,
      bathroomCount,
      amenities,
      title,
      description,
      highlight,
      highlightDesc,
      price,
    } = req.body;

    const listingPhotos = req.files;

    if (!listingPhotos) {
      return res.status(400).send("No file uploaded.");
    }

    const listingPhotoPaths = listingPhotos.map((file) => file.path);

    const newListing = new Listing({
      creator,
      category,
      type,
      streetAddress,
      aptSuite,
      city,
      province,
      country,
      guestCount,
      bedroomCount,
      bedCount,
      bathroomCount,
      amenities,
      listingPhotoPaths,
      title,
      description,
      highlight,
      highlightDesc,
      price,
    });

    await newListing.save();

    res.status(200).json(newListing);
  } catch (err) {
    res.status(409).json({ message: "Failed to create Listing", error: err.message });
    console.error(err);
  }
});

/* GET LISTINGS BY CATEGORY */
router.get("/", async (req, res) => {
  const qCategory = req.query.category;

  try {
    let listings;
    if (qCategory) {
      listings = await Listing.find({ category: qCategory }).populate("creator");
    } else {
      listings = await Listing.find().populate("creator");
    }

    res.status(200).json(listings);
  } catch (err) {
    res.status(404).json({ message: "Failed to fetch listings", error: err.message });
    console.error(err);
  }
});

/* GET LISTINGS BY SEARCH */
router.get("/search/:search", async (req, res) => {
  const { search } = req.params;

  try {
    let listings = [];

    if (search === "all") {
      listings = await Listing.find().populate("creator");
    } else {
      listings = await Listing.find({
        $or: [
          { category: { $regex: search, $options: "i" } },
          { title: { $regex: search, $options: "i" } },
        ],
      }).populate("creator");
    }

    res.status(200).json(listings);
  } catch (err) {
    res.status(404).json({ message: "Failed to fetch listings", error: err.message });
    console.error(err);
  }
});

/* LISTING DETAILS */
router.get("/:listingId", async (req, res) => {
  const { listingId } = req.params;

  // Validate the ID
  if (!mongoose.Types.ObjectId.isValid(listingId)) {
    return res.status(400).json({ message: "Invalid Listing ID" });
  }

  try {
    const listing = await Listing.findById(listingId).populate("creator");

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.status(200).json(listing);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
    console.error(err);
  }
});

module.exports = router;
