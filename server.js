require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'yellow-lamp-secret-key-2026';
const NOTIFICATION_EMAIL = 'yelllow.lamp@gmail.com';

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer for project thumbnail uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'project-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif|svg/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpeg, jpg, png, webp, gif, svg) are allowed!'));
  }
});

// Helper Authentication Middleware
function authenticateAdmin(req, res, next) {
  const token = req.cookies.admin_token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    res.clearCookie('admin_token');
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' });
  }
}

// Nodemailer SMTP Transporter setup & helper
function sendContactEmail(lead) {
  const hasSMTP = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  const emailSubject = `✦ New Lead: ${lead.fullName} (${lead.brandName})`;
  const emailHtml = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #0d0d0d; color: #ffffff; border: 1px solid #FFD700; border-radius: 12px;">
      <h2 style="font-family: 'Playfair Display', Georgia, serif; color: #FFD700; margin-top: 0; border-bottom: 1px solid rgba(255,215,0,0.2); padding-bottom: 15px;">
        New Inquiry Received
      </h2>
      <p style="color: #aaaaaa; font-size: 0.9rem;">A client just filled out the contact form on your Yellow Lamp website.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
        <tr>
          <td style="padding: 10px 0; font-weight: bold; color: #FFD700; width: 150px; border-bottom: 1px solid rgba(255,255,255,0.05);">Full Name:</td>
          <td style="padding: 10px 0; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.05);">${lead.fullName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: bold; color: #FFD700; border-bottom: 1px solid rgba(255,255,255,0.05);">Brand Name:</td>
          <td style="padding: 10px 0; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.05);">${lead.brandName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: bold; color: #FFD700; border-bottom: 1px solid rgba(255,255,255,0.05);">Email Address:</td>
          <td style="padding: 10px 0; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.05);"><a href="mailto:${lead.emailId}" style="color: #FFD700; text-decoration: none;">${lead.emailId}</a></td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: bold; color: #FFD700; border-bottom: 1px solid rgba(255,255,255,0.05);">Phone Number:</td>
          <td style="padding: 10px 0; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.05);">${lead.contactNum}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: bold; color: #FFD700; vertical-align: top;">Brand Pitch:</td>
          <td style="padding: 10px 0; color: #ffffff; line-height: 1.6;">${lead.message || '<i>No message provided.</i>'}</td>
        </tr>
      </table>
      
      <div style="margin-top: 30px; padding: 15px; background-color: rgba(255,215,0,0.05); border-left: 3px solid #FFD700; font-size: 0.85rem; border-radius: 0 8px 8px 0;">
        <span style="color: #FFD700; font-weight: bold;">Dashboard Alert:</span> You can manage and update the status of this lead by visiting your <a href="http://localhost:3000/admin" style="color: #FFD700; text-decoration: underline; font-weight: bold;">Admin Dashboard</a>.
      </div>
      
      <p style="text-align: center; font-size: 0.75rem; color: #555555; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px;">
        © 2026 Yellow Lamp Server. Sent automatically.
      </p>
    </div>
  `;

  if (hasSMTP) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: `"${lead.fullName} via Yellow Lamp" <${process.env.SMTP_USER}>`,
      to: NOTIFICATION_EMAIL,
      replyTo: lead.emailId,
      subject: emailSubject,
      html: emailHtml
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('[Mailer ERROR] Failed to send notification email:', error);
      } else {
        console.log('[Mailer] Notification email sent successfully:', info.messageId);
      }
    });
  } else {
    // Falls back to logging to console in developmental mode
    console.log('\n================================================================');
    console.log('                    [MOCK EMAIL NOTIFICATION]                   ');
    console.log(`Destination: ${NOTIFICATION_EMAIL}`);
    console.log(`Subject: ${emailSubject}`);
    console.log('----------------------------------------------------------------');
    console.log(`Full Name:      ${lead.fullName}`);
    console.log(`Brand Name:     ${lead.brandName}`);
    console.log(`Email Address:  ${lead.emailId}`);
    console.log(`Phone Number:   ${lead.contactNum}`);
    console.log(`Message/Pitch:  ${lead.message}`);
    console.log('----------------------------------------------------------------');
    console.log('Config Tip: Add SMTP_HOST, SMTP_USER, SMTP_PASS to a .env file to enable actual emails.');
    console.log('================================================================\n');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// Submit a contact request
app.post('/api/contact', (req, res) => {
  const { fullName, brandName, emailId, contactNum, message } = req.body;

  if (!fullName || !brandName || !emailId || !contactNum) {
    return res.status(400).json({ error: 'Please provide all required fields.' });
  }

  try {
    const newLead = db.leads.add({ fullName, brandName, emailId, contactNum, message });
    
    // Asynchronously send email notification
    sendContactEmail(newLead);

    return res.json({ success: true, message: 'Message received successfully!', lead: newLead });
  } catch (err) {
    console.error('Error handling contact submission:', err);
    return res.status(500).json({ error: 'An error occurred while saving your message.' });
  }
});

// Fetch all projects (accessible by public homepage)
app.get('/api/projects', (req, res) => {
  try {
    const list = db.projects.getAll();
    return res.json(list);
  } catch (err) {
    console.error('Error fetching projects:', err);
    return res.status(500).json({ error: 'An error occurred while fetching portfolio projects.' });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// ADMIN API ENDPOINTS (Protected)
// ─────────────────────────────────────────────────────────────────────────────

// Login admin
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Please fill in all fields.' });
  }

  const expectedUsername = db.auth.getAdminUsername();
  const isMatch = username === expectedUsername && db.auth.verifyPassword(password);

  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  // Create JWT Token
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1d' });

  // Set HTTP-only secure cookie
  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });

  return res.json({ success: true, username });
});

// Verify login session status
app.get('/api/admin/verify', (req, res) => {
  const token = req.cookies.admin_token;
  if (!token) {
    return res.json({ authenticated: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ authenticated: true, username: decoded.username });
  } catch (err) {
    res.clearCookie('admin_token');
    return res.json({ authenticated: false });
  }
});

// Logout admin
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('admin_token');
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// Fetch all leads (Admin only)
app.get('/api/admin/leads', authenticateAdmin, (req, res) => {
  try {
    const list = db.leads.getAll();
    return res.json(list);
  } catch (err) {
    console.error('Error retrieving leads:', err);
    return res.status(500).json({ error: 'Could not fetch leads.' });
  }
});

// Update lead status (Admin only)
app.patch('/api/admin/leads/:id', authenticateAdmin, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!status) {
    return res.status(400).json({ error: 'Status is required.' });
  }

  try {
    const updated = db.leads.updateStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Lead not found.' });
    }
    return res.json(updated);
  } catch (err) {
    console.error('Error updating lead status:', err);
    return res.status(500).json({ error: 'Could not update lead.' });
  }
});

// Delete lead (Admin only)
app.delete('/api/admin/leads/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  try {
    const success = db.leads.delete(id);
    if (!success) {
      return res.status(404).json({ error: 'Lead not found.' });
    }
    return res.json({ success: true, message: 'Lead deleted successfully.' });
  } catch (err) {
    console.error('Error deleting lead:', err);
    return res.status(500).json({ error: 'Could not delete lead.' });
  }
});

// Create project with optional thumbnail upload (Admin only)
app.post('/api/admin/projects', authenticateAdmin, upload.single('thumbnailFile'), (req, res) => {
  try {
    const { title, category, description, tags, isFeatured } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Title and Category are required.' });
    }

    let thumbnailPath = '';
    if (req.file) {
      // Save relative web path
      thumbnailPath = `/uploads/${req.file.filename}`;
    }

    // Parse tags (comma-separated string)
    let tagsArray = [];
    if (tags) {
      tagsArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
    }

    const newProj = db.projects.add({
      title,
      category,
      description,
      tags: tagsArray,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      thumbnail: thumbnailPath
    });

    return res.json(newProj);
  } catch (err) {
    console.error('Error creating project:', err);
    return res.status(500).json({ error: err.message || 'Could not create project.' });
  }
});

// Update project with optional thumbnail upload (Admin only)
app.put('/api/admin/projects/:id', authenticateAdmin, upload.single('thumbnailFile'), (req, res) => {
  const { id } = req.params;
  try {
    const { title, category, description, tags, isFeatured } = req.body;

    const existingProject = db.projects.getAll().find(p => p.id === id);
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    let projectData = {};
    if (title !== undefined) projectData.title = title;
    if (category !== undefined) projectData.category = category;
    if (description !== undefined) projectData.description = description;
    if (isFeatured !== undefined) projectData.isFeatured = isFeatured === 'true' || isFeatured === true;

    if (tags !== undefined) {
      projectData.tags = tags.split(',').map(tag => tag.trim()).filter(Boolean);
    }

    if (req.file) {
      // Delete old thumbnail if it was a custom upload
      if (existingProject.thumbnail && (existingProject.thumbnail.startsWith('/uploads/') || existingProject.thumbnail.startsWith('uploads/'))) {
        const oldPath = path.join(__dirname, 'public', existingProject.thumbnail);
        try {
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch (e) {
          console.error('[DB] Old thumbnail delete failed:', e);
        }
      }
      projectData.thumbnail = `/uploads/${req.file.filename}`;
    }

    const updated = db.projects.update(id, projectData);
    return res.json(updated);
  } catch (err) {
    console.error('Error updating project:', err);
    return res.status(500).json({ error: err.message || 'Could not update project.' });
  }
});

// Delete project (Admin only)
app.delete('/api/admin/projects/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  try {
    const success = db.projects.delete(id);
    if (!success) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    return res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (err) {
    console.error('Error deleting project:', err);
    return res.status(500).json({ error: 'Could not delete project.' });
  }
});

// Catch-all route to serve main frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n================================================================`);
  console.log(`✦ Yellow Lamp Server is illuminated at http://localhost:${PORT}`);
  console.log(`✦ Database successfully connected.`);
  console.log(`✦ Serving frontend from public/`);
  console.log(`✦ Admin credentials: username="admin", password="hochifyai2026"`);
  console.log(`================================================================\n`);
});
