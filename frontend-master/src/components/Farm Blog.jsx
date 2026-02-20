"use client"

import { useState, useEffect } from "react"
import {
  FiSearch,
  FiHeart,
  FiMessageCircle,
  FiShare2,
  FiBookmark,
  FiX,
  FiArrowLeft,
  FiMapPin,
  FiCalendar,
  FiImage,
  FiVideo,
  FiSend,
  FiMoreHorizontal,
} from "react-icons/fi"
import "./Farm Blog.css"


const FarmerBlog = () => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Dummy data
  const [blogs, setBlogs] = useState([
    {
      id: 1,
      title: "Best Practices for Wheat Cultivation in Monsoon",
      description: "Complete guide on managing wheat crops during monsoon season, including soil preparation, water management, and pest control strategies.",
      content: "Monsoon farming requires special attention to water management and soil health. When the heavy rains arrive, it's crucial to ensure proper drainage in your fields to prevent waterlogging. I've been farming for 15 years and learned that pre-monsoon soil preparation is key. First, create proper ridge and furrow systems. Second, use well-draining soil amendments. Third, maintain organic matter content above 2%. In my experience, farmers who focus on these three aspects see 30-40% better yields during monsoon season. Additionally, monitor pest populations weekly as humidity increases pest activity significantly. Consider using neem-based organic pesticides to maintain sustainability while protecting your crop.",
      author: "Rajesh Kumar",
      role: "Farmer",
      location: "Punjab, India",
      image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600",
      date: "Feb 18, 2024",
      likes: 234,
      comments: 12,
      saves: 45,
      cropType: "Wheat",
      problemType: "Monsoon Management",
      liked: false,
      saved: false,
      reactions: { like: 234, love: 45, wow: 23 },
      commentList: [
        {
          id: 1,
          author: "Priya Singh",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
          text: "Very helpful tips! I'll try the ridge and furrow system this season.",
          date: "2d ago",
        },
        {
          id: 2,
          author: "Anil Patel",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
          text: "The neem-based pesticide recommendation is excellent. Already implemented it.",
          date: "1d ago",
        },
      ],
    },
    {
      id: 2,
      title: "Managing Pest Infestation Without Chemical Fertilizers",
      description: "Organic approach to pest management in vegetable farming with proven natural solutions and prevention techniques.",
      content: "Chemical-free farming is becoming increasingly popular, and for good reason. Not only does it improve soil health long-term, but it also produces healthier vegetables. I switched to organic methods 3 years ago and haven't looked back. The key is understanding pest life cycles. Introducing beneficial insects like ladybugs and lacewings can control harmful pests naturally. I also use companion planting extensively - marigolds repel many insects, and basil keeps mosquitoes away. Neem oil sprays are my go-to for harder infestations. The transition period is challenging, but after 2-3 seasons, the soil becomes self-regulating. Your yields will increase due to improved soil microbial activity.",
      author: "Meera Devi",
      role: "Admin",
      location: "Karnataka, India",
      image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600",
      date: "Feb 17, 2024",
      likes: 189,
      comments: 8,
      saves: 56,
      cropType: "Vegetables",
      problemType: "Pest Issues",
      liked: false,
      saved: false,
      reactions: { like: 189, love: 67, wow: 34 },
      commentList: [
        {
          id: 1,
          author: "Vikram Singh",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
          text: "This is exactly what I needed. Starting organic farming next month!",
          date: "3d ago",
        },
      ],
    },
    {
      id: 3,
      title: "Rice Farming: From Preparation to Harvest",
      description: "Complete lifecycle guide for rice cultivation covering seeds, water management, fertilization, and harvesting techniques.",
      content: "Rice farming is both an art and a science. Success depends on understanding soil types, water availability, and climate patterns. The first step is field preparation - plow and level your land at least 3 weeks before planting. During this time, apply farmyard manure (5-10 tons/hectare) and let the soil settle. Rice requires standing water of 5-10 cm during the growing season. I use drip irrigation with proper water management to save 40% water compared to traditional flooding. For fertilization, split applications work best - 50% at transplanting, 25% at 45 days, and 25% at 60 days. Watch for stem rot and brown spot diseases, especially during high humidity. Harvest when 80% grains turn golden yellow. The timing is critical - harvest too early and you lose yield, too late and you lose quality.",
      author: "Suresh Reddy",
      role: "Farmer",
      location: "Andhra Pradesh, India",
      image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad576?w=600",
      date: "Feb 15, 2024",
      likes: 312,
      comments: 15,
      saves: 78,
      cropType: "Rice",
      problemType: "Cultivation Guide",
      liked: false,
      saved: false,
      reactions: { like: 312, love: 89, wow: 56 },
      commentList: [
        {
          id: 1,
          author: "Ramesh Kumar",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
          text: "Excellent detailed guide. The water management tips are game-changing!",
          date: "5d ago",
        },
      ],
    },
    {
      id: 4,
      title: "Drone Insights: Using Technology for Better Crop Monitoring",
      description: "How agricultural drones revolutionize monitoring and help detect crop issues early for better yield management.",
      content: "Drone technology is transforming agriculture. I started using drones 2 years ago and it has completely changed how I monitor my fields. Drones can capture high-resolution images that reveal crop stress, disease outbreaks, and irrigation problems days before they're visible to the naked eye. The multispectral cameras show plant health through NDVI (Normalized Difference Vegetation Index) analysis. I use this data to make targeted interventions - fertilizing only stressed areas, reducing chemical use and costs. Drone coverage of my 50-hectare farm takes just 2 hours versus spending days in the field manually. The investment pays back in the first season through reduced input costs and better yields. Most importantly, early detection of diseases has saved me from complete crop failures multiple times.",
      author: "Drone Tech Team",
      role: "Drone Controller",
      location: "Maharashtra, India",
      image: "https://images.unsplash.com/photo-1585873123899-d3f5d6b8e2c8?w=600",
      date: "Feb 16, 2024",
      likes: 267,
      comments: 10,
      saves: 92,
      cropType: "Multi-crop",
      problemType: "Drone Insights",
      liked: false,
      saved: false,
      reactions: { like: 267, love: 78, wow: 45 },
      commentList: [
        {
          id: 1,
          author: "Harinder Kaur",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
          text: "Finally understanding drone technology for farming. Considering buying one!",
          date: "4d ago",
        },
      ],
    },
    {
      id: 5,
      title: "Soil Health: The Foundation of Sustainable Farming",
      description: "Understanding soil testing, amendments, and management practices for long-term agricultural sustainability.",
      content: "Healthy soil is the foundation of successful farming. Many farmers focus only on crops but neglect soil health, leading to declining yields over time. I get my soil tested every 2 years to understand nutrient levels, pH, and organic matter content. Based on the report, I amend my soil accordingly - adding lime to acidic soils, sulfur to alkaline soils, and compost to all fields. Organic matter improves water retention, microbial activity, and nutrient availability. I've increased my organic matter from 1.2% to 3.8% in 5 years, and my yields have increased proportionally. Crop rotation is crucial - never plant the same crop in the same field consecutively. Use legumes to fix nitrogen naturally. Avoid tilling excessively as it destroys soil structure. These practices require patience but deliver results that last generations.",
      author: "Dr. Sharma",
      role: "Admin",
      location: "Rajasthan, India",
      image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600",
      date: "Feb 14, 2024",
      likes: 198,
      comments: 7,
      saves: 63,
      cropType: "Multi-crop",
      problemType: "Soil Management",
      liked: false,
      saved: false,
      reactions: { like: 198, love: 54, wow: 31 },
      commentList: [],
    },
  ])

  const [showModal, setShowModal] = useState(false)
  const [selectedBlog, setSelectedBlog] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("All")
  const [newBlogForm, setNewBlogForm] = useState({
    title: "",
    cropType: "",
    problemType: "",
    location: "",
    description: "",
  })
  const [commentText, setCommentText] = useState({})
  const [showComments, setShowComments] = useState({})

  const filters = [
    "All",
    "Rice",
    "Wheat",
    "Vegetables",
    "Fruits",
    "Pest Issues",
    "Fertilizer",
    "Drone Insights",
  ]

  const cropTypes = ["Rice", "Wheat", "Maize", "Vegetables", "Fruits", "Other"]
  const problemTypes = [
    "Pest Issue",
    "Low Yield",
    "Soil Problem",
    "Water Issue",
    "Fertilizer Issue",
    "Disease Detection",
    "Drone Scan Insight",
  ]

  const handleCreateBlog = () => {
    if (
      newBlogForm.title &&
      newBlogForm.cropType &&
      newBlogForm.problemType &&
      newBlogForm.location &&
      newBlogForm.description
    ) {
      const newBlog = {
        id: blogs.length + 1,
        title: newBlogForm.title,
        description: newBlogForm.description,
        content: newBlogForm.description,
        author: "Current User",
        role: "Farmer",
        location: newBlogForm.location,
        image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600",
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        likes: 0,
        comments: 0,
        saves: 0,
        cropType: newBlogForm.cropType,
        problemType: newBlogForm.problemType,
        liked: false,
        saved: false,
        reactions: { like: 0, love: 0, wow: 0 },
        commentList: [],
      }

      setBlogs([newBlog, ...blogs])
      setShowModal(false)
      setNewBlogForm({
        title: "",
        cropType: "",
        problemType: "",
        location: "",
        description: "",
      })
    }
  }

  const handleLike = (blogId) => {
    setBlogs(
      blogs.map((blog) => {
        if (blog.id === blogId) {
          const newLikes = blog.liked ? blog.likes - 1 : blog.likes + 1
          return { ...blog, liked: !blog.liked, likes: newLikes }
        }
        return blog
      })
    )
  }

  const handleSave = (blogId) => {
    setBlogs(
      blogs.map((blog) => {
        if (blog.id === blogId) {
          const newSaves = blog.saved ? blog.saves - 1 : blog.saves + 1
          return { ...blog, saved: !blog.saved, saves: newSaves }
        }
        return blog
      })
    )
  }

  const handleAddComment = (blogId) => {
    const text = commentText[blogId]?.trim()
    if (text) {
      setBlogs(
        blogs.map((blog) => {
          if (blog.id === blogId) {
            const newComment = {
              id: blog.commentList.length + 1,
              author: "You",
              avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
              text: text,
              date: "now",
            }
            return {
              ...blog,
              commentList: [...blog.commentList, newComment],
              comments: blog.comments + 1,
            }
          }
          return blog
        })
      )
      setCommentText({ ...commentText, [blogId]: "" })
    }
  }

  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch =
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.location.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeFilter === "All") return matchesSearch
    return matchesSearch && (blog.cropType === activeFilter || blog.problemType === activeFilter)
  })

  if (!isClient) {
    return <div className="farmer-blog" />
  }

  if (selectedBlog) {
    return (
      <div className="blog-detail-page">
        <div className="detail-header">
          <button className="back-btn" onClick={() => setSelectedBlog(null)}>
            <FiArrowLeft /> Back
          </button>
        </div>

        <div className="detail-container">
          <div className="detail-content">
            <h1 className="detail-title">{selectedBlog.title}</h1>

            <div className="detail-author-section">
              <img src={selectedBlog.image} alt="" className="detail-author-avatar" />
              <div className="detail-author-info">
                <h3>{selectedBlog.author}</h3>
                <div className="author-meta">
                  <span className="role-badge">{selectedBlog.role}</span>
                  <span className="meta-item">
                    <FiMapPin size={14} /> {selectedBlog.location}
                  </span>
                  <span className="meta-item">
                    <FiCalendar size={14} /> {selectedBlog.date}
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-image">
              <img src={selectedBlog.image} alt={selectedBlog.title} />
            </div>

            <div className="detail-actions">
              <button
                className={`action-btn ${selectedBlog.liked ? "active" : ""}`}
                onClick={() => handleLike(selectedBlog.id)}
              >
                <FiHeart /> {selectedBlog.likes}
              </button>
              <button
                className="action-btn"
                onClick={() =>
                  setShowComments({
                    ...showComments,
                    [selectedBlog.id]: !showComments[selectedBlog.id],
                  })
                }
              >
                <FiMessageCircle /> {selectedBlog.comments}
              </button>
              <button className="action-btn">
                <FiShare2 />
              </button>
              <button
                className={`action-btn ${selectedBlog.saved ? "active" : ""}`}
                onClick={() => handleSave(selectedBlog.id)}
              >
                <FiBookmark /> {selectedBlog.saves}
              </button>
            </div>

            <div className="detail-text">{selectedBlog.content}</div>

            {showComments[selectedBlog.id] && (
              <div className="comments-section">
                <h3>Comments ({selectedBlog.comments})</h3>

                <div className="comment-input-box">
                  <input
                    type="text"
                    placeholder="Share your thoughts..."
                    value={commentText[selectedBlog.id] || ""}
                    onChange={(e) =>
                      setCommentText({
                        ...commentText,
                        [selectedBlog.id]: e.target.value,
                      })
                    }
                    onKeyPress={(e) => e.key === "Enter" && handleAddComment(selectedBlog.id)}
                  />
                  <button onClick={() => handleAddComment(selectedBlog.id)}>
                    <FiSend /> Post
                  </button>
                </div>

                <div className="comments-list">
                  {selectedBlog.commentList.map((comment) => (
                    <div key={comment.id} className="comment-item">
                      <img src={comment.avatar} alt={comment.author} />
                      <div className="comment-body">
                        <div className="comment-header">
                          <strong>{comment.author}</strong>
                          <span>{comment.date}</span>
                        </div>
                        <p>{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="author-card">
              <img src={selectedBlog.image} alt={selectedBlog.author} />
              <h4>{selectedBlog.author}</h4>
              <span className="role-badge">{selectedBlog.role}</span>
              <p>
                <FiMapPin size={14} /> {selectedBlog.location}
              </p>
              <button className="follow-btn">Follow Farmer</button>
              <button className="view-posts-btn">View All Posts</button>
            </div>

            <div className="related-section">
              <h3>Related Blogs</h3>
              <div className="related-grid">
                {blogs
                  .filter((b) => b.id !== selectedBlog.id)
                  .slice(0, 3)
                  .map((blog) => (
                    <div
                      key={blog.id}
                      className="related-card"
                      onClick={() => setSelectedBlog(blog)}
                    >
                      <img src={blog.image} alt={blog.title} />
                      <h4>{blog.title}</h4>
                      <p>{blog.author}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="farmer-blog-page">
      {/* Header Section */}
      <div className="blog-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>🌾 MaatiAI</h1>
            <span>Farmer Community Blog</span>
          </div>

          <div className="search-section">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by crop, problem, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="header-buttons">
            <button className="create-btn" onClick={() => setShowModal(true)}>
              Create Blog
            </button>
            <button className="nav-btn">My Blogs</button>
            <button className="nav-btn">Saved Blogs</button>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filters">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`filter-btn ${activeFilter === filter ? "active" : ""}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Blog Cards Grid */}
      <div className="blog-content">
        <div className="blog-grid">
          {filteredBlogs.length > 0 ? (
            filteredBlogs.map((blog) => (
              <div key={blog.id} className="blog-card" onClick={() => setSelectedBlog(blog)}>
                <div className="card-image">
                  <img src={blog.image} alt={blog.title} />
                  <div className="card-badge">
                    <span className="crop-badge">{blog.cropType}</span>
                  </div>
                </div>

                <div className="card-body">
                  <h3 className="card-title">{blog.title}</h3>
                  <p className="card-description">{blog.description.substring(0, 120)}...</p>

                  <div className="card-author">
                    <div className="author-info">
                      <strong>{blog.author}</strong>
                      <span className="role-badge mini">{blog.role}</span>
                    </div>
                  </div>

                  <div className="card-meta">
                    <span>
                      <FiMapPin size={14} /> {blog.location}
                    </span>
                    <span>
                      <FiCalendar size={14} /> {blog.date}
                    </span>
                  </div>

                  <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className={`action-btn ${blog.liked ? "active" : ""}`}
                      onClick={() => handleLike(blog.id)}
                    >
                      <FiHeart size={16} /> {blog.likes}
                    </button>
                    <button
                      className="action-btn"
                      onClick={() =>
                        setShowComments({ ...showComments, [blog.id]: !showComments[blog.id] })
                      }
                    >
                      <FiMessageCircle size={16} /> {blog.comments}
                    </button>
                    <button className="action-btn">
                      <FiShare2 size={16} />
                    </button>
                    <button
                      className={`action-btn ${blog.saved ? "active" : ""}`}
                      onClick={() => handleSave(blog.id)}
                    >
                      <FiBookmark size={16} /> {blog.saves}
                    </button>
                  </div>
                </div>

                {showComments[blog.id] && (
                  <div className="card-comments" onClick={(e) => e.stopPropagation()}>
                    <div className="comments-quick">
                      {blog.commentList.slice(0, 2).map((comment) => (
                        <div key={comment.id} className="quick-comment">
                          <strong>{comment.author}:</strong> {comment.text}
                        </div>
                      ))}
                    </div>
                    <div className="quick-input">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentText[blog.id] || ""}
                        onChange={(e) =>
                          setCommentText({
                            ...commentText,
                            [blog.id]: e.target.value,
                          })
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button onClick={() => handleAddComment(blog.id)}>
                        <FiSend size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <h3>No blogs available yet.</h3>
              <button className="create-btn" onClick={() => setShowModal(true)}>
                Create First Blog
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-card">
            <h3>Trending Topics</h3>
            <div className="trending-list">
              {["Smart Farming", "Pest Control", "Soil Health", "Water Management", "Organic Farming"].map(
                (topic) => (
                  <div key={topic} className="trending-item">
                    <span className="trending-tag">{topic}</span>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="sidebar-card">
            <h3>Top Farmers</h3>
            <div className="farmers-list">
              {[
                { name: "Rajesh Kumar", posts: 24 },
                { name: "Meera Devi", posts: 18 },
                { name: "Suresh Reddy", posts: 31 },
              ].map((farmer) => (
                <div key={farmer.name} className="farmer-item">
                  <div className="farmer-avatar"></div>
                  <div>
                    <strong>{farmer.name}</strong>
                    <p>{farmer.posts} posts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-card">
            <h3>Recommended</h3>
            <p className="recommendation-text">
              Based on your interests in wheat and organic farming, check out these related discussions.
            </p>
          </div>
        </div>
      </div>

      {/* Create Blog Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Blog</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Blog Title</label>
                <input
                  type="text"
                  placeholder="Enter blog title"
                  value={newBlogForm.title}
                  onChange={(e) =>
                    setNewBlogForm({ ...newBlogForm, title: e.target.value })
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Crop Type</label>
                  <select
                    value={newBlogForm.cropType}
                    onChange={(e) =>
                      setNewBlogForm({ ...newBlogForm, cropType: e.target.value })
                    }
                  >
                    <option value="">Select crop</option>
                    {cropTypes.map((crop) => (
                      <option key={crop} value={crop}>
                        {crop}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Problem Type</label>
                  <select
                    value={newBlogForm.problemType}
                    onChange={(e) =>
                      setNewBlogForm({ ...newBlogForm, problemType: e.target.value })
                    }
                  >
                    <option value="">Select problem</option>
                    {problemTypes.map((problem) => (
                      <option key={problem} value={problem}>
                        {problem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="Your location"
                  value={newBlogForm.location}
                  onChange={(e) =>
                    setNewBlogForm({ ...newBlogForm, location: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Describe your problem, what you observed, what solution you tried, and the results..."
                  rows="6"
                  value={newBlogForm.description}
                  onChange={(e) =>
                    setNewBlogForm({ ...newBlogForm, description: e.target.value })
                  }
                />
              </div>

              <div className="media-buttons">
                <button className="media-btn">
                  <FiImage /> Upload Images
                </button>
                <button className="media-btn">
                  <FiVideo /> Upload Video
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>
                Close
              </button>
              <button className="publish-btn" onClick={handleCreateBlog}>
                Publish Blog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FarmerBlog
