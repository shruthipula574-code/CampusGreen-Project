const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../supabase");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

function makeToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: "8h", issuer: "campus-green-ideas-board" });
}
function publicUser(user) { return { id: user.id, name: user.name, email: user.email, role: user.role }; }

router.post("/signup", async (req, res, next) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (name.length < 2 || name.length > 80) return res.status(400).json({ error: "Name must be between 2 and 80 characters." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ error: "Enter a valid email address." });
    if (password.length < 8 || password.length > 128) return res.status(400).json({ error: "Password must be 8–128 characters long." });
    const { data: existing, error: lookupError } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) return res.status(409).json({ error: "An account with this email already exists." });
    const hash = await bcrypt.hash(password, 12);
    const { data: user, error } = await supabase.from("users").insert({ name, email, password_hash: hash, role: "student" }).select("id,name,email,role").single();
    if (error) {
      if (error.code === "23505") return res.status(409).json({ error: "An account with this email already exists." });
      throw error;
    }
    res.status(201).json({ token: makeToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
});

router.post("/signin", async (req, res, next) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (!email || !password) return res.status(400).json({ error: "Email and password are required." });
    const { data: user, error } = await supabase.from("users").select("id,name,email,role,password_hash").eq("email", email).maybeSingle();
    if (error) throw error;
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: "Incorrect email or password." });
    res.json({ token: makeToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
});

router.get("/me", requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));
module.exports = router;
