// seedAllProducts.js
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const Category = require("./models/Category");
const SubCategory = require("./models/SubCategory");
const Product = require("./models/Product");

dotenv.config();
connectDB();

// utility to read CSV rows
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", (err) => reject(err));
  });
}

async function seed() {
  try {
    const baseDir = path.join(__dirname, "seed-data");
    // get all category folders except "household"
    const categories = fs.readdirSync(baseDir).filter((name) => {
      const full = path.join(baseDir, name);
      return fs.statSync(full).isDirectory();
    });

    const allProducts = [];

    for (const catName of categories) {
      // find Category by folder name
      const category = await Category.findOne({ name: catName });
      if (!category) {
        console.warn(`⚠️  Category "${catName}" not found, skipping`);
        continue;
      }

      const catDir = path.join(baseDir, catName);
      // for each sub-category folder
      const subDirs = fs
        .readdirSync(catDir)
        .filter((sd) => fs.statSync(path.join(catDir, sd)).isDirectory());

      for (const subName of subDirs) {
        // find SubCategory by name AND parent category
        const subCat = await SubCategory.findOne({
          name: subName,
          category: category._id,
        });
        if (!subCat) {
          console.warn(
            `⚠️  SubCategory "${subName}" under "${catName}" not found, skipping`
          );
          continue;
        }

        const subDir = path.join(catDir, subName);
        const files = fs
          .readdirSync(subDir)
          .filter((f) => f.toLowerCase().endsWith(".csv"));

        for (const file of files) {
          const rows = await parseCSV(path.join(subDir, file));

          for (const row of rows) {
            const title = row["CategoryGrid_product_name__3nYsN"]?.trim();
            const imageUrl = row["sc-kDvujY src 2"]?.trim();
            const price = row["CategoryGrid_product_price__Svf8T"]?.trim();

            if (title && imageUrl && price) {
              allProducts.push({
                title,
                imageUrl,
                price,
                category: category._id,
                subCategory: subCat._id,
              });
            }
          }
        }
      }
    }

    if (allProducts.length) {
      // optional: clear existing non-household products
      await Product.deleteMany({}); // or add filter if you want
      await Product.insertMany(allProducts);
      console.log(
        `✅ Seeded ${allProducts.length} products (excluding household).`
      );
    } else {
      console.log("ℹ️  No products found to seed.");
    }

    process.exit();
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
}

seed();
