import User from "../Models/user.model.js"


export const getCurrentUser = async (req,res) => {
    try {
        const user = await User.findById(req.userId)
        if(!user){
            return res.status(404).json({message:"Failed to get current user"})
        }
        return res.status(200).json(user)
    } catch (error) {
        console.log(error)
         return res.status(500).json({message:`getCurrentUser error ${error}`})
    }
}


// Helper: validate a Gemini API key by making a lightweight test call
const validateGeminiKey = async (apiKey) => {
    try {
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(testUrl);

        if (response.ok) {
            return { valid: true };
        }

        let errorDetail = "";
        try {
            const errBody = await response.json();
            errorDetail = errBody?.error?.message || JSON.stringify(errBody);
        } catch {
            errorDetail = "Unknown error";
        }

        return { valid: false, error: errorDetail, status: response.status };
    } catch (error) {
        return { valid: false, error: error.message, status: 0 };
    }
};


export const saveAssistant = async (req,res) => {
    try {
        const {
        assistantName,
        businessName,
        businessType,
        businessDescription,
        tone,
        theme,
        enableVoice,
        enableNavigation,
        geminiApiKey,
        pages,
        } = req.body

        const user = await User.findById(req.userId)
        if(!user){
            return res.status(404).json({message:"Failed to get current user"})
        }
        user.assistantName = assistantName;
        user.businessName = businessName;
        user.businessType = businessType;
        user.businessDescription = businessDescription;
        user.tone = tone;
        user.theme = theme;
        user.enableVoice = enableVoice !== undefined ? enableVoice : true;
        user.enableNavigation = enableNavigation !== undefined ? enableNavigation : true;

        if(geminiApiKey){
            const trimmedKey = geminiApiKey.trim();

            // Validate the key before saving
            const validation = await validateGeminiKey(trimmedKey);
            if (!validation.valid) {
                return res.status(400).json({
                    message: `Invalid Gemini API Key: ${validation.error}. Please check your key and try again.`
                });
            }

            user.geminiApiKey = trimmedKey;
        }
        user.geminiStatus = "active";
        user.pages = pages || [];

        user.isSetupComplete = true
        await user.save()

        return res.status(200).json({ message:
          "Assistant saved successfully",
        user})
    } catch (error) {
        return res.status(500).json({message:`failed to save Assistant ${error}`})
    }
}


// Test Gemini API key endpoint
export const testGeminiKey = async (req, res) => {
    try {
        const { geminiApiKey } = req.body;

        if (!geminiApiKey) {
            return res.status(400).json({ success: false, message: "API key is required" });
        }

        const trimmedKey = geminiApiKey.trim();
        const validation = await validateGeminiKey(trimmedKey);

        if (validation.valid) {
            return res.status(200).json({ success: true, message: "API key is valid!" });
        } else {
            return res.status(400).json({
                success: false,
                message: `Invalid API Key: ${validation.error}`
            });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: `Test failed: ${error.message}` });
    }
};
