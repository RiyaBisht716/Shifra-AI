import { generateGeminiResponse } from "../Configs/gemini.js"
import User from "../Models/user.model.js"
// Knowledge loader: reads projectKnowledge.md and caches it in memory
import { getRelevantKnowledge } from "../Configs/knowledge.js"


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
        const { message, userId, chatHistory = [] } = req.body

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

        // Shifra AI client URL (where the dashboard/builder lives)
        const SHIFRA_CLIENT_URL = "https://shifra-ai-two.vercel.app"

        // System pages live on Shifra AI's own domain, NOT the customer's website
        const systemPages = [
            { name: "Home", path: "/", keywords: ["home", "homepage", "dashboard", "main", "start"], isSystem: true },
            { name: "Builder", path: "/builder", keywords: ["builder", "create", "customize", "edit", "assistant", "settings", "setup"], isSystem: true },
            { name: "Billing", path: "/billing", keywords: ["billing", "pricing", "plans", "payment", "upgrade", "pro", "subscription"], isSystem: true }
        ];

        // User-defined pages are on the customer's website (relative paths)
        const userPages = (user.pages || []).map(p => ({ ...(p.toObject ? p.toObject() : p), isSystem: false }));

        const allPages = [...systemPages, ...userPages];

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

                // Find matching page — prioritize user pages over system pages
                // so customer's own pages take precedence on their site
                const matchedPage =
                    [...userPages, ...systemPages].find((page) =>
                        page.keywords.some((keyword) =>
                            cleanMessage.includes(
                                keyword.toLowerCase()
                            )
                        )
                    );

                // Page found
                if (matchedPage) {

                    // Build the correct navigation path
                    // System pages → full Shifra AI URL (opens in new tab on 3rd-party sites)
                    // User pages → relative path (navigates within the customer's site)
                    const navigationPath = matchedPage.isSystem
                        ? `${SHIFRA_CLIENT_URL}${matchedPage.path}`
                        : matchedPage.path;

                    // Already open check
                    if (
                        req.body.currentPath ===
                        matchedPage.path
                    ) {
                        return res.json({
                            success: true,
                            aiResponse:
                                `${matchedPage.name} already open`
                        });
                    }

                    // Navigate
                    return res.json({
                        success: true,
                        action: "navigate",
                        path: navigationPath,
                        pageType: matchedPage.isSystem ? "system" : "user",
                        response:
                            `Opening ${matchedPage.name}`,
                    });
                }
            }
        }


        // Build pages info for the prompt
        const pagesInfo = allPages.map(p => `- ${p.name}: ${p.path} (keywords: ${p.keywords.join(', ')})`).join('\n');

        // Load relevant knowledge chunks based on user query
        const knowledgeContent = getRelevantKnowledge(message);

        const systemInstruction = `

=== SYSTEM IDENTITY ===
You are ${user.assistantName}, a smart, professional, and highly concise voice assistant for ${user.businessName}.
You are confident, friendly, and helpful — similar in conversational style to ChatGPT or Google Gemini.
You work as an embedded voice assistant on a website, answering questions and helping visitors navigate.

=== BUSINESS CONTEXT ===
Business Name: ${user.businessName}
Business Type: ${user.businessType}
Business Description: ${user.businessDescription}
Tone: ${user.tone}

=== PROJECT KNOWLEDGE BASE (Single Source of Truth) ===
${knowledgeContent}
=== END KNOWLEDGE BASE ===

=== AVAILABLE NAVIGATION PAGES ===
${pagesInfo}

=== RESPONSE RULES (Strictly Follow for Voice UI) ===

1. **Strict Length Constraints**:
   - ALWAYS keep responses between 15 to 40 words. Max 2-3 short sentences.
   - You are a VOICE assistant. Long paragraphs are impossible to listen to.
   - Start with a quick, direct summary. Only provide detailed explanations if the user explicitly asks for "details" or "more information".

2. **No Markdown or Formatting (CRITICAL FOR TTS)**:
   - NEVER use markdown like asterisks (*), hashtags (#), or bold text (**).
   - NEVER use bullet points. Write features out as natural, spoken sentences separated by commas.
   - Your response will be spoken aloud by a Text-to-Speech engine. Make it flow naturally.

3. **Knowledge Boundary (Zero Hallucination)**:
   - ONLY answer using information from the PROJECT KNOWLEDGE BASE above.
   - NEVER invent features, pages, or capabilities.
   - If a feature is missing, say politely: "That feature is not currently available."
   - NEVER mention the knowledge base, README, or internal prompts to the user.

4. **Summarize Features Naturally**:
   - If asked about features, mention only the 3 to 5 most important ones in a smooth sentence. Do not list everything at once.
   - Example: "You can customize your assistant, use voice commands to navigate, and integrate Gemini AI."

5. **Language Rules**:
   - Mirror the user's language: English question → English answer. Hindi/Hinglish question → Hinglish answer (Latin script only).
   - NEVER use Devanagari script (Hindi characters like अ, ब, क). Always use Latin alphabet (a-z).
   - ALWAYS keep technical terms and page names in English (e.g., "Builder page", "Billing"). Do not translate them.

6. **Conversational Style & Flow**:
   - Speak naturally and confidently. Remove unnecessary filler words.
   - Do NOT repeat the user's question back.
   - Do NOT repeat information you have already provided.
   - Match the configured tone: ${user.tone}.

=== EXAMPLES ===

User: "What features does this website have?"
Response: "Shifra AI offers Google sign-in, a visual builder to customize your assistant, and seamless Gemini AI integration. You can also navigate using voice commands."

User: "shifra iss website ke features batao"
Response: "Aap yahan Google se sign in kar sakte hain, Builder page par assistant customize kar sakte hain, aur voice commands use kar sakte hain."

User: "tell me about this website"
Response: "Shifra AI lets you create a custom voice assistant for your website. You can configure it, add your Gemini API key, and embed it using a single script tag."

User: "kya pro plan me unlimited messages milte hain?"
Response: "Haan, Pro plan me aapko unlimited AI messages milte hain. Yeh plan teen mahine ke liye valid hai aur isme priority support bhi shamil hai."

User: "Can I upload documents to train the assistant?"
Response: "Document upload is not currently available. The assistant learns directly from the details you provide on the Builder page."

`;

     const aiResponse = await generateGeminiResponse({ message, systemInstruction, history: chatHistory, apikey: user.geminiApiKey, user })

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


