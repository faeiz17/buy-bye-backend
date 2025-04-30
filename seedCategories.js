// seedCategories.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("./config/db"); // your DB connection util
const Category = require("./models/Category");
const SubCategory = require("./models/SubCategory");

dotenv.config();
connectDB();

const data = [
  {
    name: "baby",
    subCategories: [
      { name: "diapers_and_wipes", food_reciepe: 0 },
      { name: "baby_cereals", food_reciepe: 0 },
      { name: "baby_milk", food_reciepe: 0 },
    ],
  },
  {
    name: "bakery",
    subCategories: [
      { name: "bread", food_reciepe: 1 },
      { name: "buns", food_reciepe: 1 },
      { name: "rusk", food_reciepe: 1 },
      { name: "cookies", food_reciepe: 1 },
    ],
  },
  {
    name: "beverages",
    subCategories: [
      { name: "iced_tea_and_coffee", food_reciepe: 0 },
      { name: "juices", food_reciepe: 0 },
      { name: "instant_drinks", food_reciepe: 0 },
      { name: "nutrional_drinks", food_reciepe: 0 },
      { name: "red_syrups", food_reciepe: 0 },
      { name: "squashes", food_reciepe: 0 },
      { name: "soft_drinks", food_reciepe: 0 },
      { name: "water", food_reciepe: 0 },
    ],
  },
  {
    name: "Cooking_essentials",
    subCategories: [
      { name: "flour", food_reciepe: 1 },
      { name: "oil_and_ghee", food_reciepe: 1 },
      { name: "pulses", food_reciepe: 1 },
      { name: "rice", food_reciepe: 1 },
      { name: "sugar", food_reciepe: 1 },
      { name: "sauses_seasoning", food_reciepe: 1 },
      { name: "spice_and_herbs", food_reciepe: 1 },
    ],
  },
  {
    name: "dairy",
    subCategories: [
      { name: "breakfast", food_reciepe: 1 },
      { name: "butter_and_margarine", food_reciepe: 1 },
      { name: "cheese_and_cream", food_reciepe: 1 },
      { name: "eggs", food_reciepe: 1 },
      { name: "milk", food_reciepe: 1 },
      { name: "yogurt", food_reciepe: 1 },
    ],
  },
  {
    name: "fresh_food",
    subCategories: [
      { name: "fruits_and_vegetables", food_reciepe: 1 },
      { name: "meat", food_reciepe: 1 },
      { name: "seafood", food_reciepe: 1 },
    ],
  },
  {
    name: "groceries",
    subCategories: [
      { name: "canned_food", food_reciepe: 1 },
      { name: "desserts", food_reciepe: 1 },
      { name: "home_baking", food_reciepe: 1 },
      { name: "packaged_foods", food_reciepe: 1 },
      { name: "snacks", food_reciepe: 1 },
      { name: "tea_and_coffee", food_reciepe: 1 },
    ],
  },
  {
    name: "health_and_beauty",
    subCategories: [
      { name: "bath_and_soap", food_reciepe: 0 },
      { name: "fragrance", food_reciepe: 0 },
      { name: "hair_care", food_reciepe: 0 },
      { name: "oral_care", food_reciepe: 0 },
      { name: "skin_care", food_reciepe: 0 },
      { name: "toiletries", food_reciepe: 0 },
    ],
  },
  {
    name: "household",
    subCategories: [
      { name: "aerosols", food_reciepe: 0 },
      { name: "house_cleaning", food_reciepe: 0 },
      { name: "kitchen_cleaning", food_reciepe: 0 },
      { name: "kitchen_utensils_and_cutlery", food_reciepe: 0 },
      { name: "laundry", food_reciepe: 0 },
      { name: "miscalleneous", food_reciepe: 0 },
    ],
  },
];

const seed = async () => {
  try {
    // 1️⃣ Clear existing
    await SubCategory.deleteMany({});
    await Category.deleteMany({});

    // 2️⃣ Insert fresh
    for (const catData of data) {
      const category = await Category.create({ name: catData.name });

      // create subcategories for this category
      const subs = catData.subCategories.map((sub) => ({
        name: sub.name,
        category: category._id,
        food_reciepe: sub.food_reciepe,
      }));
      await SubCategory.insertMany(subs);
    }

    console.log("✅ Categories & SubCategories seeded!");
    process.exit();
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
};

seed();
