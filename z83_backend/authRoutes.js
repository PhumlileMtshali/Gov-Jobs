// POST /api/auth/register
console.log("Incoming registration data:", req.body);

router.post("/register", async (req, res) => {
  const { fullname, email, id_no, employee_no, password, role } = req.body;

  try {
    // Check if user exists
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user
    const newUser = await pool.query(
      `INSERT INTO users (fullname, email, id_no, employee_no, password, role) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, fullname, email, role`,
      [fullname, email, id_no, employee_no, hashedPassword, role]
    );

    res.status(201).json({ message: "User registered successfully", user: newUser.rows[0] });

  } catch (err) {
    console.error("Registration error:", err.stack);
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});
