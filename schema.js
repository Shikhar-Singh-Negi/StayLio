const Joi = require("joi");

module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    location: Joi.string().required(),
    country: Joi.string().required(),
    category: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
    price: Joi.number().required().min(0),
    image: Joi.string().allow("", null),
    bedrooms: Joi.number().min(1),
    beds: Joi.number().min(1),
    bathrooms: Joi.number().min(1),
    amenities: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
    propertyType: Joi.string().valid("House", "Flat", "Guests house", "Hotel"),
  }).required(),
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().required(),
  }).required(),
});
