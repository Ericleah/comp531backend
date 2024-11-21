const { isLoggedIn } = require("./auth");
const mongoose = require("mongoose");
const { Article, Comment } = require("./model/ArticleSchema");
const User = require("./model/UserSchema");

// Helper function to find author ID by username
async function findAuthorIdByUsername(authorUsername) {
  try {
    const author = await User.findOne({ username: authorUsername }).exec();
    return author ? author._id : null;
  } catch (error) {
    console.error("Error finding author by username:", error);
    return null;
  }
}

// Create a new article
async function createArticle(req, res) {
  const { text } = req.body;
  const loggedInUser = req.session.user.username;
  const image = req.file ? req.file.path : null;

  if (!text) {
    return res.status(400).send({ error: "Text content is required for the article" });
  }

  try {
    const newArticle = new Article({
      author: loggedInUser,
      text,
      image,
      date: new Date(),
      comments: [],
    });

    const savedArticle = await newArticle.save();

    res.status(201).json({
      articles: [
        {
          id: savedArticle.customId,
          author: savedArticle.author,
          text: savedArticle.text,
          image: savedArticle.image,
          date: savedArticle.date,
          comments: savedArticle.comments,
        },
      ],
    });
  } catch (error) {
    console.error("Error creating new article:", error);
    res.status(500).send({ error: "Internal server error" });
  }
}

// Get articles by ID or username
async function getArticles(req, res) {
  const identifier = req.params.id;
  const loggedInUser = req.session.user.username;

  try {
    let articles;

    if (identifier) {
      articles = isNaN(identifier)
        ? await Article.find({ author: identifier }).exec()
        : await Article.find({ customId: identifier }).exec();
    } else {
      articles = await Article.find({}).exec(); // Customize this for feed logic
    }

    const response = articles.map((article) => ({
      id: article.customId,
      author: article.author,
      text: article.text,
      comments: article.comments,
      date: article.date,
    }));

    res.json({ articles: response });
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).send({ error: "Internal server error" });
  }
}

// Update article or its comments
async function updateArticle(req, res) {
  const { commentId, text } = req.body;
  const articleId = req.params.id;
  const loggedInUserId = req.session.user._id;

  if (!text) {
    return res.status(400).send({ error: "Text content is required" });
  }

  try {
    const article = await Article.findOne({ customId: articleId }).exec();
    if (!article) {
      return res.status(404).send({ error: "Article not found" });
    }

    const authorObjectId = await findAuthorIdByUsername(article.author);
    if (!authorObjectId || !authorObjectId.equals(loggedInUserId)) {
      return res.status(403).send({ error: "Forbidden" });
    }

    if (commentId === undefined) {
      article.text = text;
    } else if (commentId === -1) {
      const newComment = new Comment({ body: text, author: loggedInUserId });
      article.comments.push(newComment);
    } else {
      const comment = article.comments.find((c) => c.customId === commentId);
      if (!comment) {
        return res.status(404).send({ error: "Comment not found" });
      }
      if (!comment.author.equals(loggedInUserId)) {
        return res.status(403).send({ error: "Forbidden" });
      }
      comment.body = text;
    }

    await article.save();
    res.status(200).json(article);
  } catch (error) {
    console.error("Error updating article:", error);
    res.status(500).send({ error: "Internal server error" });
  }
}

// Export routes
module.exports = (app) => {
  app.post("/article", isLoggedIn, createArticle);
  app.get("/articles/:id?", isLoggedIn, getArticles);
  app.put("/articles/:id", isLoggedIn, updateArticle);
};
