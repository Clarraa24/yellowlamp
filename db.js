const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Seed projects list (default portfolio items from HTML)
const SEED_PROJECTS = [
  {
    id: "seed-featured",
    title: "Brand Campaign Reel 2025",
    category: "video",
    description: "A cinematic brand film that captured the essence of our client's vision — shot, edited, and delivered in 4K.",
    tags: ["Video Edit", "Motion"],
    isFeatured: true,
    thumbnail: "", // empty means use beautiful SVG/CSS fallback
    date: "2025-02-15T10:00:00.000Z"
  },
  {
    id: "seed-1",
    title: "Brand Identity System",
    category: "design",
    description: "Logo, typography & full visual language for a D2C startup.",
    tags: ["Design", "Branding"],
    isFeatured: false,
    thumbnail: "",
    date: "2025-02-10T14:30:00.000Z"
  },
  {
    id: "seed-2",
    title: "E-Commerce Platform",
    category: "web",
    description: "Full-stack storefront with seamless checkout & CMS.",
    tags: ["Web Dev", "E-Commerce"],
    isFeatured: false,
    thumbnail: "",
    date: "2025-02-08T09:15:00.000Z"
  },
  {
    id: "seed-3",
    title: "Lead Pipeline Bot",
    category: "auto",
    description: "Automated CRM workflows saving 40+ hours/month.",
    tags: ["Automation", "CRM"],
    isFeatured: false,
    thumbnail: "",
    date: "2025-02-05T16:45:00.000Z"
  },
  {
    id: "seed-4",
    title: "Product Launch Reel",
    category: "video",
    description: "30-second punchy product video for Instagram & Reels.",
    tags: ["Video Edit", "Social"],
    isFeatured: false,
    thumbnail: "",
    date: "2025-02-02T11:00:00.000Z"
  },
  {
    id: "seed-5",
    title: "Social Media Kit",
    category: "design",
    description: "60+ templates across Instagram, LinkedIn & X.",
    tags: ["Design", "Templates"],
    isFeatured: false,
    thumbnail: "",
    date: "2025-01-28T15:20:00.000Z"
  },
  {
    id: "seed-6",
    title: "Portfolio Website",
    category: "web",
    description: "Animated personal portfolio with Three.js hero scene.",
    tags: ["Web Dev", "Animation"],
    isFeatured: false,
    thumbnail: "",
    date: "2025-01-20T10:30:00.000Z"
  }
];

// Initialize JSON files if they don't exist
function initDB() {
  // Leads file
  if (!fs.existsSync(LEADS_FILE)) {
    fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2), 'utf8');
  }

  // Projects file (with seeding)
  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(SEED_PROJECTS, null, 2), 'utf8');
  }

  // Config file (Admin password setup)
  if (!fs.existsSync(CONFIG_FILE)) {
    const defaultPassword = process.env.ADMIN_PASSWORD || 'yellowlamp2026';
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(defaultPassword, salt);
    const config = {
      adminUsername: 'admin',
      adminPasswordHash: hashedPassword
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    console.log('[DB] Config database initialized with default credentials (admin / yellowlamp2026)');
  }
}

// Read utilities
function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading database file ${filePath}:`, error);
    return [];
  }
}

// Write utilities (atomic to prevent corruption)
function writeJSON(filePath, data) {
  try {
    const tempPath = filePath + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    console.error(`Error writing database file ${filePath}:`, error);
  }
}

// LEADS CRUD
const leads = {
  getAll() {
    const data = readJSON(LEADS_FILE);
    // Sort by date descending
    return data.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  add(leadData) {
    const list = readJSON(LEADS_FILE);
    const newLead = {
      id: 'lead_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
      fullName: leadData.fullName || '',
      brandName: leadData.brandName || '',
      emailId: leadData.emailId || '',
      contactNum: leadData.contactNum || '',
      message: leadData.message || '',
      status: 'New', // New, Contacted, In Progress, Completed
      date: new Date().toISOString()
    };
    list.push(newLead);
    writeJSON(LEADS_FILE, list);
    return newLead;
  },

  updateStatus(id, status) {
    const list = readJSON(LEADS_FILE);
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index].status = status;
      writeJSON(LEADS_FILE, list);
      return list[index];
    }
    return null;
  },

  delete(id) {
    const list = readJSON(LEADS_FILE);
    const filtered = list.filter(item => item.id !== id);
    if (filtered.length !== list.length) {
      writeJSON(LEADS_FILE, filtered);
      return true;
    }
    return false;
  }
};

// PROJECTS CRUD
const projects = {
  getAll() {
    const data = readJSON(PROJECTS_FILE);
    // Sort: Featured first, then by date descending
    return data.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return new Date(b.date) - new Date(a.date);
    });
  },

  add(projectData) {
    const list = readJSON(PROJECTS_FILE);
    
    // If this is set as featured, turn off featured status for other projects
    if (projectData.isFeatured) {
      list.forEach(p => p.isFeatured = false);
    }

    const newProj = {
      id: 'proj_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
      title: projectData.title || 'Untitled Project',
      category: projectData.category || 'design',
      description: projectData.description || '',
      tags: Array.isArray(projectData.tags) ? projectData.tags : [],
      isFeatured: !!projectData.isFeatured,
      thumbnail: projectData.thumbnail || '',
      date: projectData.date || new Date().toISOString()
    };
    list.push(newProj);
    writeJSON(PROJECTS_FILE, list);
    return newProj;
  },

  update(id, projectData) {
    const list = readJSON(PROJECTS_FILE);
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      // If this is set as featured, turn off featured status for other projects
      if (projectData.isFeatured) {
        list.forEach(p => {
          if (p.id !== id) p.isFeatured = false;
        });
      }

      list[index] = {
        ...list[index],
        title: projectData.title !== undefined ? projectData.title : list[index].title,
        category: projectData.category !== undefined ? projectData.category : list[index].category,
        description: projectData.description !== undefined ? projectData.description : list[index].description,
        tags: Array.isArray(projectData.tags) ? projectData.tags : list[index].tags,
        isFeatured: projectData.isFeatured !== undefined ? !!projectData.isFeatured : list[index].isFeatured,
        thumbnail: projectData.thumbnail !== undefined ? projectData.thumbnail : list[index].thumbnail
      };
      writeJSON(PROJECTS_FILE, list);
      return list[index];
    }
    return null;
  },

  delete(id) {
    const list = readJSON(PROJECTS_FILE);
    const projectToDelete = list.find(item => item.id === id);
    
    // If it has a thumbnail file that was uploaded, we can delete it
    if (projectToDelete && projectToDelete.thumbnail) {
      // Check if it's not a seed thumbnail (seed thumbnails don't have local paths or start with uploads/)
      if (projectToDelete.thumbnail.startsWith('/uploads/') || projectToDelete.thumbnail.startsWith('uploads/')) {
        const filePath = path.join(__dirname, 'public', projectToDelete.thumbnail);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[DB] Deleted thumbnail file: ${filePath}`);
          }
        } catch (err) {
          console.error(`Failed to delete thumbnail file ${filePath}:`, err);
        }
      }
    }

    const filtered = list.filter(item => item.id !== id);
    if (filtered.length !== list.length) {
      writeJSON(PROJECTS_FILE, filtered);
      return true;
    }
    return false;
  }
};

// ADMIN AUTH
const auth = {
  verifyPassword(plainPassword) {
    const config = readJSON(CONFIG_FILE);
    if (!config || !config.adminPasswordHash) {
      return false;
    }
    return bcrypt.compareSync(plainPassword, config.adminPasswordHash);
  },

  getAdminUsername() {
    const config = readJSON(CONFIG_FILE);
    return config ? config.adminUsername : 'admin';
  }
};

// Initialize DB on load
initDB();

module.exports = {
  leads,
  projects,
  auth
};
