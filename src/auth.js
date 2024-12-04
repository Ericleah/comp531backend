const User = require("./model/UserSchema");
const Profile = require("./model/ProfileSchema");
const bcrypt = require("bcrypt");
const saltRounds = 10;

/**
 * Middleware: Check if the user is logged in by verifying session.
 */
function isLoggedIn(req, res, next) {
  const user = req.session.user;
  if (!user) {
    return res.sendStatus(401); // Unauthorized
  }
  next();
}

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Authenticate user and set session
 *     description: Verify username and password, and establish a session for the user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - username
 *               - password
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 result:
 *                   type: string
 *       400:
 *         description: Missing username or password
 *       401:
 *         description: Invalid username or password
 *       500:
 *         description: Internal server error
 */
async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send({ error: "Username and password are required" });
  }

  try {
    const user = await User.findOne({ username }).exec();
    if (!user) {
      return res.status(401).send({ error: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (match) {
      req.session.user = { username: user.username, _id: user._id };
      res.send({ username: user.username, result: "success" });
    } else {
      res.status(401).send({ error: "Invalid password" });
    }
  } catch (error) {
    console.error("Error during authentication:", error);
    res.status(500).send({ error: "Internal server error" });
  }
}

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Create a new user and profile with hashed password
 *     description: Register a new user, hash their password, and store user and profile information.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *               dob:
 *                 type: string
 *               phone:
 *                 type: string
 *               zipcode:
 *                 type: string
 *             required:
 *               - username
 *               - password
 *               - email
 *               - dob
 *               - phone
 *               - zipcode
 *     responses:
 *       200:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 result:
 *                   type: string
 *       400:
 *         description: Missing required fields or username already exists
 *       500:
 *         description: Internal server error
 */
async function register(req, res) {
  const { username, password, email, dob, phone, zipcode } = req.body;

  if (!username || !password || !email || !dob || !phone || !zipcode) {
    return res.status(400).send({ error: "Fill out all required information" });
  }

  try {
    const existingUser = await User.findOne({ username }).exec();
    if (existingUser) {
      return res.status(400).send({ error: "Username already exists" });
    }

    const hash = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      username,
      password: hash,
    });

    await newUser.save();

    const newProfile = new Profile({
      user_id: newUser._id,
      username,
      email,
      dob,
      phone,
      zipcode,
      password: hash,
    });

    await newProfile.save();

    res.send({ username, result: "success" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).send({ error: "Internal server error" });
  }
}

/**
 * @swagger
 * /logout:
 *   put:
 *     summary: Log out the user by clearing the session
 *     description: Destroy the user's session and clear the session cookie.
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *       401:
 *         description: User is not logged in
 *       500:
 *         description: Internal server error
 */
function logout(req, res) {
  if (req.session.user) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).send({ error: "Internal server error" });
      }
      res.clearCookie("connect.sid", { httpOnly: true });
      res.send({ result: "success" });
    });
  } else {
    res.status(401).send({ error: "You are not logged in" });
  }
}

/**
 * Define authentication routes and apply middleware.
 */
module.exports = {
  AuthRoutes: (app) => {
    const openPaths = ["/", "/login", "/register", "/logout"];

    app.use((req, res, next) => {
      if (!openPaths.includes(req.path)) {
        return isLoggedIn(req, res, next);
      }
      next();
    });

    app.post("/login", login);
    app.post("/register", register);
    app.put("/logout", logout);
  },
  isLoggedIn,
};
