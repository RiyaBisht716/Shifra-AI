/**
 * Knowledge Loader Module
 * 
 * Loads and caches the projectKnowledge.md file for use as AI system context.
 * 
 * Behavior:
 * - Reads the knowledge file once on first access and caches it in memory.
 * - On subsequent calls, checks the file's last-modified time (mtime).
 *   If the file has been updated, it reloads automatically — no server restart needed.
 * - If the file is missing or unreadable, returns a fallback string gracefully.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the knowledge file (relative to Server/Configs/ → Server/knowledge/)
const KNOWLEDGE_FILE_PATH = path.join(__dirname, "..", "knowledge", "projectKnowledge.md");

// In-memory cache
let cachedContent = null;

// Stores the last known mtime to detect file changes
let lastModifiedTime = null;

// Fallback message if the knowledge file is missing or unreadable
const FALLBACK_KNOWLEDGE = `Shifra AI is a voice-enabled AI assistant platform. 
Users can create custom assistants, configure voice/text settings, 
and embed them on any website using a single script tag.`;

/**
 * Returns the knowledge file content.
 * - First call: reads the file and caches it.
 * - Subsequent calls: checks mtime and reloads only if the file was modified.
 * - If the file is missing: returns the fallback string without crashing.
 * 
 * @returns {string} The knowledge file content or fallback message.
 */
export const getKnowledge = () => {
    try {
        // Check if the file exists
        if (!fs.existsSync(KNOWLEDGE_FILE_PATH)) {
            console.warn("[Knowledge] File not found:", KNOWLEDGE_FILE_PATH);
            return FALLBACK_KNOWLEDGE;
        }

        // Get the file's current modification time
        const stats = fs.statSync(KNOWLEDGE_FILE_PATH);
        const currentMtime = stats.mtimeMs;

        // Reload if: first load OR file was modified since last read
        if (!cachedContent || lastModifiedTime !== currentMtime) {
            cachedContent = fs.readFileSync(KNOWLEDGE_FILE_PATH, "utf-8");
            lastModifiedTime = currentMtime;

            if (cachedContent === null || lastModifiedTime === null) {
                // First load
                console.log("[Knowledge] Loaded projectKnowledge.md into memory.");
            } else {
                // Reload after modification
                console.log("[Knowledge] Reloaded projectKnowledge.md (file was updated).");
            }
        }

        return cachedContent;
    } catch (error) {
        console.error("[Knowledge] Error reading knowledge file:", error.message);
        return FALLBACK_KNOWLEDGE;
    }
};

/**
 * Preloads the knowledge file into memory.
 * Call this during server startup for eager loading.
 */
export const preloadKnowledge = () => {
    const content = getKnowledge();
    const source = content === FALLBACK_KNOWLEDGE ? "fallback" : "file";
    console.log(`[Knowledge] Preloaded knowledge from ${source} (${content.length} chars).`);
};
