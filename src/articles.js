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
/**
 * @swagger
 * /articles:
 *   post:
 *     summary: Create a new article
 *     tags:
 *       - Articles
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: The content of the article
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional image file for the article
 *     responses:
 *       201:
 *         description: Article created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 articles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: The custom ID of the article
 *                       author:
 *                         type: string
 *                         description: The author of the article
 *                       text:
 *                         type: string
 *                         description: The content of the article
 *                       image:
 *                         type: string
 *                         nullable: true
 *                         description: The URL/path of the attached image
 *                       date:
 *                         type: string
 *                         format: date-time
 *                         description: The date when the article was created
 *                       comments:
 *                         type: array
 *                         items:
 *                           type: object
 *                           description: List of comments on the article
 *       400:
 *         description: Bad request, text content is missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Text content is required for the article
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */

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

/**
 * @swagger
 * /articles/{id}:
 *   get:
 *     summary: Get articles by ID or username
 *     description: Fetch articles by their ID, username, or all articles if no parameter is provided.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: false
 *         schema:
 *           type: string
 *         description: ID of the article or username.
 *     responses:
 *       200:
 *         description: Articles fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 articles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       author:
 *                         type: string
 *                       text:
 *                         type: string
 *                       comments:
 *                         type: array
 *                         items:
 *                           type: object
 *                       date:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /articles/{id}:
 *   put:
 *     summary: Update an article or its comments
 *     description: Update an article's text or add/edit a comment.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the article to be updated.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               commentId:
 *                 type: integer
 *                 description: ID of the comment (-1 to add a new comment).
 *               text:
 *                 type: string
 *                 description: The updated text or comment.
 *             required:
 *               - text
 *     responses:
 *       200:
 *         description: Update successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Article or comment not found
 *       500:
 *         description: Internal server error
 */
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
