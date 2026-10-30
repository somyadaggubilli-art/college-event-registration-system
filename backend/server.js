
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");
    seedEvent();
  })
  .catch(err => console.log("MongoDB Error:", err));

// Event Schema
const eventSchema = new mongoose.Schema({
  name: String,
  description: String,
  date: String,
  venue: String,
  capacity: Number,
  registrations: [
    {
      name: String,
      rollNo: String,
      email: String,
      status: {
        type: String,
        default: "Confirmed"
      }
    }
  ]
});

const Event = mongoose.model("Event", eventSchema);

// Add sample event

async function seedEvent() {
  const sampleEvents = [
    {
      name: "AI & Machine Learning Workshop",
      description: "Explore artificial intelligence, machine learning and their real-world applications.",
      date: new Date("2026-11-15"),
      venue: "Seminar Hall",
      capacity: 100,
      registrations: [],
    },
    {
      name: "Web Development Bootcamp",
      description: "Learn modern web development concepts through practical activities.",
      date: new Date("2026-11-20"),
      venue: "Computer Lab 1",
      capacity: 80,
      registrations: [],
    },
    {
      name: "Tech Quiz Competition",
      description: "Test your technical knowledge and compete with other students.",
      date: new Date("2026-11-25"),
      venue: " college Auditorium",
      capacity: 60,
      registrations: [],
    },
    {
      name: "Project Expo 2026",
      description: "Showcase innovative projects and creative ideas developed by students.",
      date: new Date("2026-12-05"),
      venue: "College Open Dais",
      capacity: 120,
      registrations: [],
    },
  ];

  for (const event of sampleEvents) {
    await Event.updateOne(
      { name: event.name },
      { $setOnInsert: event },
      { upsert: true }
    );
  }

  console.log("Sample events checked successfully.");
}


// Get all events
app.get("/api/events", async (req, res) => {
  const events = await Event.find();

  res.json(events.map(e => ({
    ...e.toObject(),
    registered: e.registrations.length,
    available: e.capacity - e.registrations.length
  })));
});

// Get event details
app.get("/api/events/:id", async (req, res) => {
  const event = await Event.findById(req.params.id);
  res.json(event);
});

// Register student
app.post("/api/events/:id/register", async (req, res) => {
  try {
    const { name, rollNo, email } = req.body;

    if (!name || !rollNo || !email) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    if (event.registrations.length >= event.capacity) {
      return res.status(400).json({
        message: "Event is full"
      });
    }

    if (event.registrations.some(
      p => p.rollNo.toLowerCase() === rollNo.trim().toLowerCase()
    )) {
      return res.status(400).json({
        message: "Already registered"
      });
    }

    event.registrations.push({
      name,
      rollNo,
      email
    });

    await event.save();

    res.json({ message: "Registration successful!" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get and search participants
app.get("/api/events/:id/participants", async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({
      message: "Event not found"
    });
  }

  const search = (req.query.search || "").toLowerCase();

  const participants = event.registrations.filter(p =>
    p.name.toLowerCase().includes(search) ||
    p.rollNo.toLowerCase().includes(search)
  );

  res.json(participants);
});

// Start server
app.listen(process.env.PORT || 5000, () => {
  console.log("Server running on port 5000");
});
