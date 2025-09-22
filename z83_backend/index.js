const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");

const app = express();

// ---------------- LOGGER ----------------
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ---------------- MIDDLEWARE ----------------
// Updated CORS to be more permissive for development
app.use(cors({ origin: "http://127.0.0.1:5500", credentials: true }));
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// ---------------- DATABASE CONNECTION ----------------
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "z83_project",
  password: "newpassword",
  port: 5432,
});

pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ PostgreSQL connection error:", err));

// ---------------- JWT SECRET ----------------
const JWT_SECRET = "supersecretkey";

// ---------------- AUTHENTICATION MIDDLEWARE ----------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <TOKEN>"

  if (token == null) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error("JWT Verify Error:", err);
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user; // { id: user.id, email: user.email, role: user.role }
    next();
  });
};

// ---------------- FILE UPLOAD ----------------
// Configure storage (files saved in /uploads folder)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

// Initialize multer instance
const upload = multer({ storage });


// ---------------- REGISTER ----------------
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, role, id_no, employee_no } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ error: "Required fields missing" });

  if (role === "applicant" && !id_no) return res.status(400).json({ error: "ID No. required" });
  if (role === "admin" && !employee_no) return res.status(400).json({ error: "Employee No. required" });

  try {
    const existing = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, id_no, employee_no)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, name, email, role, id_no, employee_no`,
      [name, email, hashedPassword, role, id_no || null, employee_no || null]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// ---------------- LOGIN ----------------
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (result.rows.length === 0) return res.status(400).json({ message: "User not found" });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login successful", token, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- SAVE PROFILE ----------------
// Updated to use authenticateToken middleware
app.post("/save-profile", authenticateToken, upload.array("supporting_docs"), async (req, res) => {
  try {
    const data = req.body;
    // Use user ID from the verified token, NOT from the body
    const userId = req.user.id;
    if (!userId) return res.status(400).json({ success: false, message: "User ID missing" });

    const insertProfileQuery = `INSERT INTO profiles (user_id, full_name, dob, id_number, passport)
                                VALUES ($1,$2,$3,$4,$5) RETURNING id`;
    const profileValues = [userId, data.full_name, data.dob, data.id_number, data.passport];
    const profileResult = await pool.query(insertProfileQuery, profileValues);
    const profileId = profileResult.rows[0].id;

    if (req.files) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const docType = data[`doc_types[${i}]`] || "other";
        await pool.query(
          "INSERT INTO profile_docs (profile_id, file_name, file_path, doc_type) VALUES ($1,$2,$3,$4)",
          [profileId, file.originalname, file.path, docType]
        );
      }
    }

    res.json({ success: true, message: "Profile saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET user profile
app.get("/get-profile/:id", authenticateToken, async (req, res) => {
  const userId = Number(req.params.id);
  if (!userId) {
    return res.status(400).json({ success: false, message: "Invalid user ID" });
  }

  try {
    const query = "SELECT * FROM profiles WHERE user_id = $1";
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      // ✅ Profile does not exist
      return res.json({ success: true, profile: null });
    }

    // Profile exists
    res.json({ success: true, profile: result.rows[0] });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ success: false, message: "Server error fetching profile" });
  }
});


// ---------------- JOB ROUTES ----------------
app.get("/api/jobs", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, title, description, location, posted_at, closing_date, department, reference
      FROM jobs
      ORDER BY posted_at DESC
    `);

    // Ensure JSON is returned
    res.setHeader("Content-Type", "application/json");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching jobs:", err);
    res.status(500).json({ error: "Server error fetching jobs" });
  }
});

// ---------------- NOTIFICATIONS ----------------
// Updated to use authenticateToken middleware
app.get("/api/notifications/:userId", authenticateToken, async (req, res) => {
  const { userId } = req.params;
  // Add authorization check: a user can only see their own notifications
  const requestedUserId = parseInt(userId, 10);
  if (req.user.id !== requestedUserId) {
    return res.status(403).json({ error: "Not authorized to view these notifications." });
  }

  try {
    const result = await pool.query(
      `SELECT id, user_id, message, created_at
       FROM notifications
       WHERE user_id=$1
       ORDER BY created_at DESC`,
      [userId]
    );

    // Ensure JSON is returned
    res.setHeader("Content-Type", "application/json");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching notifications:", err);
    res.status(500).json({ error: "Server error fetching notifications" });
  }
});

// ---------------- ROOT ROUTE ----------------
app.get("/", (req, res) => {
  res.json({ status: "✅ API running", endpoints: ["/api/jobs", "/api/notifications/:userId"] });
});


// ---------------- APPLICATIONS ----------------
// Updated to use authenticateToken middleware
app.post("/api/applications", authenticateToken, async (req, res) => {
  try {
    // Get user_id from the token, not the body
    const user_id = req.user.id;
    const job_id = parseInt(req.body.job_id, 10);
    if (!job_id) return res.status(400).json({ error: "Job ID required" });

    const existing = await pool.query(
      "SELECT id FROM applications WHERE user_id=$1 AND job_id=$2",
      [user_id, job_id]
    );
    if (existing.rows.length > 0) return res.status(400).json({ error: "Already applied" });

    const result = await pool.query(
      "INSERT INTO applications (user_id, job_id, status, applied_at) VALUES ($1,$2,'Pending',NOW()) RETURNING *",
      [user_id, job_id]
    );

    await pool.query(
      "INSERT INTO notifications (user_id, message) VALUES ($1,$2)",
      [user_id, `You successfully applied for job ID ${job_id}`]
    );

    res.json({ message: "Application submitted successfully!", application: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while applying for job." });
  }
});

// Get user applications
// Updated to use authenticateToken middleware
app.get("/api/applications/:userId", authenticateToken, async (req, res) => {
  try {
    // Add authorization check: a user can only see their own applications
    const requestedUserId = parseInt(req.params.userId, 10);
    if (req.user.id !== requestedUserId) {
      return res.status(403).json({ error: "Not authorized to view these applications." });
    }

    const result = await pool.query(
      `SELECT a.id, j.title, j.department, j.location, a.status, a.applied_at
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.user_id=$1
       ORDER BY a.applied_at DESC`,
      [requestedUserId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while fetching applications." });
  }
});

// Cancel application
// Updated to use authenticateToken middleware
app.delete("/api/applications/:appId", authenticateToken, async (req, res) => {
  try {
    const { appId } = req.params;
    // Optional: Add a check to ensure a user can only delete their own applications
    const result = await pool.query("DELETE FROM applications WHERE id=$1 RETURNING *", [appId]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Application not found." });
    res.json({ message: "Application cancelled successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while cancelling application." });
  }
});

// ---------------- START SERVER ----------------
app.listen(5000, () => {
  console.log("✅ Server running on http://localhost:5000");
});