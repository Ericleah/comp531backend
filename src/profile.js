const Profile = require("./model/ProfileSchema");
const User = require("./model/UserSchema");
const { isLoggedIn } = require("./auth");
const bcrypt = require("bcrypt");

const saltRounds = 10;

// Helper function to handle errors
const handleError = (res, error, message = "Internal server error") => {
  console.error(message, error);
  res.status(500).send({ error: message });
};

/**
 * @swagger
 * /headline/{user}:
 *   get:
 *     summary: Get the headline for a user
 *     description: Retrieve the headline of a user by username. If no username is provided, get the logged-in user's headline.
 *     parameters:
 *       - name: user
 *         in: path
 *         required: false
 *         schema:
 *           type: string
 *         description: Username of the user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Headline retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 headline:
 *                   type: string
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
async function getHeadline(req, res) {
  const username = req.params.user || req.session.user.username;
  try {
    const user = await Profile.findOne({ username }, "headline").exec();
    if (user) {
      return res.send({ username, headline: user.headline });
    }
    res.status(404).send({ error: "User not found" });
  } catch (error) {
    handleError(res, error);
  }
}

/**
 * @swagger
 * /headline:
 *   put:
 *     summary: Update the logged-in user's headline
 *     description: Update the headline for the logged-in user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               headline:
 *                 type: string
 *             required:
 *               - headline
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Headline updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 headline:
 *                   type: string
 *       400:
 *         description: Headline is required
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Internal server error
 */
async function updateHeadline(req, res) {
  const { headline } = req.body;
  const user = req.session.user;

  if (!headline) {
    return res.status(400).send({ error: "Headline is required" });
  }

  try {
    const updatedProfile = await Profile.findOneAndUpdate(
      { user_id: user._id },
      { $set: { headline } },
      { new: true }
    ).exec();

    if (!updatedProfile) {
      return res.status(404).send({ error: "Profile not found" });
    }

    req.session.user.headline = headline;
    res.status(200).send({ username: user.username, headline });
  } catch (error) {
    handleError(res, error, "Error updating headline");
  }
}

/**
 * @swagger
 * /email/{user}:
 *   get:
 *     summary: Get the email for a user
 *     description: Retrieve the email of a user by username. If no username is provided, get the logged-in user's email.
 *     parameters:
 *       - name: user
 *         in: path
 *         required: false
 *         schema:
 *           type: string
 *         description: Username of the user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Email retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
async function getEmail(req, res) {
  const username = req.params.user || req.session.user.username;
  try {
    const profile = await Profile.findOne({ username }, "email").exec();
    if (profile && profile.email) {
      return res.send({ username, email: profile.email });
    }
    res.status(404).send({ error: "User not found" });
  } catch (error) {
    handleError(res, error);
  }
}

/**
 * @swagger
 * /email:
 *   put:
 *     summary: Update the logged-in user's email
 *     description: Update the email for the logged-in user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *             required:
 *               - email
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Email updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *       400:
 *         description: Email is required
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Internal server error
 */
async function updateEmail(req, res) {
  const { email } = req.body;
  const user = req.session.user;

  if (!email) {
    return res.status(400).send({ error: "Email is required" });
  }

  try {
    const updatedProfile = await Profile.findOneAndUpdate(
      { user_id: user._id },
      { $set: { email } },
      { new: true }
    ).exec();

    if (!updatedProfile) {
      return res.status(404).send({ error: "Profile not found" });
    }

    res.status(200).send({ username: user.username, email });
  } catch (error) {
    handleError(res, error, "Error updating email");
  }
}

/**
 * @swagger
 * /password:
 *   put:
 *     summary: Change the logged-in user's password
 *     description: Update the password for the logged-in user. The new password will be hashed and stored securely.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *             required:
 *               - password
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *       400:
 *         description: New password is required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
async function changePassword(req, res) {
  const { password } = req.body;
  const user = req.session.user;

  if (!password) {
    return res.status(400).send({ error: "New password is required" });
  }

  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);

    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { $set: { password: hash } },
      { new: true }
    ).exec();

    if (!updatedUser) {
      return res.status(404).send({ error: "User not found" });
    }

    res.status(200).send({ result: "Password updated successfully" });
  } catch (error) {
    handleError(res, error, "Error changing password");
  }
}

// Export routes
module.exports = (app) => {
  app.get("/headline/:user?", isLoggedIn, getHeadline);
  app.put("/headline", isLoggedIn, updateHeadline);

  app.get("/email/:user?", isLoggedIn, getEmail);
  app.put("/email", isLoggedIn, updateEmail);

  app.put("/password", isLoggedIn, changePassword);
};
