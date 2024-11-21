const User = require("./model/UserSchema");
const { isLoggedIn } = require("./auth");

// Fetch the list of users a user is following
async function getFollowing(req, res) {
  const username = req.params.user || req.session.user.username;

  try {
    const user = await User.findOne({ username }).populate("following", "username").exec();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const followingUsernames = user.following.map((user) => user.username);
    res.status(200).json({ username, following: followingUsernames });
  } catch (error) {
    console.error("Error fetching following list:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Add a user to the following list
async function addToFollowing(req, res) {
  const usernameToFollow = req.params.user;
  const loggedInUser = req.session.user;

  if (!usernameToFollow) {
    return res.status(400).json({ error: "Username to follow is required" });
  }

  try {
    const userToFollow = await User.findOne({ username: usernameToFollow }).exec();

    if (!userToFollow) {
      return res.status(404).json({ error: "User to follow not found" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: loggedInUser._id, following: { $ne: userToFollow._id } },
      { $addToSet: { following: userToFollow._id } },
      { new: true }
    ).populate("following", "username");

    if (!updatedUser) {
      return res.status(404).json({ error: "Logged in user not found" });
    }

    const updatedFollowingUsernames = updatedUser.following.map((user) => user.username);
    res.status(200).json({
      username: loggedInUser.username,
      following: updatedFollowingUsernames,
    });
  } catch (error) {
    console.error("Error adding to following list:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Remove a user from the following list
async function removeFromFollowing(req, res) {
  const loggedInUserId = req.session.user._id;
  const usernameToUnfollow = req.params.user;

  if (!usernameToUnfollow) {
    return res.status(400).json({ error: "Username to unfollow is required" });
  }

  try {
    const loggedInUser = await User.findById(loggedInUserId).exec();
    const userToUnfollow = await User.findOne({ username: usernameToUnfollow }, "_id").exec();

    if (!userToUnfollow) {
      return res.status(404).json({ error: "User to unfollow not found" });
    }

    if (!loggedInUser.following.includes(userToUnfollow._id)) {
      return res.status(400).json({ error: "You are not following this user" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      loggedInUserId,
      { $pull: { following: userToUnfollow._id } },
      { new: true }
    ).exec();

    if (!updatedUser) {
      return res.status(404).json({ error: "Logged in user not found" });
    }

    const updatedFollowing = updatedUser.following.map((id) => id.toString());
    res.status(200).json({
      username: req.session.user.username,
      following: updatedFollowing,
    });
  } catch (error) {
    console.error("Error removing from following list:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Route definitions
module.exports = (app) => {
  app.get("/following/:user?", isLoggedIn, getFollowing);
  app.put("/following/:user", isLoggedIn, addToFollowing);
  app.delete("/following/:user", isLoggedIn, removeFromFollowing);
};
