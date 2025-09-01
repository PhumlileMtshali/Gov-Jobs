// index.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---------------- DATABASE CONNECTION ----------------
const pool = new Pool({
  user: "postgres",        // <- your PostgreSQL username
  host: "localhost",
  database: "z83_project", // <- your database name
  password: "newpassword", // <- your PostgreSQL password
  port: 5432,
});

pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ PostgreSQL connection error:", err));

// ---------------- JWT SECRET ----------------
const JWT_SECRET = "supersecretkey"; // use environment variable in production

// ---------------- REGISTER ----------------
app.post("/api/auth/register", async (req, res) => {
  console.log("Incoming registration data:", req.body);

  const { name, email, password, role, id_no, employee_no } = req.body;

  // Required fields validation
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Name, email, password, and role are required" });
  }

  // Role-specific validation
  if (role === "applicant" && !id_no) {
    return res.status(400).json({ error: "ID No. is required for applicants" });
  }
  if (role === "admin" && !employee_no) {
    return res.status(400).json({ error: "Employee No. is required for admins" });
  }

  try {
    // Check for duplicate email
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into users table
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, id_no, employee_no)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, id_no, employee_no`,
      [name, email, hashedPassword, role, id_no || null, employee_no || null]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("Registration error:", err);
    if (err.code === "23505") { // unique violation
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Server error during registration" });
  }
});

// ---------------- LOGIN ----------------
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Check if user exists
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = result.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,   // frontend will store this
      role: user.role
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- START SERVER ----------------
app.listen(5000, () => {
  console.log("✅ Server running on http://localhost:5000");
});
