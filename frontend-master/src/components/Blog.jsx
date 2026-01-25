"use client"

import { useEffect, useState } from "react"
import "./Blog.css"
import {
  FiBell,
  FiSearch,
  FiMoreHorizontal,
  FiBookmark,
  FiShare2,
  FiHeart,
  FiMessageCircle,
  FiThumbsUp,
  FiSmile,
  FiImage,
  FiVideo,
  FiSend,
  FiX,
} from "react-icons/fi"
import { MdAdd, MdClose } from "react-icons/md"

const Blog = () => {
  const [blogs, setBlogs] = useState([])
  const [activeTab, setActiveTab] = useState("forYou")
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMedia, setSelectedMedia] = useState([])
  const [showComments, setShowComments] = useState({})
  const [newComment, setNewComment] = useState({})
  const [showShareModal, setShowShareModal] = useState(null)

  // Mock data with enhanced features
  // useEffect(() => {
  //   const mockBlogs = [
  //     {
  //       _id: "1",
  //       title: "The Future of Smart Farming Technology",
  //       content:
  //         "Smart farming is revolutionizing agriculture with IoT sensors, AI-driven analytics, and automated systems. This comprehensive guide explores how technology is transforming traditional farming practices and creating more sustainable, efficient agricultural operations.",
  //       author: "John Smith",
  //       authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
  //       likes: 42,
  //       reactions: { like: 25, love: 12, wow: 5 },
  //       comments: [
  //         {
  //           id: 1,
  //           author: "Alice Johnson",
  //           content: "Great insights on smart farming!",
  //           time: "2h ago",
  //           avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
  //         },
  //         {
  //           id: 2,
  //           author: "Bob Wilson",
  //           content: "This is exactly what we need in modern agriculture.",
  //           time: "4h ago",
  //           avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
  //         },
  //       ],
  //       image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400",
  //       featured: true,
  //       createdAt: "2024-01-15",
  //       readTime: "5 min read",
  //       media: [],
  //     },
  //     {
  //       _id: "2",
  //       title: "Sustainable Agriculture Practices for Modern Farmers",
  //       content:
  //         "Discover the latest sustainable farming techniques that are helping farmers reduce environmental impact while maintaining productivity. From crop rotation to precision agriculture, learn how to implement eco-friendly practices on your farm.",
  //       author: "Sarah Johnson",
  //       authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
  //       likes: 28,
  //       reactions: { like: 18, love: 8, wow: 2 },
  //       comments: [
  //         {
  //           id: 1,
  //           author: "Mike Chen",
  //           content: "Sustainability is the future!",
  //           time: "1h ago",
  //           avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
  //         },
  //       ],
  //       image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400",
  //       featured: false,
  //       createdAt: "2024-01-14",
  //       readTime: "7 min read",
  //       media: [{ type: "video", url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4" }],
  //     },
  //   ]
  //   setBlogs(mockBlogs)
  // }, [])

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/blogs/all");
        const data = await response.json(); // ✅ must come BEFORE you use it
        console.log("✅ Blogs fetched:", data);
        setBlogs(data); // ✅ this uses `data`
      } catch (error) {
        console.error("❌ Error fetching blogs:", error);
      }
    };

    fetchBlogs();
  }, []);



  const handleTabClick = (tab) => {
    setActiveTab(tab)
  }

  const handleCreateClick = () => {
    setIsEditing(true)
    setTitle("")
    setContent("")
    setSelectedMedia([])
  }

  // const handleSave = () => {
  //   const newBlog = {
  //     _id: Date.now().toString(),
  //     title,
  //     content,
  //     author: "Current User",
  //     authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
  //     likes: 0,
  //     reactions: { like: 0, love: 0, wow: 0 },
  //     comments: [],
  //     image:
  //       selectedMedia.find((m) => m.type === "image")?.url ||
  //       "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400",
  //     featured: false,
  //     createdAt: new Date().toISOString().split("T")[0],
  //     readTime: "3 min read",
  //     media: selectedMedia,
  //   }

  //   setBlogs([newBlog, ...blogs])
  //   setIsEditing(false)
  // }
  const handleSave = async () => {
    const token = localStorage.getItem("token");

    try {
      const newBlog = {
        title,
        content,
        image: selectedMedia.find((m) => m.type === "image")?.url || "",
        media: selectedMedia,
        featured: false,
      };

      const response = await fetch("/api/blogs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newBlog),
      });

      const responseText = await response.text();

     
      if (!response.ok) {
        console.error("❌ Server responded with error:", responseText);
        throw new Error("Failed to save blog");
      }

      const data = JSON.parse(responseText); // ⬅️ manual parse
      
      setBlogs([data.blog, ...blogs]);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving blog:", error);
    }
  };





  const handleReaction = async (blogId, reactionType) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`http://localhost:5000/api/blogs/${blogId}/react`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reactionType }),
      });

      if (!response.ok) throw new Error("Failed to react");

      const data = await response.json();
      setBlogs(blogs.map(blog => blog._id === blogId ? data.blog : blog));
    } catch (error) {
      console.error("Error reacting to blog:", error);
    }
  };



  const handleComment = async (blogId) => {
    const token = localStorage.getItem("token");
    const commentText = newComment[blogId]?.trim();
    if (!commentText) return;

    try {
      const response = await fetch(`http://localhost:5000/api/blogs/${blogId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: commentText }),
      });

      if (!response.ok) throw new Error("Failed to add comment");

      const data = await response.json();

      setBlogs(blogs.map((blog) => (blog._id === blogId ? data.blog : blog)));
      setNewComment({ ...newComment, [blogId]: "" });
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };



  const handleMediaUpload = (type) => {
    // Simulate file upload
    const mockMedia = {
      id: Date.now(),
      type: type,
      url:
        type === "image"
          ? "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400"
          : "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
      name: `${type}_${Date.now()}`,
    }
    setSelectedMedia([...selectedMedia, mockMedia])
  }

  const removeMedia = (mediaId) => {
    setSelectedMedia(selectedMedia.filter((m) => m.id !== mediaId))
  }

  const handleShare = (blog, platform) => {
    const url = `${window.location.origin}/blog/${blog._id}`
    const text = `Check out this amazing blog: ${blog.title}`

    switch (platform) {
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`)
        break
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)
        break
      case "linkedin":
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`)
        break
      case "copy":
        navigator.clipboard.writeText(url)
        alert("Link copied to clipboard!")
        break
    }
    setShowShareModal(null)
  }

  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch =
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.author.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "forYou") return matchesSearch
    if (activeTab === "featured") return matchesSearch && blog.featured
    return matchesSearch
  })

  if (isEditing) {
    return (
      <div className="editor-page">
        <div className="editor-nav">
          <h1 className="product-name">Write Your Story</h1>
          <div className="editor-actions">
            <button className="cancel-btn" onClick={() => setIsEditing(false)}>
              <FiX /> Cancel
            </button>
            <button className="publish-btn" onClick={handleSave}>
              <FiSend /> Publish
            </button>
          </div>
        </div>

        <div className="editor-container">
          <input
            type="text"
            className="editor-title"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="media-toolbar">
            <button className="media-btn" onClick={() => handleMediaUpload("image")}>
              <FiImage /> Add Image
            </button>
            <button className="media-btn" onClick={() => handleMediaUpload("video")}>
              <FiVideo /> Add Video
            </button>
          </div>

          {selectedMedia.length > 0 && (
            <div className="media-preview">
              {selectedMedia.map((media) => (
                <div key={media.id} className="media-item">
                  {media.type === "image" ? (
                    <img src={media.url || "/placeholder.svg"} alt="Preview" className="preview-image" />
                  ) : (
                    <video src={media.url} controls className="preview-video" />
                  )}
                  <button className="remove-media" onClick={() => removeMedia(media.id)}>
                    <MdClose />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            className="editor-content"
            placeholder="Tell your story..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="blog-page">
      {/* Top Navigation Bar */}
      <div className="top-nav">
        <h1 className="product-name"> Maati ai feeds</h1>
        <div className="search-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            className="search-bar"
            placeholder="Search stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="top-icons">
          <button className="create-btn" onClick={handleCreateClick}>
            <MdAdd size={20} /> Write
          </button>
          <FiBell size={24} className="bell-icon" />
          <div className="user-avatar">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" alt="User" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs">
        <span className={`tab ${activeTab === "forYou" ? "active" : ""}`} onClick={() => handleTabClick("forYou")}>
          For You
        </span>
        <span className={`tab ${activeTab === "featured" ? "active" : ""}`} onClick={() => handleTabClick("featured")}>
          Featured
        </span>
      </div>

      {/* Blog Cards */}
      <div className="blog-container">
        <div className="blog-list">
          {filteredBlogs.map((blog) => (
            <div className="blog-entry" key={blog._id}>
              {/* Author Info */}
              <div className="author-info">
                <img src={blog.authorAvatar || "/placeholder.svg"} alt={blog.author} className="author-avatar" />
                <div className="author-details">
                  <span className="author-name">{blog.author}</span>
                  <span className="blog-meta-info">
                    {blog.createdAt} · {blog.readTime}
                    {blog.featured && <span className="featured-badge">Featured</span>}
                  </span>
                </div>
                <div className="blog-actions">
                  <button className="action-btn">
                    <FiBookmark />
                  </button>
                  <button className="action-btn" onClick={() => setShowShareModal(blog._id)}>
                    <FiShare2 />
                  </button>
                  <button className="action-btn">
                    <FiMoreHorizontal />
                  </button>
                </div>
              </div>

              <div className="blog-content">
                <div className="blog-text">
                  <h2 className="blog-title">{blog.title}</h2>
                  <p className="blog-description">
                    {blog.content.length > 150 ? blog.content.slice(0, 150) + "..." : blog.content}
                  </p>
                </div>
                {blog.image && (
                  <div className="blog-image-wrapper">
                    <img src={blog.image || "/placeholder.svg"} alt="Blog Visual" className="blog-image-preview" />
                  </div>
                )}
              </div>

              {/* Media Content */}
              {blog.media && blog.media.length > 0 && (
                <div className="blog-media">
                  {blog.media.map((media, index) => (
                    <div key={index} className="media-content">
                      {media.type === "video" && <video src={media.url} controls className="blog-video" />}
                    </div>
                  ))}
                </div>
              )}

              {/* Reactions Bar */}
              <div className="reactions-bar">
                <div className="reactions-left">
                  <button className="reaction-btn" onClick={() => handleReaction(blog._id, "like")}>
                    <FiHeart className="reaction-icon" />
                    <span>{blog.reactions?.like || 0}</span>
                  </button>
                  <button className="reaction-btn" onClick={() => handleReaction(blog._id, "love")}>
                    <FiThumbsUp className="reaction-icon" />
                    <span>{blog.reactions?.love || 0}</span>
                  </button>
                  <button className="reaction-btn" onClick={() => handleReaction(blog._id, "wow")}>
                    <FiSmile className="reaction-icon" />
                    <span>{blog.reactions?.wow || 0}</span>
                  </button>
                  <button
                    className="reaction-btn"
                    onClick={() => setShowComments({ ...showComments, [blog._id]: !showComments[blog._id] })}
                  >
                    <FiMessageCircle className="reaction-icon" />
                    <span>{blog.comments?.length}</span>
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {showComments[blog._id] && (
                <div className="comments-section">
                  <div className="comments-list">
                    {blog.comments.map((comment) => (
                      <div key={comment.id} className="comment">
                        <img
                          src={comment.avatar || "/placeholder.svg"}
                          alt={comment.author}
                          className="comment-avatar"
                        />
                        <div className="comment-content">
                          <div className="comment-header">
                            <span className="comment-author">{comment.author}</span>
                            <span className="comment-time">{comment.time}</span>
                          </div>
                          <p className="comment-text">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="comment-input-section">
                    <img
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
                      alt="You"
                      className="comment-avatar"
                    />
                    <div className="comment-input-wrapper">
                      <input
                        type="text"
                        className="comment-input"
                        placeholder="Write a comment..."
                        value={newComment[blog._id] || ""}
                        onChange={(e) => setNewComment({ ...newComment, [blog._id]: e.target.value })}
                        onKeyPress={(e) => e.key === "Enter" && handleComment(blog._id)}
                      />
                      <button className="comment-send-btn" onClick={() => handleComment(blog._id)}>
                        <FiSend />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Share Modal */}
              {showShareModal === blog._id && (
                <div className="share-modal-overlay" onClick={() => setShowShareModal(null)}>
                  <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="share-header">
                      <h3>Share this story</h3>
                      <button onClick={() => setShowShareModal(null)}>
                        <FiX />
                      </button>
                    </div>
                    <div className="share-options">
                      <button onClick={() => handleShare(blog, "twitter")} className="share-option twitter">
                        Twitter
                      </button>
                      <button onClick={() => handleShare(blog, "facebook")} className="share-option facebook">
                        Facebook
                      </button>
                      <button onClick={() => handleShare(blog, "linkedin")} className="share-option linkedin">
                        LinkedIn
                      </button>
                      <button onClick={() => handleShare(blog, "copy")} className="share-option copy">
                        Copy Link
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-section">
            <h3>Trending Topics</h3>
            <div className="trending-topics">
              {["Smart Farming", "Sustainable Agriculture", "AI in Farming", "Crop Management", "IoT Sensors"].map(
                (topic) => (
                  <span key={topic} className="topic-tag">
                    {topic}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Recommended Authors</h3>
            <div className="recommended-authors">
              {[
                { name: "John Smith", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150" },
                { name: "Sarah Johnson", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
                { name: "Mike Chen", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" },
              ].map((author) => (
                <div key={author.name} className="author-recommendation">
                  <img src={author.avatar || "/placeholder.svg"} alt={author.name} className="rec-author-avatar" />
                  <span className="rec-author-name">{author.name}</span>
                  <button className="follow-btn">Follow</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Blog
