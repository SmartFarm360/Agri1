const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const authMiddleware = require('../middleware/authMiddleware');
const { ensureMongoConnection } = require('../config/mongo');

router.use(ensureMongoConnection);

// Middleware to check if user is admin
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
};

// Create Blog (Admin only)
// Create Blog (Authenticated Users)
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { title, content, image, media, featured } = req.body;

        const newBlog = new Blog({
            title,
            content,
            author: req.user.name || 'Anonymous', // Pull author name from token/session
            authorAvatar: req.user.avatar || '',  // Optional avatar if stored
            image,
            media,
            featured: !!featured,
        });

        await newBlog.save();

        res.status(201).json({ message: 'Blog created successfully', blog: newBlog });
    } catch (error) {
        res.status(500).json({ message: 'Error creating blog', error: error.message });
    }
});


// Get All Blogs (Public)
// Get All Blogs with optional search and filtering
router.get('/all', async (req, res) => {
    try {
        const { search, featured } = req.query;

        const query = {};

        if (search) {
            const searchRegex = new RegExp(search, 'i'); // case-insensitive
            query.$or = [
                { title: searchRegex },
                { content: searchRegex },
                { author: searchRegex }
            ];
        }

        if (featured === 'true') {
            query.featured = true;
        }

        const blogs = await Blog.find(query).sort({ createdAt: -1 });
        res.status(200).json(blogs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching blogs', error: error.message });
    }
});

// Delete Blog by ID (Admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const blogId = req.params.id;

        const deletedBlog = await Blog.findByIdAndDelete(blogId);

        if (!deletedBlog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting blog', error: error.message });
    }
});

// Update Blog by ID (Admin only)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const blogId = req.params.id;
        const { title, content } = req.body;

        const updatedBlog = await Blog.findByIdAndUpdate(
            blogId,
            { title, content },
            { new: true } // Return the updated document
        );

        if (!updatedBlog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        res.status(200).json({ message: 'Blog updated successfully', blog: updatedBlog });
    } catch (error) {
        res.status(500).json({ message: 'Error updating blog', error: error.message });
    }
});


// Add Reaction to Blog (any user)
router.put('/:id/react', authMiddleware, async (req, res) => {
  try {
    const { reactionType } = req.body;
    const blogId = req.params.id;
    const userId = req.user.user_id;

    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    blog.reactions = blog.reactions || {};
    blog.reactionUsers = blog.reactionUsers || {
      like: [],
      love: [],
      wow: [],
    };

    const userReacted = blog.reactionUsers[reactionType]?.includes(userId);

    if (userReacted) {
      // User already reacted, so unlike
      blog.reactions[reactionType] = Math.max((blog.reactions[reactionType] || 1) - 1, 0);
      blog.reactionUsers[reactionType] = blog.reactionUsers[reactionType].filter((id) => id !== userId);
    } else {
      // User adds reaction
      blog.reactions[reactionType] = (blog.reactions[reactionType] || 0) + 1;
      blog.reactionUsers[reactionType].push(userId);
    }

    await blog.save();
    res.status(200).json({ message: 'Reaction updated', blog });

  } catch (error) {
    res.status(500).json({ message: 'Error reacting to blog', error: error.message });
  }
});



// Add Comment to Blog
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const blogId = req.params.id;
    const { content } = req.body;

    const comment = {
      author: req.user.name || 'Anonymous',
      content,
      time: new Date().toLocaleString(),
      avatar: req.user.avatar || '',
    };

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    blog.comments.push(comment);
    await blog.save();

    res.status(200).json({ message: 'Comment added', blog });
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
});


module.exports = router;
