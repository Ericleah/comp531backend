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

// Headline functions
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

// Email functions
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

// Zipcode functions
async function getZipcode(req, res) {
  const username = req.params.user || req.session.user.username;
  try {
    const profile = await Profile.findOne({ username }, "zipcode").exec();
    if (profile && profile.zipcode) {
      return res.send({ username, zipcode: profile.zipcode });
    }
    res.status(404).send({ error: "User not found" });
  } catch (error) {
    handleError(res, error);
  }
}

async function updateZipcode(req, res) {
  const { zipcode } = req.body;
  const user = req.session.user;

  if (!zipcode) {
    return res.status(400).send({ error: "Zipcode is required" });
  }

  try {
    const updatedProfile = await Profile.findOneAndUpdate(
      { user_id: user._id },
      { $set: { zipcode } },
      { new: true }
    ).exec();

    if (!updatedProfile) {
      return res.status(404).send({ error: "Profile not found" });
    }

    res.status(200).send({ username: user.username, zipcode });
  } catch (error) {
    handleError(res, error, "Error updating zipcode");
  }
}

// Avatar functions
async function getAvatar(req, res) {
  const username = req.params.user || req.session.user.username;
  try {
    const profile = await Profile.findOne({ username }, "avatar").exec();
    if (profile && profile.avatar) {
      return res.status(200).json({ username, avatar: profile.avatar });
    }
    res.status(404).send({ error: "User not found" });
  } catch (error) {
    handleError(res, error, "Error fetching avatar");
  }
}

async function updateAvatar(req, res) {
  const { avatar } = req.body;
  const user = req.session.user;

  if (!avatar) {
    return res.status(400).send({ error: "Avatar URL is required" });
  }

  try {
    const updatedProfile = await Profile.findOneAndUpdate(
      { user_id: user._id },
      { $set: { avatar } },
      { new: true }
    ).exec();

    if (!updatedProfile) {
      return res.status(404).send({ error: "Profile not found" });
    }

    res.status(200).send({ username: user.username, avatar });
  } catch (error) {
    handleError(res, error, "Error updating avatar");
  }
}

// Password function
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

// Routes export
module.exports = (app) => {
  app.get("/headline/:user?", isLoggedIn, getHeadline);
  app.put("/headline", isLoggedIn, updateHeadline);

  app.get("/email/:user?", isLoggedIn, getEmail);
  app.put("/email", isLoggedIn, updateEmail);

  app.get("/zipcode/:user?", isLoggedIn, getZipcode);
  app.put("/zipcode", isLoggedIn, updateZipcode);

  app.get("/avatar/:user?", isLoggedIn, getAvatar);
  app.put("/avatar", isLoggedIn, updateAvatar);

  app.put("/password", isLoggedIn, changePassword);
};
