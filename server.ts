import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { Issue, Comment, User, Notification, Category, Severity, IssueStatus, AnalyticsSummary } from "./src/types.js";

dotenv.config();

// Initialize Gemini API client safely
let ai: GoogleGenAI | null = null;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (GEMINI_API_KEY && GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    console.log("Gemini AI client successfully initialized.");
  } catch (err) {
    console.error("Failed to initialize Gemini AI client:", err);
  }
} else {
  console.log("No valid GEMINI_API_KEY found. Heuristic AI engines will act as fallback.");
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// IN-MEMORY DATABASE STATE
const users: User[] = [
  {
    id: "user-1",
    name: "Alex Rivera",
    email: "citizen@civicalert.gov",
    role: "CITIZEN",
    points: 340,
    badges: ["First Responder", "Eagle Eye", "Pothole Patrol"],
    joinedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "admin-1",
    name: "Director Sarah Jenkins",
    email: "admin@civicalert.gov",
    role: "ADMIN",
    points: 1250,
    badges: ["City Guardian", "Master Solver"],
    joinedAt: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "user-2",
    name: "Marcus Chen",
    email: "marcus@civicalert.gov",
    role: "CITIZEN",
    points: 180,
    badges: ["First Responder", "Waste Reducer"],
    joinedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  }
];

const mockComments: Comment[] = [
  {
    id: "c-1",
    issueId: "issue-1",
    userId: "user-2",
    userName: "Marcus Chen",
    text: "Can confirm! Almost hit this pothole last night. It's extremely deep and fills up with water during rain, making it invisible.",
    createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString()
  },
  {
    id: "c-2",
    issueId: "issue-1",
    userId: "admin-1",
    userName: "Sarah Jenkins (Admin)",
    text: "Thank you for the detailed report and community confirmation. I have flagged this as high severity and dispatched the Road Maintenance squad for inspection.",
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  },
  {
    id: "c-3",
    issueId: "issue-3",
    userId: "user-1",
    userName: "Alex Rivera",
    text: "The flooding is spreading toward the basement entrance of the local library. Hope the utility workers get here soon!",
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  }
];

const issues: Issue[] = [
  {
    id: "issue-1",
    title: "Deep Pothole on Central Avenue",
    description: "Deep pothole in the middle lane of Central Avenue near 5th Street. Multiple cars have swerved into oncoming traffic to avoid it, causing near misses. Needs urgent asphalt patching before an accident occurs.",
    category: "POTHOLE",
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80",
    latitude: 40.7128,
    longitude: -74.0060,
    address: "124 Central Ave, Civic Heights",
    severity: "HIGH",
    priorityScore: 78,
    department: "Department of Transportation",
    status: "REPORTED",
    upvotes: ["user-2", "admin-1"],
    comments: [],
    reportedBy: "Alex Rivera",
    reportedById: "user-1",
    reportedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  },
  {
    id: "issue-2",
    title: "Overflowing Dumpsters in Commercial Alley",
    description: "Public trash receptacles in the commercial alleyway are completely overflowing. Commercial shops are piling cardboard and organic waste outside. It smells horrible and is attracting a large swarm of flies and rodents.",
    category: "GARBAGE",
    imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80",
    latitude: 40.7148,
    longitude: -74.0030,
    address: "45 Market Square, Civic Heights",
    severity: "MEDIUM",
    priorityScore: 54,
    department: "Sanitation & Waste Management",
    status: "VERIFIED",
    upvotes: ["user-1"],
    comments: [],
    reportedBy: "Marcus Chen",
    reportedById: "user-2",
    reportedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "issue-3",
    title: "Burst Water Pipe causing Sidewalk Flooding",
    description: "High-pressure water leakage near the fire hydrant. Water is gushing out under the pavement slabs, causing them to uplift and cracking the concrete. The sidewalk is flooded and unsafe for wheelchair users.",
    category: "WATER_LEAK",
    imageUrl: "https://images.unsplash.com/photo-1542013936693-8848e574047e?auto=format&fit=crop&w=800&q=80",
    latitude: 40.7108,
    longitude: -74.0110,
    address: "88 Pine Boulevard, Civic Heights",
    severity: "CRITICAL",
    priorityScore: 92,
    department: "Water and Power Board",
    status: "ASSIGNED",
    upvotes: ["user-2", "user-1"],
    comments: [],
    reportedBy: "Alex Rivera",
    reportedById: "user-1",
    reportedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    assignedTo: "Emergency Hydraulics Crew A"
  },
  {
    id: "issue-4",
    title: "Broken Streetlight on Park Walkway",
    description: "The street light overlooking the children's slide and public swings in Central Park has been completely dark for over a week. The surrounding area is pitch black after 6 PM, which makes parents and kids feel extremely vulnerable.",
    category: "STREETLIGHT",
    imageUrl: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80",
    latitude: 40.7178,
    longitude: -74.0080,
    address: "Central Park North Path, Civic Heights",
    severity: "MEDIUM",
    priorityScore: 60,
    department: "Public Lighting Division",
    status: "RESOLVED",
    upvotes: ["user-1", "user-2"],
    comments: [],
    reportedBy: "Alex Rivera",
    reportedById: "user-1",
    reportedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    resolvedImage: "https://images.unsplash.com/photo-1509024644558-2f56ce76c090?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "issue-5",
    title: "Eroding Road Shoulder on Oak Ridge",
    description: "Severe spiderweb cracking and sub-base washouts along the steep asphalt shoulder. Heavy rainfall is washing away the soil underneath. If left unpatched, the entire shoulder segment will collapse into the drainage ditch.",
    category: "ROAD_DAMAGE",
    imageUrl: "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80",
    latitude: 40.7090,
    longitude: -73.9980,
    address: "210 Oak Ridge Highway, Civic Heights",
    severity: "LOW",
    priorityScore: 32,
    department: "Department of Transportation",
    status: "IN_PROGRESS",
    upvotes: ["admin-1"],
    comments: [],
    reportedBy: "Marcus Chen",
    reportedById: "user-2",
    reportedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    assignedTo: "District 4 Asphalt Maintenance"
  }
];

// Map comments to their issues
issues.forEach(issue => {
  issue.comments = mockComments.filter(c => c.issueId === issue.id);
});

const notifications: Notification[] = [
  {
    id: "n-1",
    userId: "user-1",
    issueId: "issue-1",
    text: "Admin verified your report 'Deep Pothole on Central Avenue' and upgraded its status.",
    type: "STATUS_CHANGE",
    isRead: false,
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  },
  {
    id: "n-2",
    userId: "user-1",
    issueId: "issue-3",
    text: "Your report 'Burst Water Pipe' was assigned to Emergency Hydraulics Crew A.",
    type: "STATUS_CHANGE",
    isRead: true,
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
  }
];

// Helper: Haversine distance in meters
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// AI ENGINE: Analyzes Title, Description and optionally base64 image
async function runAIEngine(
  title: string,
  description: string,
  base64Image?: string
): Promise<{
  category: Category;
  severity: Severity;
  priorityScore: number;
  department: string;
  explanation: string;
}> {
  if (ai) {
    try {
      let prompt = `You are an expert civic engineering AI analyzer. Analyze the following citizen report:
Title: "${title}"
Description: "${description}"

Classify it into one of the following exact categories: POTHOLE, GARBAGE, WATER_LEAK, STREETLIGHT, ROAD_DAMAGE, OTHER.
Determine the Severity: LOW, MEDIUM, HIGH, CRITICAL based on immediate public safety hazard and utility service interruption.
Calculate a Priority Score from 0 to 100 (where 100 is life-threatening or major infrastructure collapse, and 0 is minor aesthetic issue).
Suggest the most suitable city department to address this.
Provide a clear, brief 1-2 sentence explanation of your decision.`;

      let contents: any[] = [];

      if (base64Image) {
        // Strip out the header if present (e.g., data:image/jpeg;base64,)
        const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          const mimeType = match[1];
          const data = match[2];
          contents.push({
            inlineData: {
              data: data,
              mimeType: mimeType
            }
          });
        }
      }

      contents.push(prompt);

      console.log("Calling Gemini API...");
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              category: { type: "STRING", enum: ["POTHOLE", "GARBAGE", "WATER_LEAK", "STREETLIGHT", "ROAD_DAMAGE", "OTHER"] },
              severity: { type: "STRING", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
              priorityScore: { type: "NUMBER" },
              department: { type: "STRING" },
              explanation: { type: "STRING" }
            },
            required: ["category", "severity", "priorityScore", "department", "explanation"]
          }
        }
      });

      const responseText = result.text;
      console.log("Gemini API Response Text:", responseText);
      if (responseText) {
        const parsed = JSON.parse(responseText);
        return {
          category: parsed.category as Category,
          severity: parsed.severity as Severity,
          priorityScore: Math.min(100, Math.max(0, Math.round(parsed.priorityScore || 50))),
          department: parsed.department || "Public Works Division",
          explanation: parsed.explanation || "Analyzed successfully with Gemini AI."
        };
      }
    } catch (e) {
      console.error("Gemini AI API call failed, falling back to heuristics:", e);
    }
  }

  // HEURISTIC BACKFALL
  console.log("Running Heuristic Analysis Engine...");
  const text = (title + " " + description).toLowerCase();
  let category: Category = "OTHER";
  let department = "Public Works Division";
  let severity: Severity = "MEDIUM";
  let priorityScore = 45;
  let explanation = "Analyzed with CivicAlert's Local Heuristic Engine. ";

  if (text.includes("pothole") || text.includes("crater") || text.includes("cavity") || text.includes("sinkhole")) {
    category = "POTHOLE";
    department = "Department of Transportation";
    severity = text.includes("huge") || text.includes("deep") || text.includes("tire") || text.includes("damage") ? "HIGH" : "MEDIUM";
    priorityScore = severity === "HIGH" ? 75 : 55;
    explanation += "Classified as POTHOLING due to road surface hazard keywords.";
  } else if (text.includes("garbage") || text.includes("trash") || text.includes("dumpster") || text.includes("waste") || text.includes("litter") || text.includes("rubbish")) {
    category = "GARBAGE";
    department = "Sanitation & Waste Management";
    severity = text.includes("rot") || text.includes("smell") || text.includes("rodent") || text.includes("rats") ? "MEDIUM" : "LOW";
    priorityScore = severity === "MEDIUM" ? 50 : 30;
    explanation += "Classified as WASTE due to sanitation/refuse keywords.";
  } else if (text.includes("water") || text.includes("leak") || text.includes("burst") || text.includes("flood") || text.includes("sewer") || text.includes("gush")) {
    category = "WATER_LEAK";
    department = "Water and Power Board";
    severity = text.includes("flood") || text.includes("gush") || text.includes("pipe burst") ? "CRITICAL" : "HIGH";
    priorityScore = severity === "CRITICAL" ? 90 : 70;
    explanation += "Classified as WATER/PLUMBING due to pipe leakage or flooding keywords.";
  } else if (text.includes("light") || text.includes("dark") || text.includes("lamp") || text.includes("streetlight") || text.includes("bulb")) {
    category = "STREETLIGHT";
    department = "Public Lighting Division";
    severity = text.includes("park") || text.includes("playground") || text.includes("darkness") || text.includes("scary") ? "MEDIUM" : "LOW";
    priorityScore = severity === "MEDIUM" ? 58 : 35;
    explanation += "Classified as LIGHTING hazard based on lamppost/illumination keywords.";
  } else if (text.includes("crack") || text.includes("sidewalk") || text.includes("asphalt") || text.includes("pavement") || text.includes("collapse") || text.includes("landslide") || text.includes("road damage")) {
    category = "ROAD_DAMAGE";
    department = "Department of Transportation";
    severity = text.includes("collapsed") || text.includes("landslide") ? "HIGH" : "LOW";
    priorityScore = severity === "HIGH" ? 80 : 40;
    explanation += "Classified as structural ROAD DAMAGE based on crack/pavement erosion keywords.";
  } else {
    explanation += "Categorized as GENERAL query. Standard inspection requested.";
  }

  return { category, severity, priorityScore, department, explanation };
}

// REST API ENDPOINTS

// 1. AUTHENTICATION
app.post("/api/auth/register", (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and Email are required" });
  }

  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(200).json({ user: existing, message: "Welcome back!" });
  }

  const newUser: User = {
    id: "user-" + (users.length + 1),
    name,
    email,
    role: role === "ADMIN" ? "ADMIN" : "CITIZEN",
    points: 10,
    badges: ["First Responder"],
    joinedAt: new Date().toISOString()
  };

  users.push(newUser);
  res.status(201).json({ user: newUser, message: "Account created successfully" });
});

app.post("/api/auth/login", (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email.toLowerCase() === (email || "").toLowerCase());
  if (user) {
    return res.json({ user });
  }
  return res.status(404).json({ error: "User not found with this email" });
});

// 2. ISSUES
app.get("/api/issues", (req, res) => {
  res.json(issues);
});

app.post("/api/issues", async (req, res) => {
  const { title, description, imageUrl, latitude, longitude, address, reportedBy, reportedById } = req.body;

  if (!title || !description || !latitude || !longitude) {
    return res.status(400).json({ error: "Title, Description, and GPS coordinates are required" });
  }

  // Compute distance and look for duplicates
  let isDuplicate = false;
  let duplicateOfId = "";

  // Perform AI analysis on Category, Severity, and Department
  const aiResult = await runAIEngine(title, description, imageUrl);

  // Simple duplicate check (same category within 250 meters)
  const nearbyIssue = issues.find(existing => {
    if (existing.status === "RESOLVED") return false;
    if (existing.category !== aiResult.category) return false;
    const distance = getHaversineDistance(latitude, longitude, existing.latitude, existing.longitude);
    return distance < 250; // Within 250m
  });

  if (nearbyIssue) {
    isDuplicate = true;
    duplicateOfId = nearbyIssue.id;
  }

  const newIssue: Issue = {
    id: "issue-" + (issues.length + 1),
    title,
    description: description + (isDuplicate ? `\n\n[Duplicate System Notice: This was flagged as a potential duplicate of Report #${nearbyIssue?.id}]` : ""),
    category: aiResult.category,
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80",
    latitude,
    longitude,
    address: address || "Captured Coordinates",
    severity: aiResult.severity,
    priorityScore: aiResult.priorityScore,
    department: aiResult.department,
    status: isDuplicate ? "REPORTED" : "REPORTED",
    upvotes: [],
    comments: [],
    reportedBy: reportedBy || "Anonymous Citizen",
    reportedById: reportedById || "user-1",
    reportedAt: new Date().toISOString(),
    isDuplicate,
    duplicateOfId: isDuplicate ? duplicateOfId : undefined
  };

  issues.unshift(newIssue);

  // Reward reporter with points
  const user = users.find(u => u.id === newIssue.reportedById);
  if (user) {
    user.points += isDuplicate ? 5 : 25; // More points for original reports
    // Trigger milestone badge checks
    if (user.points >= 100 && !user.badges.includes("Bronze Watchdog")) {
      user.badges.push("Bronze Watchdog");
    }
    if (user.points >= 250 && !user.badges.includes("Silver Sentinel")) {
      user.badges.push("Silver Sentinel");
    }
  }

  // Create notification if duplicate is flagged
  if (isDuplicate && user) {
    notifications.unshift({
      id: "n-" + (notifications.length + 1),
      userId: user.id,
      issueId: newIssue.id,
      text: `Your report was automatically flagged as a duplicate of ongoing issue #${duplicateOfId}. Points awarded for confirmation.`,
      type: "DUPLICATE_FLAG",
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  res.status(201).json(newIssue);
});

// UPVOTE / CONFIRM ISSUE
app.post("/api/issues/:id/vote", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: "User ID is required" });

  const issue = issues.find(i => i.id === id);
  if (!issue) return res.status(404).json({ error: "Issue not found" });

  if (issue.upvotes.includes(userId)) {
    // Undo vote
    issue.upvotes = issue.upvotes.filter(uid => uid !== userId);
  } else {
    issue.upvotes.push(userId);
    // Award 5 points to both voter and original reporter for community verification
    const reporter = users.find(u => u.id === issue.reportedById);
    if (reporter && reporter.id !== userId) reporter.points += 5;
    const voter = users.find(u => u.id === userId);
    if (voter) voter.points += 2;
  }

  res.json({ upvotes: issue.upvotes });
});

// POST COMMENT
app.post("/api/issues/:id/comment", (req, res) => {
  const { id } = req.params;
  const { userId, userName, text } = req.body;

  if (!userId || !text) return res.status(400).json({ error: "UserId and Text are required" });

  const issue = issues.find(i => i.id === id);
  if (!issue) return res.status(404).json({ error: "Issue not found" });

  const newComment: Comment = {
    id: "c-" + (Date.now()),
    issueId: id,
    userId,
    userName: userName || "Citizen",
    text,
    createdAt: new Date().toISOString()
  };

  issue.comments.push(newComment);

  // Notify original poster
  if (issue.reportedById !== userId) {
    notifications.unshift({
      id: "n-" + (notifications.length + 1),
      userId: issue.reportedById,
      issueId: id,
      text: `${userName || "A citizen"} commented on your report: "${text.substring(0, 30)}..."`,
      type: "NEW_COMMENT",
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  res.status(201).json(newComment);
});

// STATUS/DEPARTMENT MANAGEMENT (ADMIN ONLY)
app.patch("/api/issues/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, assignedTo, department, resolvedImage } = req.body;

  const issue = issues.find(i => i.id === id);
  if (!issue) return res.status(404).json({ error: "Issue not found" });

  if (status) {
    issue.status = status as IssueStatus;
    if (status === "RESOLVED") {
      issue.resolvedAt = new Date().toISOString();
      if (resolvedImage) {
        issue.resolvedImage = resolvedImage;
      }
      // Reward original reporter with 100 resolution points
      const reporter = users.find(u => u.id === issue.reportedById);
      if (reporter) {
        reporter.points += 100;
        if (!reporter.badges.includes("Civic Hero")) {
          reporter.badges.push("Civic Hero");
        }
      }
    }
  }

  if (assignedTo !== undefined) issue.assignedTo = assignedTo;
  if (department !== undefined) issue.department = department;

  // Notify original reporter about status update
  notifications.unshift({
    id: "n-" + (notifications.length + 1),
    userId: issue.reportedById,
    issueId: id,
    text: `Your report "${issue.title}" has been updated to ${status}.`,
    type: "STATUS_CHANGE",
    isRead: false,
    createdAt: new Date().toISOString()
  });

  res.json(issue);
});

// 3. NOTIFICATIONS
app.get("/api/notifications/:userId", (req, res) => {
  const { userId } = req.params;
  const userNotifications = notifications.filter(n => n.userId === userId);
  res.json(userNotifications);
});

app.post("/api/notifications/mark-read", (req, res) => {
  const { userId } = req.body;
  notifications.forEach(n => {
    if (n.userId === userId) n.isRead = true;
  });
  res.json({ success: true });
});

// 4. ANALYTICS
app.get("/api/analytics", (req, res) => {
  const totalIssues = issues.length;
  const resolvedIssues = issues.filter(i => i.status === "RESOLVED").length;
  const resolutionRate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;

  // Group by Category
  const catMap: Record<Category, number> = {
    POTHOLE: 0,
    GARBAGE: 0,
    WATER_LEAK: 0,
    STREETLIGHT: 0,
    ROAD_DAMAGE: 0,
    OTHER: 0
  };
  issues.forEach(i => {
    catMap[i.category] = (catMap[i.category] || 0) + 1;
  });
  const byCategory = Object.keys(catMap).map(key => ({
    name: key.replace("_", " "),
    value: catMap[key as Category]
  }));

  // Group by Status
  const statusMap: Record<string, number> = {
    REPORTED: 0,
    VERIFIED: 0,
    ASSIGNED: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0
  };
  issues.forEach(i => {
    statusMap[i.status] = (statusMap[i.status] || 0) + 1;
  });
  const byStatus = Object.keys(statusMap).map(key => ({
    name: key.replace("_", " "),
    value: statusMap[key]
  }));

  // Simple hardcoded weekly trends (representing the last 5 weeks for clean visual flow)
  const weeklyTrends = [
    { date: "Wk 22", reported: 4, resolved: 2 },
    { date: "Wk 23", reported: 6, resolved: 4 },
    { date: "Wk 24", reported: 8, resolved: 5 },
    { date: "Wk 25", reported: 12, resolved: 7 },
    { date: "Wk 26", reported: totalIssues, resolved: resolvedIssues }
  ];

  // Hotspots: Group nearby coordinates that have high report densities
  const hotspots = issues.map(i => ({
    id: i.id,
    lat: i.latitude,
    lng: i.longitude,
    count: i.upvotes.length + 1,
    category: i.category,
    severity: i.severity
  }));

  // Top contributors by point
  const topContributors = users
    .map(u => ({
      name: u.name,
      reports: issues.filter(i => i.reportedById === u.id).length,
      points: u.points
    }))
    .sort((a, b) => b.points - a.points);

  const summary: AnalyticsSummary = {
    totalIssues,
    resolvedIssues,
    resolutionRate,
    byCategory,
    byStatus,
    weeklyTrends,
    hotspots,
    topContributors
  };

  res.json(summary);
});

// 5. PREDICT HOTSPOTS AI ROUTE
app.get("/api/predict-hotspots", async (req, res) => {
  // Use Gemini to predict hotspots or run heuristics
  if (ai) {
    try {
      const issueSummaryText = issues
        .map(
          i =>
            `- Issue #${i.id}: Category: ${i.category}, Latitude: ${i.latitude}, Longitude: ${i.longitude}, Status: ${i.status}, Severity: ${i.severity}, ReportedAt: ${i.reportedAt}`
        )
        .join("\n");

      const prompt = `You are an urban planning and predictive maintenance AI. Analyze the list of reported civic issues below.
Predict 2 potential urban risk zones or "hotspots" where systemic infrastructure failures could escalate (for example, where a water leak might erode asphalt, or where poor street lighting is grouped near high-traffic walkways).

${issueSummaryText}

Generate exactly 2 Predicted Hotspots in a JSON structure.
Format:
{
  "hotspots": [
    {
      "zoneName": "Name of the predicted zone",
      "latitude": 40.7120,
      "longitude": -74.0050,
      "riskCategory": "e.g., Road Erosion & Utility Failure, Public Safety Hazard",
      "riskDescription": "Explanation of the compound hazard and what could happen if unaddressed.",
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "remedialAction": "What the city should proactively do immediately."
    }
  ],
  "overallCityVulnerabilityIndex": 72
}`;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              hotspots: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    zoneName: { type: "STRING" },
                    latitude: { type: "NUMBER" },
                    longitude: { type: "NUMBER" },
                    riskCategory: { type: "STRING" },
                    riskDescription: { type: "STRING" },
                    severity: { type: "STRING", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
                    remedialAction: { type: "STRING" }
                  },
                  required: ["zoneName", "latitude", "longitude", "riskCategory", "riskDescription", "severity", "remedialAction"]
                }
              },
              overallCityVulnerabilityIndex: { type: "NUMBER" }
            },
            required: ["hotspots", "overallCityVulnerabilityIndex"]
          }
        }
      });

      if (result.text) {
        return res.json(JSON.parse(result.text));
      }
    } catch (e) {
      console.error("Gemini failed hotspot prediction, running heuristic backup:", e);
    }
  }

  // HEURISTIC PREDICTIVE MAINTENANCE BACKUP
  console.log("Generating Heuristic Predictive Hotspots...");
  // Group issues by proximity
  const waterLeaks = issues.filter(i => i.category === "WATER_LEAK" && i.status !== "RESOLVED");
  const roadDamages = issues.filter(i => i.category === "POTHOLE" || i.category === "ROAD_DAMAGE");
  
  const hotspotsList = [
    {
      zoneName: "North Central Park Safety Corridor",
      latitude: 40.7160,
      longitude: -74.0075,
      riskCategory: "Public Security Risk Zone",
      riskDescription: "Recent streetlight outages reported in close proximity to children's park pathways indicate a compounded security concern during evening hours. Proactive lighting replacement and safety patrol is highly recommended.",
      severity: "HIGH",
      remedialAction: "Deploy immediate municipal lighting check and prioritize lamppost replacement on Central Park North walkway."
    },
    {
      zoneName: "Pine & Central Hydraulic Confluence Zone",
      latitude: 40.7118,
      longitude: -74.0090,
      riskCategory: "Water-Induced Asphalt Sub-Base Washout",
      riskDescription: "Active heavy water main leakage near Pine Boulevard and adjacent road damage reports indicate potential sub-grade soil erosion. Water is highly likely seepage beneath asphalt plates, threatening structural street collapse.",
      severity: "CRITICAL",
      remedialAction: "Dispatch leak-detection engineers alongside pavement patch crews to stabilize sub-grade soil and clamp the water main pressure valve."
    }
  ];

  res.json({
    hotspots: hotspotsList,
    overallCityVulnerabilityIndex: 64
  });
});

// START EXPRESS/VITE ENGINE
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started and listening on http://0.0.0.0:${PORT}`);
  });
}

start();
