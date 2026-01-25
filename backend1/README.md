
# Farming Backend API

This is a starter backend template for a farming-related project focusing on drone image uploads, user authentication, and crop data management. Built with **Node.js**, **Express**, **MongoDB**, and **Multer** for file uploads.

---

## Features

- User Registration & Login (JWT-based authentication)
- Role-based user types (farmer, admin)
- Secure password hashing with bcrypt
- Image upload API with metadata (stored locally)
- Fetch uploaded images for the logged-in user
- Clean and modular folder structure
- Environment variable support

---

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- Multer (for handling image uploads)
- JSON Web Tokens (JWT)
- bcryptjs (password hashing)
- dotenv (environment variables)

---

## Folder Structure

```
backend/
├── controllers/
│   ├── authController.js
│   └── imageController.js
├── middleware/
│   └── authMiddleware.js
├── models/
│   ├── User.js
│   └── Image.js
├── routes/
│   ├── authRoutes.js
│   └── imageRoutes.js
├── uploads/               <-- folder to store uploaded images
├── config/
│   └── db.js
├── app.js
├── server.js
├── .env
├── package.json
```
---

## Getting Started

### Prerequisites

- Node.js and npm installed
- MongoDB instance (local or MongoDB Atlas)

### Installation

1. Clone the repo:

   ```bash
   git clone <repo-url>
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root folder with the following variables:

   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```

4. Create a folder named `uploads` in the root directory:

   ```bash
   mkdir uploads
   ```

### Running the server

- For development with auto-reload (requires nodemon):

  ```bash
  npm run dev
  ```

- For production:

  ```bash
  npm start
  ```

---

## API Endpoints

### Auth Routes

| Method | Endpoint          | Description            | Body Params                         |
|--------|-------------------|------------------------|-----------------------------------|
| POST   | `/api/auth/register` | Register a new user     | `{ name, email, password, role }`  |
| POST   | `/api/auth/login`    | Login user             | `{ email, password }`               |

---

### Image Routes

| Method | Endpoint            | Description                 | Headers             | Body Params (form-data)         |
|--------|---------------------|-----------------------------|---------------------|--------------------------------|
| POST   | `/api/images/upload` | Upload image with metadata  | `Authorization: Bearer <token>` | `image` (file), `location`, `cropType` |
| GET    | `/api/images`         | Get images of logged-in user | `Authorization: Bearer <token>` | -                              |

---

## Usage

1. Register a new user (farmer/admin)
2. Login and get JWT token
3. Use the token in Authorization header (`Bearer <token>`) to upload images and fetch images
4. Upload drone images with optional metadata like location and crop type

---

## Notes

- Images are stored locally in the `/uploads` folder.
- For production, consider using cloud storage (AWS S3, Cloudinary).
- Passwords are securely hashed with bcrypt.
- JWT tokens expire in 7 days; adjust in `authController.js` if needed.

---

## Future Improvements

- Connect to ML model for crop health/disease analysis
- Add pagination for image listing
- Role-based route restrictions (admin-only features)
- Better error handling and validation
- Use cloud storage for image uploads
- Add unit & integration tests

---

## License

MIT License

---

## Contact

For questions or suggestions, contact:  
**SAURAV KUMAR** – sauravkumar70799@gmail.com  
GitHub: saurav2520(https://github.com/saurav2520)
