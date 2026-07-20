# Shifra AI — Project Knowledge Base

> **Single source of truth for all project-related information.**
> Generated from actual codebase analysis. No assumed or invented features.

---

## Project Overview

**Shifra AI** is a full-stack web platform that lets website owners create, customize, and embed an AI-powered voice assistant on any website. Users sign up via Google, configure their assistant through a visual builder, and embed it on external websites using a single `<script>` tag.

**Created by:** Riya Bisht
**Repository:** RiyaBisht716/Shifra-AI

---

## Purpose

Enable website owners to add a smart, voice-enabled AI assistant to their websites without writing code. The assistant can answer visitor questions, navigate pages via voice commands, and be fully customized in appearance and behavior.

---

## Core Features

| Feature | Description |
|---|---|
| Google Authentication | Firebase Google sign-in (popup). No email/password auth. |
| Visual Builder Dashboard | Configure assistant name, business info, tone, theme, voice, navigation, pages, and Gemini API key. |
| Embeddable Widget | Single `<script>` tag to embed the assistant on any website. |
| Voice Assistant (Speech-to-Text) | Browser-native `SpeechRecognition` / `webkitSpeechRecognition` for voice input. |
| Voice Assistant (Text-to-Speech) | Browser-native `SpeechSynthesis` for AI voice output with dynamic language detection. |
| Text Input Mode | When voice is disabled, users can type messages via a text input field in the widget. |
| Gemini AI Integration | Uses `gemini-2.5-flash` model via the user's own Gemini API key. |
| Conversational Page Navigation | Assistant detects navigation intent and redirects the visitor to matching pages. |
| API Key Validation | Live test of Gemini API key before saving, with instant feedback. |
| Billing & Payments | Razorpay integration for upgrading to the Pro plan. |
| Theming | 4 widget themes: `light`, `dark`, `glass`, `neon`. |
| Tone Configuration | 3 tones: `friendly`, `professional`, `sales`. |
| Usage Tracking | Tracks `totalMessages` per user; enforces `requestLimit` on free plan. |
| Pro Plan Expiry | Pro plan auto-expires after 90 days; reverts to free plan. |

---

## Website Pages

### 1. Login Page (`/login`)

- **File:** `Client/src/pages/Login.jsx`
- Displays platform features (Voice AI, Smart Navigation, Easy Embed, Fast Responses).
- "Continue with Google" button triggers Firebase Google popup sign-in.
- On success: sends `name` and `email` to `POST /api/auth/google`, sets JWT cookie, redirects to `/`.
- Shows detailed error messages for Firebase auth errors.

### 2. Home Page (`/`)

- **File:** `Client/src/pages/Home.jsx`
- Landing page with hero section: "Add a Virtual Assistant to your website."
- Displays `AssistantPreview` component (interactive theme-switchable preview).
- "Get started in minutes" section with 4 steps: Sign up free → Customize assistant → Train your assistant → Embed anywhere.
- Footer with copyright: "© {year} ShifraAI by Riya Bisht."
- CTA button: "Build Your Assistant" → navigates to `/builder`.

### 3. Builder Page (`/builder`)

- **File:** `Client/src/pages/Builder.jsx`
- **Two states:**
  - **View mode** (when `isSetupComplete` is true and not editing): Shows assistant summary, current plan, Gemini status, messages left / plan expiry, embed code with copy button, and "Edit Assistant" button.
  - **Edit mode** (when `isSetupComplete` is false or user clicks Edit): Full form with:
    - Basic Information: Assistant Name, Business Name, Business Type, Business Description.
    - Appearance: Theme selector (light/dark/glass/neon), Tone selector (friendly/professional/sales), Enable Voice toggle, Enable Navigation toggle.
    - Gemini API Key: Input field, "Test Key" button, "Get API KEY" link to `https://aistudio.google.com/app/apikey`.
    - Navigation Pages: Add pages with name, path, and keywords. Remove pages.
- Save/Update button calls `POST /api/user/save-assistant`.
- Generates embed code: `<script src="{CLIENT_URL}/assistant.js" data-user-id="{userId}"></script>`.

### 4. Billing Page (`/billing`)

- **File:** `Client/src/pages/Billing.jsx`
- Redirects to `/builder` if `isSetupComplete` is false.
- Status cards: Current Plan, Gemini Status, Messages Left (free) / Plan Expiry (pro).
- Two plan cards:
  - **Free Plan:** ₹0 — 200 AI messages, voice assistant, navigation support, basic customization.
  - **Pro Plan:** ₹699 — 3 months access, unlimited AI messages, advanced AI assistant, priority performance, unlimited navigation, premium support.
- "Upgrade Now" button triggers Razorpay checkout; disabled if already on Pro plan.

---

## Navigation

### Navbar (`Client/src/Components/Navbar.jsx`)

- Sticky top bar with logo, "Shifra AI" branding.
- Desktop: Builder button, Billing button, user avatar (initial), name, email, logout button.
- Mobile: Hamburger menu with the same options.
- Logo click navigates to `/`.
- Logout calls `GET /api/auth/logout`, clears user state, redirects to `/login`.

### Protected Routes (`Client/src/Components/ProtectedRoute.jsx`)

- Shows loading spinner while fetching user.
- Redirects to `/login` if no user is authenticated.
- Wraps Home, Builder, and Billing pages.

### Route Structure

| Path | Component | Auth Required |
|---|---|---|
| `/login` | Login | No |
| `/` | Home | Yes |
| `/builder` | Builder | Yes |
| `/billing` | Billing | Yes |
| `*` (catch-all) | Redirects to `/` | Yes |

---

## AI Assistant (Embeddable Widget)

### Files

- `Client/public/assistant.js` — Widget JavaScript (IIFE).
- `Client/public/assistant.css` — Widget styles with 4 theme variants.
- `Client/public/mic.svg` — Microphone icon.
- `Client/public/logo.png` — Shifra AI logo.
- `Client/public/test-widget.html` — Test page for widget.

### Widget Behavior

1. Reads `data-user-id` from the `<script>` tag.
2. Loads CSS dynamically.
3. Creates a floating button (bottom-right corner) with the Shifra AI logo.
4. Creates a popup (360×580px, rounded) that toggles on button click.
5. Fetches assistant config from `GET /api/assistant/config/{userId}`.
6. Applies config: theme, assistant name, business name, voice/text input mode.

### Voice Input Flow

1. User clicks mic button → `SpeechRecognition.start()`.
2. Status shows "Listening…" with animated wave bars.
3. On result: displays user's spoken text, sends to `POST /api/assistant/ask`.
4. Receives AI response → speaks via `SpeechSynthesis`.

### Text Input Flow (when voice is disabled)

1. Mic button hidden, text input field shown.
2. User types message, presses Enter or Send button.
3. Sends to `POST /api/assistant/ask`.
4. AI response displayed as text (no speech synthesis).

### Speech Synthesis Details

- Dynamic language detection: checks for Hindi characters (`\u0900-\u097F`).
- Hindi text → `hi-IN` voice; Latin text → `en-US` voice.
- Prefers female voices (Zira, Samantha, Veena, Heera, etc.).
- Rate: 0.95, Pitch: 1, Volume: 1.

### Navigation Handling

- If AI response contains `action: "navigate"`, speaks the response, then redirects after 1.5 seconds.
- Sends `currentPath` (current `window.location.pathname`) to avoid navigating to the already-open page.

### Widget Themes

| Theme | Background | Accent Colors |
|---|---|---|
| `light` | White to pale blue gradient | Blue/Cyan |
| `dark` | `#050816` dark space | Purple/Pink/Cyan |
| `glass` | Semi-transparent with backdrop blur | Cyan/Violet/Fuchsia |
| `neon` | `#03120d` dark green | Emerald/Green/Cyan |

---

## Voice Assistant

### Speech-to-Text (Input)

- **API:** Browser `SpeechRecognition` / `webkitSpeechRecognition`.
- **Language:** `en-IN` (Indian English).
- **Mode:** Non-continuous, no interim results.
- **Fallback:** If `SpeechRecognition` is not supported, displays "Speech Recognition not supported."

### Text-to-Speech (Output)

- **API:** Browser `SpeechSynthesis`.
- **Language Detection:** Hindi characters → `hi-IN`; Latin script → `en-US`.
- **Voice Selection:** Prioritizes female voices; falls back to any available English voice.
- **When voice is disabled:** AI response is only displayed as text, no speech.

---

## Gemini AI Integration

### Configuration (`Server/Configs/gemini.js`)

- **Model:** `gemini-2.5-flash`
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- **Authentication:** User's own Gemini API key passed as query parameter.

### Prompt Construction (`Server/Controllers/assistant.controller.js`)

The prompt includes:
- Assistant identity: `"You are {assistantName}, a professional website assistant for {businessName}."`
- Business context: business name, type, description.
- Assistant tone.
- Platform description (Shifra AI features).
- All navigation pages (system + user-defined) with keywords.
- Critical behavioral rules:
  1. Keep UI labels in English (never translate).
  2. Mirror the user's language script (English or Hinglish in Latin alphabet).
  3. Conversational, natural responses (not robotic).
  4. Strictly 10–25 words.
  5. No hallucination — only mention listed features/pages.

### Error Handling

| HTTP Status | Behavior |
|---|---|
| 401 or 400 (with "api key" in error) | Sets `geminiStatus` to `invalid` |
| 429 | Sets `geminiStatus` to `quota_exceeded` |
| 403 | Returns "API access forbidden" |
| 5xx | Returns "Gemini service temporarily unavailable" |
| Success | Sets `geminiStatus` to `active` |

### API Key Validation (`Server/Controllers/user.controller.js`)

- **Test endpoint:** `GET https://generativelanguage.googleapis.com/v1beta/models?key={apiKey}`
- Validates before saving; returns error if invalid.
- Builder page has a "Test Key" button for instant validation.

---

## Authentication

### Flow

1. User clicks "Continue with Google" on Login page.
2. Firebase `signInWithPopup` opens Google OAuth popup.
3. On success: `displayName` and `email` sent to `POST /api/auth/google`.
4. Server creates user (if new) or finds existing user by email.
5. Server generates JWT token (expires 7 days), sets `httpOnly` cookie named `token`.
6. Cookie config: `secure: true` + `sameSite: none` in production; `secure: false` + `sameSite: lax` in development.

### Auth Middleware (`Server/Middleware/isAuth.js`)

- Reads `token` from `req.cookies`.
- Verifies JWT using `JWT_SECRET`.
- Attaches `userId` to `req.userId`.
- Returns 400 if no token or invalid token.

### Logout

- `GET /api/auth/logout` clears the `token` cookie.
- Client sets user to `null`, navigates to `/login`.

### Firebase Config (`Client/src/utils/firebase.js`)

- **Project:** `shifraai` (Project ID)
- **Auth Domain:** `shifraai-4da91.firebaseapp.com`
- **Provider:** `GoogleAuthProvider` with `prompt: "select_account"`.

---

## Database Collections

### Users Collection (`User` model)

**File:** `Server/Models/user.model.js`

| Field | Type | Default | Description |
|---|---|---|---|
| `name` | String (required) | — | User's display name from Google |
| `email` | String (required, unique) | — | User's Google email |
| `assistantName` | String | `"Shifra"` | Custom assistant name |
| `businessName` | String | `""` | User's business name |
| `businessType` | String | `""` | Type of business |
| `businessDescription` | String | `""` | Business description for AI context |
| `tone` | String (enum) | `"friendly"` | `friendly` / `professional` / `sales` |
| `theme` | String (enum) | `"light"` | `light` / `dark` / `glass` / `neon` |
| `enableVoice` | Boolean | `true` | Enable/disable speech input/output |
| `pages` | Array of `pageSchema` | `[]` | Custom navigation pages |
| `enableNavigation` | Boolean | `true` | Enable/disable page navigation |
| `geminiApiKey` | String | `""` | User's Gemini API key |
| `geminiStatus` | String (enum) | `"active"` | `active` / `quota_exceeded` / `invalid` |
| `totalMessages` | Number | `0` | Count of AI messages sent |
| `plan` | String (enum) | `"free"` | `free` / `pro` |
| `requestLimit` | Number | `200` | Max messages on free plan |
| `proExpiresAt` | Date | `null` | Pro plan expiry date |
| `isSetupComplete` | Boolean | `false` | Whether the assistant setup is done |
| `createdAt` | Date (auto) | — | Mongoose timestamp |
| `updatedAt` | Date (auto) | — | Mongoose timestamp |

**Page Sub-Schema (`pageSchema`):**

| Field | Type | Description |
|---|---|---|
| `name` | String | Page display name |
| `path` | String | URL path (e.g., `/pricing`) |
| `keywords` | Array of Strings | Trigger keywords for navigation |

### Billing Collection (`Billing` model)

**File:** `Server/Models/billing.model.js`

| Field | Type | Default | Description |
|---|---|---|---|
| `userId` | ObjectId (ref: User) | — | Reference to the User |
| `amount` | Number | — | Payment amount in INR |
| `plan` | String | — | Plan name (e.g., `"pro"`) |
| `paymentId` | String | — | Razorpay payment ID |
| `orderId` | String | — | Razorpay order ID |
| `status` | String (enum) | `"created"` | `created` / `paid` / `failed` |
| `createdAt` | Date (auto) | — | Mongoose timestamp |
| `updatedAt` | Date (auto) | — | Mongoose timestamp |

---

## APIs

### Auth Routes (`/api/auth`) — Private CORS

| Method | Endpoint | Auth | Controller | Description |
|---|---|---|---|---|
| POST | `/api/auth/google` | No | `googleAuth` | Google sign-in/sign-up; sets JWT cookie |
| GET | `/api/auth/logout` | No | `logOut` | Clears JWT cookie |

### User Routes (`/api/user`) — Private CORS

| Method | Endpoint | Auth | Controller | Description |
|---|---|---|---|---|
| GET | `/api/user/current-user` | Yes (`isAuth`) | `getCurrentUser` | Returns authenticated user data |
| POST | `/api/user/save-assistant` | Yes (`isAuth`) | `saveAssistant` | Saves/updates assistant configuration |
| POST | `/api/user/test-key` | Yes (`isAuth`) | `testGeminiKey` | Validates a Gemini API key |

### Assistant Routes (`/api/assistant`) — Public CORS (`origin: *`)

| Method | Endpoint | Auth | Controller | Description |
|---|---|---|---|---|
| GET | `/api/assistant/config/:userId` | No | `getAssistantConfig` | Returns user config (excludes `geminiApiKey`) |
| POST | `/api/assistant/ask` | No | `askAssistant` | Sends user message to Gemini AI, returns response |

### Billing Routes (`/api/billing`) — Private CORS

| Method | Endpoint | Auth | Controller | Description |
|---|---|---|---|---|
| POST | `/api/billing/order` | Yes (`isAuth`) | `createOrder` | Creates Razorpay order for Pro plan (₹699) |
| POST | `/api/billing/verify` | Yes (`isAuth`) | `verifyBilling` | Verifies Razorpay payment signature; upgrades user to Pro |

### CORS Configuration

- **Private CORS:** Origin restricted to `http://localhost:5173`, credentials enabled. Used for auth, user, and billing routes.
- **Public CORS:** Origin `*` (any domain). Used for assistant routes so the widget works on any external website.

---

## User Workflow

### New User Flow

1. Visit `/login` → Click "Continue with Google."
2. Google popup sign-in → Redirected to Home (`/`).
3. Click "Build Your Assistant" → Navigate to Builder (`/builder`).
4. Fill in: Assistant Name, Business Name, Business Type, Business Description.
5. Select Theme and Tone.
6. Toggle Enable Voice and Enable Navigation.
7. Enter Gemini API Key → Click "Test Key" to validate.
8. (Optional) Add Navigation Pages with name, path, and keywords.
9. Click "Save Assistant" → `isSetupComplete` set to `true`.
10. Copy the embed code `<script>` tag.
11. Paste the script before `</body>` on any external website.

### Returning User Flow

1. Visit site → Auto-authenticated via JWT cookie → Redirected to Home.
2. Navigate to Builder → View assistant summary, status, embed code.
3. Click "Edit Assistant" to modify configuration.
4. Navigate to Billing → View usage stats, upgrade to Pro if needed.

### Payment Flow

1. User clicks "Upgrade Now" on Billing page.
2. `POST /api/billing/order` creates Razorpay order (₹699 × 100 paise).
3. Razorpay checkout modal opens.
4. On successful payment: `POST /api/billing/verify` verifies HMAC-SHA256 signature.
5. User's plan updated to `pro`, `proExpiresAt` set to 90 days from now.
6. Billing record updated with `paymentId` and `status: "paid"`.

### Pro Plan Expiry

- On each `POST /api/assistant/ask`, if `plan === "pro"` and `proExpiresAt < now`, plan is reverted to `"free"`.

---

## Technologies Used

### Frontend (Client)

| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI framework |
| React Router DOM | 7.x | Client-side routing |
| Vite | 8.x | Build tool and dev server |
| Tailwind CSS | 4.x (with `@tailwindcss/vite`) | Utility-first CSS styling |
| Axios | 1.x | HTTP client for API calls |
| Firebase | 12.x | Google authentication |
| React Hot Toast | 2.x | Toast notifications |
| React Icons | 5.x | Icon library (Fi, Hi, Fc icon sets) |

### Backend (Server)

| Technology | Version | Purpose |
|---|---|---|
| Express | 5.x | HTTP server framework |
| Mongoose | 9.x | MongoDB ODM |
| JSON Web Token (jsonwebtoken) | 9.x | JWT auth token generation/verification |
| Cookie Parser | 1.x | Parse cookies from requests |
| CORS | 2.x | Cross-origin request handling |
| Razorpay | 2.x | Payment gateway SDK |
| dotenv | 17.x | Environment variable loading |
| Nodemon | 3.x | Dev server with hot reload |

### External Services

| Service | Purpose |
|---|---|
| Firebase Authentication | Google OAuth popup sign-in |
| Google Gemini API (`gemini-2.5-flash`) | AI response generation |
| Razorpay | Payment processing for Pro plan |
| MongoDB Atlas | Cloud database |

### Browser APIs (Widget)

| API | Purpose |
|---|---|
| `SpeechRecognition` / `webkitSpeechRecognition` | Voice input (speech-to-text) |
| `SpeechSynthesis` / `SpeechSynthesisUtterance` | Voice output (text-to-speech) |

---

## Environment Variables

### Server (`Server/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: `8000`) |
| `MONGODB_URL` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `RAZORPAY_KEY_ID` | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API key secret |

### Client (`Client/.env`)

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Web API key for Google Auth |
| `VITE_RAZORPAY_KEY_ID` | Razorpay key ID for client-side checkout |

### Hardcoded URLs (Development)

| Constant | Value | Location |
|---|---|---|
| `ServerUrl` | `http://localhost:8000` | `Client/src/App.jsx` |
| `CLIENT_URL` | `http://localhost:5173` | `Client/src/App.jsx` |
| Widget API URLs | `http://localhost:8000` | `Client/public/assistant.js` |
| Widget asset URLs | `http://localhost:5173` | `Client/public/assistant.js` |

---

## FAQs

### General

**Q: What is Shifra AI?**
A: Shifra AI is a platform that lets website owners create and embed a custom AI voice assistant on their websites. It uses Google's Gemini AI and supports voice input/output.

**Q: Who created Shifra AI?**
A: Shifra AI was created by Riya Bisht.

**Q: How do I sign up?**
A: Click "Continue with Google" on the login page. No email/password registration is needed.

### Assistant

**Q: How do I create an assistant?**
A: Go to the Builder page, fill in your business details, choose a theme and tone, add your Gemini API key, optionally add navigation pages, and click Save.

**Q: Where do I get a Gemini API key?**
A: Visit https://aistudio.google.com/app/apikey to generate a free Gemini API key.

**Q: What AI model does the assistant use?**
A: The assistant uses Google's `gemini-2.5-flash` model.

**Q: Can I test my API key before saving?**
A: Yes. Use the "Test Key" button in the Builder to validate your Gemini API key instantly.

**Q: How do I embed the assistant on my website?**
A: Copy the embed code from the Builder page and paste it before the closing `</body>` tag of your website's HTML.

**Q: Can I disable voice and use text only?**
A: Yes. Toggle "Enable Voice" off in the Builder. The widget will show a text input field instead of the microphone.

**Q: What themes are available?**
A: Light, Dark, Glass, and Neon.

**Q: What tones can I set?**
A: Friendly, Professional, and Sales.

### Navigation

**Q: How does page navigation work?**
A: When enabled, the assistant detects navigation intent (e.g., "open pricing") and redirects the visitor to the matching page based on configured keywords.

**Q: What are system pages?**
A: Three built-in pages: Home (`/`, keywords: home, homepage, dashboard, main, start), Builder (`/builder`, keywords: builder, create, customize, edit, assistant, settings, setup), Billing (`/billing`, keywords: billing, pricing, plans, payment, upgrade, pro, subscription).

**Q: What navigation trigger words are supported?**
A: open, go to, go, start, show, navigate, take me to, take me, kholo, dikha, dikhao, le jao, chalo, jao, page.

### Billing

**Q: What does the free plan include?**
A: 200 AI messages, voice assistant, navigation support, and basic customization.

**Q: What does the Pro plan include?**
A: ₹699 for 3 months — unlimited AI messages, advanced AI assistant, priority performance, unlimited navigation, and premium support.

**Q: How long does the Pro plan last?**
A: 90 days from the date of purchase.

**Q: What payment gateway is used?**
A: Razorpay.

---

## Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| "user does not have token" | JWT cookie missing or expired | Log in again via Google sign-in |
| "Invalid API Key" on save | Gemini API key is wrong or expired | Use "Test Key" to validate; get a new key from https://aistudio.google.com/app/apikey |
| "Free limit reached" | 200 message limit exhausted on free plan | Upgrade to Pro plan on the Billing page |
| "Pro plan expired" | 90-day Pro period ended | Purchase Pro plan again |
| "Rate limit exceeded" | Gemini API quota exceeded (HTTP 429) | Wait and retry; check your Gemini API quota |
| "Gemini service temporarily unavailable" | Gemini API server error (5xx) | Retry after some time |
| "Speech Recognition not supported" | Browser doesn't support Web Speech API | Use Chrome or Edge browser |
| Widget not loading | Incorrect `data-user-id` in script tag | Copy the correct embed code from the Builder page |
| "Unauthorized domain" on login | App domain not added to Firebase authorized domains | Add your domain in Firebase Console → Authentication → Settings → Authorized domains |
| Razorpay checkout not opening | Missing Razorpay checkout script | Ensure `<script src="https://checkout.razorpay.com/v1/checkout.js">` is in your HTML |
| CORS error on widget | Widget API request blocked | Assistant routes use public CORS (`origin: *`); verify server is running |

---

## Future Scope

> These features are **not yet implemented** and are listed as potential enhancements.

- Chat history persistence (currently conversations are not stored).
- Multi-language support beyond English/Hinglish.
- Analytics dashboard (message count trends, user engagement).
- Multiple assistant support per user account.
- Custom widget positioning and sizing options.
- Webhook integrations for CRM/support tools.
- Production deployment configuration (currently uses localhost URLs).
- Admin panel for managing users and billing.
- File/document upload for AI context training.
- Rate limiting middleware on API endpoints.

---

## AI Assistant Instructions

> **This section defines how the Shifra AI assistant should behave when responding to users.**

### Identity

- The assistant's name is configurable per user (default: `"Shifra"`).
- It introduces itself as: "Hello! I'm {assistantName}."
- It is a professional website assistant for `{businessName}`.

### Knowledge Scope

- The assistant **only** knows about:
  - The features listed in this knowledge base.
  - The pages configured by the website owner (system pages + custom pages).
  - The business details provided by the owner (name, type, description).
  - Shifra AI platform features (Google auth, builder, billing, embedding, voice assistant).
- **Never invent features, pages, or capabilities that are not implemented.**

### Response Rules

1. **Language Mirroring:** Respond in the same language/script the user used. Always use Latin alphabet (never Devanagari). English questions → English answers. Hinglish questions → Hinglish answers.
2. **Keep UI Terms in English:** Never translate feature names, page names, or button labels into Hindi. Use "Home", "Builder", "Billing", "Settings" — never "Ghar", "Upyogakarta", etc.
3. **Be Conversational:** Talk naturally like ChatGPT, Gemini, Siri, or Alexa. Do not repeat the user's question. Do not sound robotic.
4. **Be Concise:** Strictly 10–25 words per response. This is critical for rapid voice playback.
5. **No Hallucination:** Only discuss features and pages that are actually configured. Do not invent anything.

### Navigation Behavior

- When the user expresses navigation intent using trigger words (open, go to, show, navigate, take me to, kholo, dikha, etc.), match against configured page keywords.
- If a match is found and it's not the current page, return `action: "navigate"` with the target path.
- If the matched page is already open, respond: `"{PageName} already open"`.
- System pages (Home, Builder, Billing) are always available alongside user-defined pages.

### Plan & Limits Awareness

- **Free plan:** 200 AI messages total. After limit, respond: "Free limit reached."
- **Pro plan:** Unlimited messages for 90 days. After expiry, plan reverts to free.
- If the user's Gemini API key is missing, respond: "Gemini API key is not added."

### Tone Application

- **Friendly:** Warm, approachable, helpful.
- **Professional:** Formal, precise, business-appropriate.
- **Sales:** Persuasive, benefit-focused, action-oriented.

### Platform Information (for answering questions about Shifra AI)

- Google authentication for instant signup.
- Custom voice assistant settings: name, tone (Friendly/Professional/Sales), theme (Dark/Light/Glass/Neon), voice toggle.
- Training dashboard to personalize responses with business details and custom page navigation.
- Single-line script embedding to add the assistant to any website.
- Free plan: 200 AI responses. Pro plan: ₹699 for 3 months — unlimited responses, priority support, advanced features.
- Uses Gemini AI with the user's own API key.
- Dynamic voice recognition (speech input) and natural speech synthesis (speech output).

---

## File Structure

```
ShifraAI/
├── Client/
│   ├── public/
│   │   ├── assistant.js          # Embeddable widget script (IIFE)
│   │   ├── assistant.css         # Widget styles (4 themes)
│   │   ├── logo.png              # Shifra AI logo
│   │   ├── mic.svg               # Microphone icon
│   │   └── test-widget.html      # Widget test page
│   ├── src/
│   │   ├── Components/
│   │   │   ├── AssistantPreview.jsx   # Interactive theme preview
│   │   │   ├── Navbar.jsx             # Top navigation bar
│   │   │   └── ProtectedRoute.jsx     # Auth guard component
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Landing page
│   │   │   ├── Login.jsx          # Google sign-in page
│   │   │   ├── Builder.jsx        # Assistant configuration
│   │   │   └── Billing.jsx        # Plans and payment
│   │   ├── utils/
│   │   │   └── firebase.js        # Firebase config & Google auth
│   │   ├── App.jsx                # Root component with routes
│   │   ├── main.jsx               # React entry point
│   │   └── index.css              # Global styles
│   ├── index.html                 # HTML entry point
│   ├── .env                       # Client env variables
│   ├── package.json               # Client dependencies
│   └── vite.config.js             # Vite configuration
├── Server/
│   ├── Configs/
│   │   ├── ConnectDB.js           # MongoDB connection
│   │   ├── gemini.js              # Gemini AI API integration
│   │   ├── razorpay.js            # Razorpay instance
│   │   └── token.js               # JWT token generation
│   ├── Controllers/
│   │   ├── auth.controller.js     # Google auth & logout
│   │   ├── user.controller.js     # User data & assistant config
│   │   ├── assistant.controller.js # AI chat & navigation
│   │   └── billing.controller.js  # Payment order & verification
│   ├── Middleware/
│   │   └── isAuth.js              # JWT authentication middleware
│   ├── Models/
│   │   ├── user.model.js          # User schema (+ page sub-schema)
│   │   └── billing.model.js       # Billing/payment schema
│   ├── Routes/
│   │   ├── auth.route.js          # /api/auth routes
│   │   ├── user.route.js          # /api/user routes
│   │   ├── assistant.route.js     # /api/assistant routes
│   │   └── billing.route.js       # /api/billing routes
│   ├── index.js                   # Server entry point
│   ├── .env                       # Server env variables
│   └── package.json               # Server dependencies
├── start-all.bat                  # Launch both server & client
├── start-server.bat               # Launch server only
├── start-client.bat               # Launch client only
└── README.md                      # Project documentation
```
