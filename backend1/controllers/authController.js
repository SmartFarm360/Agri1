const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const pool = require('../config/db'); // PostgreSQL connection
const { uploadToBackblaze } = require('../middleware/backBlazeUpload');
require('dotenv').config();
const qs = require('qs');

const axios = require('axios');
// In-memory blacklist
let blacklistedTokens = [];

exports.register = async (req, res) => {
    
    let { name, email, mob: mobile, password, confirmPassword, role } = req.body;

    // Normalize role: trim, lowercase, replace spaces with underscores
    role = role?.trim().toLowerCase().replace(/\s+/g, '_');

    const allowedRoles = ['farmer', 'admin', 'drone_controller'];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role provided.' });
    }

    const client = await pool.connect();

    try {
        // Password Validation
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
            });
        }

        // Check if user already exists
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Start transaction
        await client.query('BEGIN');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert into users table
        const insertUserQuery = `
            INSERT INTO users (full_name, email, mob, password_hash, role)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING user_id
        `;
        const userResult = await client.query(insertUserQuery, [name, email, mobile, hashedPassword, role]);
        const userId = userResult.rows[0].user_id;
//console.log(req.body)

        // Role-based table insertion
        if (role === 'farmer') {
            const {
  landSize,
  location,
  experience,
  cropType,
  latitude,
  longitude
} = req.body;

            if (!req.file) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'Land document file is required.' });
            }

            const fileBuffer = req.file.buffer;
            const fileName = `land-documents/${Date.now()}-${req.file.originalname}`;
            const backblazeUrl = await uploadToBackblaze(fileName, fileBuffer, req.file.mimetype);

         const insertFarmerQuery = `
  INSERT INTO farmer_profiles
  (
    user_id,
    farm_location,
    latitude,
    longitude,
    land_size,
    crop_type,
    experience,
    land_document_url
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
`;
await client.query(insertFarmerQuery, [
  userId,
  location,
  Number(latitude),
  Number(longitude),
  landSize,
  cropType,
  experience,
  backblazeUrl
]);


        } else if (role === 'admin') {
            const { employeeId, adminArea, accessLevel } = req.body;


            if (!latitude || !longitude) {
  await client.query("ROLLBACK");
  return res.status(400).json({
    message: "Farmer latitude and longitude are required"
  });
}

            const insertAdminQuery = `
                INSERT INTO admin_profiles (user_id, employee_id, admin_area, access_level)
                VALUES ($1, $2, $3, $4)
            `;
            await client.query(insertAdminQuery, [userId, employeeId, adminArea, accessLevel]);

        } else if (role === 'drone_controller') {
            const { licenseId, baseLocation, availableDrones, flightExperience } = req.body;

            const insertDroneQuery = `
                INSERT INTO drone_controller_profiles (user_id, license_id, base_location, available_drones, flight_experience)
                VALUES ($1, $2, $3, $4, $5)
            `;
            await client.query(insertDroneQuery, [userId, licenseId, baseLocation, availableDrones, flightExperience]);
        }

        // Commit transaction
        await client.query('COMMIT');

        // Generate JWT
        const token = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'User registered successfully',
            token
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Registration Error:', error.message);
        res.status(500).json({ message: 'Server error during registration' });
    } finally {
        client.release();
    }
};


// async function sendOtpToPhone(phone, otp) {
//     const options = {
//         method: 'POST',
//         url: 'https://www.fast2sms.com/dev/bulkV2',
//         headers: {
//             'authorization': process.env.FAST2SMS_API_KEY,
//             'Content-Type': 'application/x-www-form-urlencoded'
//         },
//         data: qs.stringify({
//             variables_values: otp,
//             route: 'otp',
//             numbers: phone,
//         }),
//     };

//     try {
//         const response = await axios.request(options);
//         console.log('SMS sent:', response.data);
//         return response.data;
//     } catch (error) {
//         console.error('Fast2SMS error:', error.response?.data || error.message);
//         throw new Error('Failed to send OTP to phone');
//     }
// }

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userQuery.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const user = userQuery.rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

        const payload = { user: { id: user.user_id, role: user.role } };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, role: user.role , id:user.user_id,email:user.email});
        });

    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.logout = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'No token provided' });

    blacklistedTokens.push(token);
    return res.status(200).json({ message: 'Logout successful' });
};

// Utility to check if token is blacklisted
exports.isTokenBlacklisted = (token) => blacklistedTokens.includes(token);

// OTP Flow
exports.sendOTP = async (req, res) => {
    const { email} = req.body;

    if (!email) return res.status(400).json({ message: 'Email is required.' });
    //if (!phone) return res.status(400).json({ message: 'Phone number is required.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); //  OTP generated here
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    try {
        // Store OTP in DB
        await pool.query(
            'INSERT INTO otp_codes (email, otp, expires_at) VALUES ($1, $2, $3)',
            [email, otp, expiresAt]
        );

        // Send email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `Your App <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP is ${otp}. It will expire in 10 minutes.`
        };

        await transporter.sendMail(mailOptions);

        //  Send SMS
        // await sendOtpToPhone(phone, otp); 

        res.status(200).json({ message: 'OTP sent to email' });
    } catch (err) {
        console.error('OTP Send Error:', err.message);
        res.status(500).json({ message: 'Failed to send OTP.' });
    }
};


// Verify OTP
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP required.' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM otp_codes WHERE email = $1 AND otp = $2',
            [email, otp]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        const record = result.rows[0];

        if (new Date() > record.expires_at) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        await pool.query('DELETE FROM otp_codes WHERE email = $1', [email]);

        res.status(200).json({ message: 'OTP verified successfully' });
    } catch (err) {
        console.error('OTP Verify Error:', err.message);
        res.status(500).json({ message: 'Server error while verifying OTP' });
    }
}


exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const result = await pool.query(
      'SELECT full_name, email, created_at FROM users WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0]; //  Define the user variable here

    res.status(200).json({
      name: user.full_name,
      email: user.email,
      password: "********", 
      created_at: new Date(user.created_at).toISOString(), //  No error now
    });
  } catch (err) {
    console.error("Error in getProfile:", err.message);
    res.status(500).json({ message: "Server error while fetching profile" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { name, email, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    let query;
    let values;

    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);

      query = `
        UPDATE users 
        SET full_name = $1, email = $2, password_hash = $3 
        WHERE user_id = $4 
        RETURNING full_name, email, created_at
      `;
      values = [name, email, hashedPassword, userId];
    } else {
      query = `
        UPDATE users 
        SET full_name = $1, email = $2 
        WHERE user_id = $3 
        RETURNING full_name, email, created_at
      `;
      values = [name, email, userId];
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found or not updated" });
    }

    const updatedUser = result.rows[0];

    res.status(200).json({
      name: updatedUser.full_name,
      email: updatedUser.email,
      password: "********",
      created_at: new Date(updatedUser.created_at).toISOString(),
    });
  } catch (err) {
    console.error("Error updating profile:", err.message);
    res.status(500).json({ message: "Server error while updating profile" });
  }
};