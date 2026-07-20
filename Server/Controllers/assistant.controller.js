import { generateGeminiResponse } from "../Configs/gemini.js"
import User from "../Models/user.model.js"
// Knowledge loader: reads projectKnowledge.md and caches it in memory
import { getKnowledge } from "../Configs/knowledge.js"


export const getAssistantConfig = async (req, res) => {
    try {
        const { userId } = req.params

        const user = await User.findById(userId).select("-geminiApiKey")
        if (!user) {
            return res.status(404).json({ message: "failed to get user" })
        }

        return res.status(200).json({ message: "Assistant Config data ", user })

    } catch (error) {
        return res.status(500).json({ message: `Assistant Config failed ${error}` })
    }
}


export const askAssistant = async (req, res) => {
    try {
        const { message, userId } = req.body

        if (!message || !userId) {
            return res.status(400).json({ message: "Message and UserId are required" })
        }

        const user = await User.findById(userId)

        if (!user) {
            return res.status(404).json({ message: "User is not found" })
        }

        console.log(`[Ask Assistant] Incoming request for User ID: ${userId} (${user.email})`);
        console.log(`[Ask Assistant] Key starting with: ${user.geminiApiKey ? user.geminiApiKey.substring(0, 15) : "none"}`);

        if (!user.geminiApiKey) {
            return res.status(400).json({ message: "gemini apikey is not added" })
        }

        if (user.plan === "free"
            && user.totalMessages >= user.requestLimit) {
            return res.status(400).json({ message: "Free limit reached" })
        }

        if (user.plan === "pro" && new Date(user.proExpiresAt) < new Date()) {
            user.plan = "free"

            await user.save()

            return res.status(400).json({ message: "Pro plan expired" })
        }

        const cleanMessage = message.toLowerCase()

        const systemPages = [
            { name: "Home", path: "/", keywords: ["home", "homepage", "dashboard", "main", "start"] },
            { name: "Builder", path: "/builder", keywords: ["builder", "create", "customize", "edit", "assistant", "settings", "setup"] },
            { name: "Billing", path: "/billing", keywords: ["billing", "pricing", "plans", "payment", "upgrade", "pro", "subscription"] }
        ];

        const allPages = [...systemPages, ...(user.pages || [])];

        if (user.enableNavigation) {

            // Navigation Commands
            const navigationWords = [
                "open",
                "go to",
                "go",
                "start",
                "show",
                "navigate",
                "take me to",
                "take me",
                "kholo",
                "dikha",
                "dikhao",
                "le jao",
                "chalo",
                "jao",
                "page",
            ];

            // Check navigation intent
            const wantsNavigation =
                navigationWords.some((word) =>
                    cleanMessage.includes(word)
                );

            // User wants navigation
            if (wantsNavigation) {

                // Find matching page
                const matchedPage =
                    allPages.find((page) =>
                        page.keywords.some((keyword) =>
                            cleanMessage.includes(
                                keyword.toLowerCase()
                            )
                        )
                    );

                // Page found
                if (matchedPage) {

                    // Already open
                    if (
                        req.body.currentPath ===
                        matchedPage.path
                    ) {
                        return res.json({
                            success: true,
                            response:
                                `${matchedPage.name} already open`
                        });
                    }

                    // Navigate
                    return res.json({
                        success: true,
                        action: "navigate",
                        path: matchedPage.path,
                        response:
                            `Opening ${matchedPage.name}`,
                    });
                }
            }
        }


        // Build pages info for the prompt
        const pagesInfo = allPages.map(p => `- ${p.name}: ${p.path} (keywords: ${p.keywords.join(', ')})`).join('\n');

        // Load the knowledge file content (auto-reloads if file was updated on disk)
        const knowledgeContent = getKnowledge();

        const prompt = `

You are ${user.assistantName}, a professional website assistant for ${user.businessName}.

Business Name:
${user.businessName}

Business Type:
${user.businessType}

Business Description:
${user.businessDescription}

Assistant Tone:
${user.tone}

--- PROJECT KNOWLEDGE BASE (Primary Source of Truth) ---
${knowledgeContent}
--- END KNOWLEDGE BASE ---

Navigation Pages Configured on this Website:
${pagesInfo}

CRITICAL RULES FOR LANGUAGE & BEHAVIOR:
1. **No Robotic Translations / Keep UI Labels in English**:
   - Never translate website features, menu names, page names, or button labels into Hindi. Always keep them in English.
   - For example: Use "Home", "Dashboard", "Billing", "Settings", "AI Assistant", "Users", "Analytics", "Embed code". Never use "Ghar", "Upyogakarta", etc.
2. **Language Mirroring**:
   - Respond in the exact language script the user used. Never use Devanagari (Hindi characters). Always reply in English letters (Latin alphabet).
   - If user asks in English (e.g. "What are the features of this website?"), reply in professional, smooth English.
   - If user asks in conversational Hindi/Hinglish (e.g. "is website ke features batao"), reply in conversational Hinglish.
3. **Conversational Responses (Not Robotic)**:
   - Talk naturally like ChatGPT, Gemini, Siri, or Alexa.
   - Do not repeat the user's question back to them.
   - Keep answers professional, smooth, and conversational.
4. **Length Constraint**:
   - Keep responses extremely short and concise, strictly between 10 to 20 words (max 25 words). This is crucial for rapid voice playback.
5. **No Hallucination**:
   - Only speak about features and pages documented in the knowledge base above. Do not invent pages or features.

EXAMPLES:
- User: "shifra iss website ke features batao"
- Response: "Is website par Home, Dashboard, Billing, Settings aur Voice Assistant jaise features available hain."

- User: "what is the features in this website"
- Response: "This platform features custom voice assistant building, billing management, settings configuration, and single-script embedding."

- User: "tell me about this website"
- Response: "Shifra AI allows you to build custom voice assistants and embed them on any website easily."

- User: "is website pe main kya kar sakta hoon?"
- Response: "Aap yahan custom voice assistant design kar sakte hain, billing status check kar sakte hain aur embed script pa sakte hain."

User Question:
${message}

`;

     const aiResponse = await generateGeminiResponse({prompt ,apikey: user.geminiApiKey , user })

    if(user.plan === "free"){
        user.totalMessages += 1

     await user.save()

    }
    return  res.json({
                success: true,
                aiResponse
            });

    } catch (error) {

        console.error("Assistant AI Error:", error.message)

        return  res.status(500).json({
                success: false,
                message:
                    error.message || "Assistant AI Error",
            });

    }
}


