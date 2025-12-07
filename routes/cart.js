const express = require("express");
const router = express.Router();
const { cartModel } = require("../models/cart");
const { userIsLoggedIn } = require("../middlewares/admin");
const { productModel } = require("../models/product");
const mongoose = require("mongoose");

// ---------------------- CART PAGE ----------------------
router.get("/", userIsLoggedIn, async function (req, res) {
  try {
    let cart = await cartModel
      .findOne({ user: req.session.passport.user })
      .populate("products");

    if (!cart) {
      return res.render("cart", {
        cart: [],
        finalprice: 0,
        userid: req.session.passport.user,
      });
    }

    let cartDataStructure = {};

    cart.products.forEach((product) => {
      let key = product._id.toString();
      if (cartDataStructure[key]) {
        cartDataStructure[key].quantity += 1;
      } else {
        cartDataStructure[key] = {
          ...product._doc,
          quantity: 1,
        };
      }
    });

    let finalarray = Object.values(cartDataStructure);
    let finalprice = cart.totalPrice + 34;

    res.render("cart", {
      cart: finalarray,
      finalprice: finalprice,
      userid: req.session.passport.user,
    });
  } catch (err) {
    res.send(err.message);
  }
});

// ---------------------- ADD TO CART ----------------------
router.get("/add/:id", userIsLoggedIn, async function (req, res) {
  try {
    // Validate ID
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.redirect("/cart");
    }

    let cart = await cartModel.findOne({ user: req.session.passport.user });
    let product = await productModel.findById(req.params.id);

    if (!product) return res.send("Product not found");

    if (!cart) {
      cart = await cartModel.create({
        user: req.session.passport.user,
        products: [req.params.id],
        totalPrice: Number(product.price),
      });
    } else {
      cart.products.push(req.params.id);
      cart.totalPrice += Number(product.price);
      await cart.save();
    }

    res.redirect("back");
  } catch (err) {
    res.send(err.message);
  }
});

// ---------------------- REMOVE FROM CART ----------------------
router.get("/remove/:id", userIsLoggedIn, async function (req, res) {
  try {
    // Validate ID
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.redirect("/cart");
    }

    let cart = await cartModel.findOne({ user: req.session.passport.user });
    if (!cart) return res.send("Cart is empty");

    let product = await productModel.findById(req.params.id);
    if (!product) return res.send("Product not found");

    let index = cart.products.indexOf(req.params.id);

    if (index !== -1) {
      cart.products.splice(index, 1);
      cart.totalPrice -= Number(product.price);
      await cart.save();
    } else {
      return res.send("Item not in cart");
    }

    res.redirect("back");
  } catch (err) {
    res.send(err.message);
  }
});

module.exports = router;
