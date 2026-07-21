(function () {


    // userData

    const script = document.currentScript;

    const userId = script?.dataset?.userId

    const theme = "light"

    let assistantConfig = null


    // load CSS

    const link = document.createElement("link")

    link.rel = "stylesheet"

    link.href = "http://localhost:5173/assistant.css"

    document.head.appendChild(link)


    // Create PopUp

    const popup = document.createElement("div")

    popup.className = `shifra-popup theme-${theme}`

    popup.innerHTML = `
    <div class="shifra-overlay"></div>

    <div class="shifra-content">

       <div class="shifra-top">
            <div class="shifra-orb-wrap">

                <div class="shifra-orb-glow"></div>

                <div class="shifra-orb"></div>

            </div>

            <h2 class="shifra-title">
                Hello! I'm Shifra AI
            </h2>

            <p class="shifra-sub">
                Your smart voice assistant.
                <br />
                Ask anything about your website.
            </p>


            <div class="shifra-status">
                Tap button to Speak
            </div>

            <div class="shifra-wave">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </div>

            <!-- User Text -->
            <div class="shifra-user-text">
            </div>

            <!-- AI Text -->
            <div class="shifra-ai-text">
            </div>
  
        </div>


        <div class="shifra-bottom">
            
            <button class="shifra-mic">

               <img 
               src="http://localhost:5173/mic.svg"
               alt="mic"
               class="shifra-mic-icon"/>
            </button>

            <!-- Text input (hidden by default, shown when voice is disabled) -->
            <div class="shifra-text-input-wrap" style="display:none;">
                <input type="text" class="shifra-text-input" placeholder="Type your message..." />
                <button class="shifra-send-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        </div>
    </div>
    
    `;

    document.body.appendChild(popup);

    // floating Button

    const button = document.createElement("button")

    button.className = `shifra-btn theme-${theme}`

    button.innerHTML = `
    <img 
    src="http://localhost:5173/logo.png"
    alt="logo"
    />`;
    document.body.appendChild(button)




    // toggle popup

    let open = false

    button.onclick = () => {
        open = !open;
        popup.style.display = open ? "flex" : "none";
    }


    // load Assistant

    const loadAssistant = async () => {
        try {
            const res = await fetch(`https://shifra-ai-backend-kvuv.onrender.com/api/assistant/config/${userId}`)

            const data = await res.json()

            if (data) {
                assistantConfig = data.user
                applyConfig()
            }

        } catch (error) {
            console.log(
                "Assistant Load Error:",
                error
            );
        }
    }


    const applyConfig = () => {
        if (!assistantConfig) return;

        popup.className = `shifra-popup theme-${assistantConfig.theme}`

        button.className = `shifra-btn theme-${assistantConfig.theme}`

        const title = popup.querySelector(".shifra-title")

        title.innerHTML = `Hello! I'm ${assistantConfig.assistantName}`;

        const subTitle = popup.querySelector(".shifra-sub")
        subTitle.innerHTML = `
    Welcome to
    ${assistantConfig.businessName}.
    <br />
    Ask anything about your website.
  `;

        // Handle enableVoice setting
        const micBtn = popup.querySelector(".shifra-mic");
        const textInputWrap = popup.querySelector(".shifra-text-input-wrap");

        if (assistantConfig.enableVoice === false) {
            // Voice disabled: hide mic, show text input
            micBtn.style.display = "none";
            textInputWrap.style.display = "flex";
            status.innerText = "Type your message";
        } else {
            // Voice enabled: show mic, hide text input
            micBtn.style.display = "flex";
            textInputWrap.style.display = "none";
            status.innerText = "Tap button to Speak";
        }

    }

    loadAssistant()


    // Element


    const status =
        popup.querySelector(
            ".shifra-status"
        );

    const wave =
        popup.querySelector(
            ".shifra-wave"
        );

    const userText =
        popup.querySelector(
            ".shifra-user-text"
        );

    const aiText =
        popup.querySelector(
            ".shifra-ai-text"
        );

    const mic =
        popup.querySelector(
            ".shifra-mic"
        );

    const textInput =
        popup.querySelector(
            ".shifra-text-input"
        );

    const sendBtn =
        popup.querySelector(
            ".shifra-send-btn"
        );


    let chatHistory = [];

    // Send message to AI (shared by voice and text)
    const sendToAI = async (text) => {
        try {
            status.innerText = "Thinking...";

            const res = await fetch("https://shifra-ai-backend-kvuv.onrender.com/api/assistant/ask", {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                },
                body: JSON.stringify({
                    message: text,
                    userId,
                    currentPath: window.location.pathname,
                    chatHistory // Pass conversation history to backend
                })
            })

            const data = await res.json()
            console.log(data)

            if (data.success) {

                if (data.action === "navigate") {
                    speak(data.response)

                    setTimeout(() => {
                        window.location.href = data.path

                    }, 1500)

                } else {
                    speak(data.aiResponse)
                    
                    // Update chat history with user and AI messages
                    chatHistory.push({ role: "user", parts: [{ text }] });
                    chatHistory.push({ role: "model", parts: [{ text: data.aiResponse }] });
                    
                    // Keep only the last 10 messages (5 exchanges)
                    if (chatHistory.length > 10) {
                        chatHistory = chatHistory.slice(chatHistory.length - 10);
                    }
                }

            } else {
                speak(data.message || "Something went wrong, please try again")

            }

        } catch (error) {
            console.log(error)
            speak("AI Server Error")

        }
    }


    // Pre-trigger voice loading
    if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.getVoices();
            };
        }
    }

    const speak = (text) => {
        window.speechSynthesis.cancel();

        // Show AI response
        aiText.innerText =
            text;

        status.innerText =
            "AI Speaking...";

        // Check if voice is enabled
        if (assistantConfig && assistantConfig.enableVoice === false) {
            // Voice disabled: just show text, no speech
            status.innerText = "Type your message";
            return;
        }

        const speech = new SpeechSynthesisUtterance(text)

        // Dynamic language detection
        const containsHindi = /[\u0900-\u097F]/.test(text);

        if (containsHindi) {
            speech.lang = "hi-IN";
        } else {
            // Hinglish or pure English written in Latin script
            speech.lang = "en-US";
        }

        // Try to select premium human-like female voice
        if (window.speechSynthesis && window.speechSynthesis.getVoices) {
            const voices = window.speechSynthesis.getVoices();
            let selectedVoice = null;

            if (speech.lang === "hi-IN") {
                // Find Hindi female voice
                selectedVoice = voices.find(v => v.lang.includes("hi-IN") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Female") || v.name.includes("Lekha") || v.name.includes("Kalpana")));
                if (!selectedVoice) selectedVoice = voices.find(v => v.lang.includes("hi-IN"));
            } else {
                // Find a standard clean female English voice
                const femaleKeywords = ["zira", "samantha", "veena", "heera", "hazel", "susan", "female", "google us english", "karen", "moira", "tessa"];
                selectedVoice = voices.find(v => (v.lang.includes("en-US") || v.lang.includes("en-GB") || v.lang.includes("en-IN")) && 
                    femaleKeywords.some(keyword => v.name.toLowerCase().includes(keyword))
                );
                
                // Fallback to any en-US/en-GB female voice
                if (!selectedVoice) {
                    selectedVoice = voices.find(v => (v.lang.includes("en-US") || v.lang.includes("en-GB")) && v.name.toLowerCase().includes("female"));
                }
                
                // Absolute fallback
                if (!selectedVoice) {
                    selectedVoice = voices.find(v => v.lang.includes("en-US") || v.lang.includes("en-GB"));
                }
            }

            if (selectedVoice) {
                speech.voice = selectedVoice;
            }
        }

        speech.rate = 0.95; // Slightly slower rate for natural pause simulation

        speech.pitch = 1;

        speech.volume = 1;

        // Voice end
        speech.onend = () => {

            if (assistantConfig && assistantConfig.enableVoice === false) {
                status.innerText = "Type your message";
            } else {
                status.innerText = "Tap button to Speak";
            }

            wave.style.opacity =
                "0";
        };

        // Start speaking
        window.speechSynthesis.speak(
            speech
        );
    }


    // Text input handling
    const handleTextSubmit = () => {
        const text = textInput.value.trim();
        if (!text) return;

        userText.innerText = "You: " + text;
        textInput.value = "";
        wave.style.opacity = "1";

        sendToAI(text);
    }

    sendBtn.onclick = handleTextSubmit;

    textInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            handleTextSubmit();
        }
    });


    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition


    if(SpeechRecognition){

        const recognition = new SpeechRecognition();

        recognition.lang =
      "en-IN";

    recognition.continuous =
      false;

    recognition.interimResults =
      false;


      mic.onclick=()=>{
        wave.style.opacity =
        "1";

      status.innerText =
        "Listening...";

      userText.innerText =
        "";

      aiText.innerText =
        "";

      recognition.start();
      }


      recognition.onresult = (e)=>{
        const text = e.results[0][0].transcript

        userText.innerText = "You: " + text;

        recognition.stop();


        setTimeout(() => {
            sendToAI(text);
        }, 600);
      };

      recognition.onerror = ()=>{
        status.innerText =
          "Tap button to Speak";

        wave.style.opacity =
          "0";
      }


    }
    else{
        status.innerText =
      "Speech Recognition not supported";
    }


})();
