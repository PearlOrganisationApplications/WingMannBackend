import axios from "axios";
import User from "../models/User.js";

// Cosine similarity function
const cosineSimilarity = (a, b) => {
  let dot = 0, normA = 0, normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const recommendProfiles = async (req, res) => {
  try {
    const imagePath = req.file?.path;

    if (!imagePath) {
      return res.status(400).json({ message: "Image is required" });
    }

    // 🔥 Call Python service to get embedding
    const response = await axios.post("http://localhost:5001/embed", {
      imagePath,
    });

    const userVector = response.data.embedding;

    // 🔥 Fetch all users with embeddings
    const users = await User.find({ embedding: { $exists: true } });

    // 🔥 Compare similarity
    const scoredUsers = users.map((u) => ({
      user: u,
      score: cosineSimilarity(userVector, u.embedding),
    }));

    // 🔥 Sort & get top matches
    const topMatches = scoredUsers
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    res.status(200).json({
      success: true,
      recommendations: topMatches,
    });

  } catch (error) {
    console.error("Recommendation Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};