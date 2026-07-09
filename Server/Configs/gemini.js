const Gemini_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"


export const generateGeminiResponse = async ({
    prompt,
    apikey,
    user
}) => {
    try {

        if (!apikey) {
            throw new Error("Gemini API key missing")
        }

        const response = await fetch(`${Gemini_URL}?key=${apikey.trim()}`, {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ]
            })

        })

        if (!response.ok) {

        // Parse error details from Gemini
        let errorDetail = "";
        try {
          const errBody = await response.json();
          errorDetail = errBody?.error?.message || JSON.stringify(errBody);
        } catch {
          errorDetail = await response.text().catch(() => "Unknown error");
        }

        console.error(`Gemini API Error [${response.status}]:`, errorDetail);

        // 401 is always an invalid API key
        // 400 could be invalid key OR a bad request — check the error message
        if (response.status === 401 ||
          (response.status === 400 &&
            errorDetail.toLowerCase().includes("api key"))
        ) {

          user.geminiStatus =
            "invalid";

          await user.save();

          throw new Error(
            "Invalid API Key. Please update your Gemini API key."
          );
        }

        // Other 400 errors (bad request, model issues, etc.)
        if (response.status === 400) {
          throw new Error(
            `Bad request: ${errorDetail}`
          );
        }

        // Forbidden
        if (response.status === 403) {
          throw new Error(
            "API access forbidden. Check your Gemini API permissions."
          );
        }

        // Quota / Rate Limit Exceeded
        if (
          response.status === 429
        ) {

          user.geminiStatus =
            "quota_exceeded";

          await user.save();

          throw new Error(
            "Rate limit exceeded. Please wait a moment and try again."
          );
        }

        // Server errors (5xx)
        if (response.status >= 500) {
          throw new Error(
            "Gemini service is temporarily unavailable. Please try again later."
          );
        }

        // Fallback for other status codes
        throw new Error(
          `Gemini API error (${response.status}): ${errorDetail}`
        );
      }

      // =========================
      // SUCCESS STATUS
      // =========================

      user.geminiStatus =
        "active";

      await user.save();

      const data = await response.json()
      

      const text = data.candidates?.[0]
        ?.content?.parts?.[0]
        ?.text;

         if (!text) {

        throw new Error(
          "No text returned from Gemini"
        );
      }

      return text.trim();
    } catch (error) {

         console.error(
        "Gemini Fetch Error:",
        error.message
      );

      // Re-throw with the original message so the controller can relay it
      throw error;

    }
}