const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  type: { type: String, enum: ['image', 'video'], required: true },
  url: { type: String, required: true },
  name: { type: String },
}, { _id: false });

const commentSchema = new mongoose.Schema({
  author: { type: String, default: 'Anonymous' },
  content: { type: String, required: true },
  time: { type: String },
  avatar: { type: String },
}, { _id: false });

const reactionSchema = new mongoose.Schema({
  like: { type: Number, default: 0 },
  love: { type: Number, default: 0 },
  wow: { type: Number, default: 0 },
}, { _id: false });

const reactionUsersSchema = new mongoose.Schema({
  like: [{ type: String }],
  love: [{ type: String }],
  wow: [{ type: String }]
}, { _id: false });

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  author: { type: String, default: 'Admin' },
  authorAvatar: { type: String, default: '' },
  image: { type: String, default: '' },
  media: [mediaSchema],
  featured: { type: Boolean, default: false },
  likes: { type: Number, default: 0 },
  reactions: reactionSchema,
  reactionUsers: reactionUsersSchema,
  comments: [commentSchema],
});

module.exports = mongoose.model('Blog', blogSchema);
