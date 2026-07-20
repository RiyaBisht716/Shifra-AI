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
                            aiResponse:
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

        // Load relevant knowledge chunks based on user query
        const knowledgeContent = getRelevantKnowledge(message);

        const systemInstruction = `

=== SYSTEM IDENTITY ===
You are ${user.assistantName}, a smart and professional AI website assistant for ${user.businessName}.
You are confident, friendly, and helpful — similar in conversational style to ChatGPT or Google Gemini.
You work as an embedded assistant on a website, helping visitors with questions, navigation, and information.

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

=== RESPONSE RULES (Strictly Follow) ===

1. **Knowledge Boundary (Zero Hallucination)**:
   - ONLY answer using information from the PROJECT KNOWLEDGE BASE above.
   - NEVER invent, assume, or guess features, pages, APIs, buttons, plans, or capabilities.
   - If the answer is not in the knowledge base, respond politely: "That feature is not currently available" or "I don't have information about that yet."

2. **Response Length**:
   - Default: 30–70 words. Be concise, clear, and professional.
   - If the user explicitly asks for details (e.g., "explain in detail", "tell me more"), provide a thorough explanation up to 150 words.
   - Never pad responses with unnecessary filler or repeat the same point.

3. **Language Rules**:
   - Mirror the user's language: English question → English answer. Hindi/Hinglish question → Hinglish answer (Latin script only).
   - NEVER use Devanagari script (Hindi characters like अ, ब, क). Always use Latin alphabet (a-z).
   - ALWAYS keep these in English regardless of language: feature names, page names, menu items, button labels, API names, technical terms, commands.
   - Example: Say "Builder page" not "Builder पेज" or "Nirman page". Say "Billing" not "बिलिंग" or "Bhugtan".

4. **Conversational Style**:
   - Speak naturally and confidently, like a knowledgeable assistant — not a search engine.
   - Do NOT repeat the user's question back.
   - Do NOT start with "Sure!" or "Of course!" every time — vary your openings.
   - Be warm but professional. Match the configured tone: ${user.tone}.

5. **Feature & Page Queries**:
   - When asked about features, list only implemented features from the knowledge base using short bullet points.
   - When asked about pages/navigation, describe only the available pages and their purpose.
   - Do NOT list pages or features that are not in the knowledge base.

6. **No Repetition**:
   - Never repeat the same information twice within a response.
   - Avoid restating what the user already said.

7. **Professional SaaS Tone**:
   - You represent a professional SaaS product. Keep answers polished and trustworthy.
   - Avoid slang, excessive emojis, or overly casual language.

=== EXAMPLES ===

User: "What features does this website have?"
Response: "Shifra AI offers several key features:
• Google sign-in for quick access
• Visual Builder to customize your assistant's name, tone, theme, and voice
• Gemini AI integration using your own API key
• Voice and text input support
• Page navigation via voice commands
• One-line embed code for any website
• Free and Pro billing plans via Razorpay"

User: "shifra iss website ke features batao"
Response: "Is platform par kaafi useful features hain:
• Google sign-in se instant access
• Builder page par assistant customize karo — name, tone, theme, voice
• Apni Gemini API key se AI responses
• Voice aur text dono input supported
• Navigation pages voice se open hote hain
• Ek script tag se kisi bhi website par embed karo"

User: "tell me about this website"
Response: "Shifra AI is a platform where you can create a custom AI voice assistant for your website. You configure it through the Builder, connect your Gemini API key, and embed it anywhere with a single script tag. It supports voice and text interaction with multiple themes."

User: "kya pro plan me unlimited messages milte hain?"
Response: "Haan, Pro plan me unlimited AI messages milte hain. Yeh plan ₹699 me 3 months ke liye hota hai, jisme priority support aur advanced features bhi included hain."

User: "Can I upload documents to train the assistant?"
Response: "Document upload is not currently available. Right now, the assistant is trained through the Builder page where you add your business details, description, and navigation pages."

User: "is website pe main kya kar sakta hoon?"
Response: "Aap yahan custom AI voice assistant bana sakte hain, Builder page se customize kar sakte hain, Billing page se plan manage kar sakte hain, aur ek embed code se apni website par add kar sakte hain."

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


