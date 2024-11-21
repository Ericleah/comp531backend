const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.model("Counter", counterSchema);

const commentSchema = new mongoose.Schema({
  customId: { type: Number, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  body: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

commentSchema.pre("save", async function (next) {
  if (this.isNew) {
    const article = this.parent();
    if (article) {
      const maxId = article.comments.reduce((max, comment) => Math.max(max, comment.customId), 0) || 0;
      this.customId = maxId + 1;
    }
  }
  next();
});

const articleSchema = new mongoose.Schema({
  author: { type: String, required: true },
  text: { type: String, required: true },
  image: { type: String },
  date: { type: Date, default: Date.now },
  comments: [commentSchema],
  customId: { type: Number, unique: true, index: true },
  created: { type: Date, default: Date.now },
});

articleSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "article" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.customId = counter.seq;
  }
  next();
});

const Article = mongoose.model("Article", articleSchema);
const Comment = mongoose.model("Comment", commentSchema);

module.exports = {
  Article,
  Comment,
};
