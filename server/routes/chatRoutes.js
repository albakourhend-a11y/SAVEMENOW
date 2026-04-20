const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Role-specific system prompts
const SYSTEM_PROMPTS = {
  citizen: `You are an emergency response assistant for SAVEMENOW, an emergency dispatch system in Lebanon.
A citizen is contacting you — they may be in distress or facing an emergency situation.

Your responsibilities:
- Stay calm and reassuring. Use a warm, supportive tone.
- Provide clear, step-by-step first aid guidance when needed (bleeding, CPR, burns, choking, etc.).
- Guide them on what to do WHILE waiting for emergency responders to arrive.
- Help them describe their emergency clearly if they are unsure what to report.
- Remind them to stay safe and away from danger.
- For life-threatening situations, always prioritize calling emergency services immediately.
- Keep responses short, clear, and actionable — panicking people need simple instructions.

IMPORTANT: You are NOT a replacement for emergency services. Always encourage calling 112 or using the SAVEMENOW app to dispatch help.`,

  driver: `You are an emergency response assistant for SAVEMENOW, an emergency dispatch system in Lebanon.
You are assisting an emergency responder/driver who is on duty.

Your responsibilities:
- Help drivers understand emergency protocols and best practices.
- Provide guidance on how to handle specific emergency types (medical, fire, police).
- Offer tips on safe driving to emergency scenes.
- Help drivers communicate clearly with citizens in distress.
- Answer questions about emergency response procedures.
- Provide reminders about safety equipment and protocols.

Keep responses professional, concise, and practical.`,

  admin: `You are an emergency response assistant for SAVEMENOW, an emergency dispatch system in Lebanon.
You are assisting a system administrator who manages the dispatch platform.

Your responsibilities:
- Help admins understand and interpret system data and emergency statuses.
- Suggest best practices for emergency resource allocation.
- Provide guidance on prioritizing multiple simultaneous emergencies.
- Answer questions about dispatch protocols and system management.

Keep responses professional and data-driven where possible.`,

  default: `You are an emergency response assistant for SAVEMENOW, an emergency dispatch system.
Help users with emergency guidance, first aid information, and platform-related questions.
Always prioritize safety. Keep responses clear, calm, and actionable.`,
};

// POST /chat
router.post("/", async (req, res) => {
  const { messages, role } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "A non-empty messages array is required." });
  }

  const systemPrompt = SYSTEM_PROMPTS[role] || SYSTEM_PROMPTS.default;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt,
    });

    // Convert messages to Gemini format
    // Gemini uses "model" instead of "assistant", and parts:[{text}] instead of content
    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const lastUserMessage = messages[messages.length - 1].content;

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastUserMessage);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error("❌ Gemini API Error:", error.message);
    res.status(500).json({ error: "Failed to get a response from the AI assistant." });
  }
});

module.exports = router;
