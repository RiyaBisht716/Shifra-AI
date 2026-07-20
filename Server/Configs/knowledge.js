/**
 * Knowledge Loader Module
 * 
 * Loads and caches the projectKnowledge.md file for use as AI system context.
 * 
 * Behavior:
 * - Reads the knowledge file once on first access and caches it in memory.
 * - Parses markdown into logical chunks to allow smart retrieval.
 * - On subsequent calls, checks the file's last-modified time (mtime).
 *   If the file has been updated, it reloads automatically.
 * - If the file is missing or unreadable, returns a fallback string gracefully.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KNOWLEDGE_FILE_PATH = path.join(__dirname, "..", "knowledge", "projectKnowledge.md");

let cachedContent = null;
let cachedChunks = [];
let lastModifiedTime = null;

const FALLBACK_KNOWLEDGE = `Shifra AI is a voice-enabled AI assistant platform. 
Users can create custom assistants, configure voice/text settings, 
and embed them on any website using a single script tag.`;

/**
 * Ensures knowledge is loaded and up-to-date in memory.
 */
const ensureKnowledgeLoaded = () => {
    try {
        if (!fs.existsSync(KNOWLEDGE_FILE_PATH)) {
            if (!cachedContent) {
                console.warn("[Knowledge] File not found:", KNOWLEDGE_FILE_PATH);
                cachedContent = FALLBACK_KNOWLEDGE;
                cachedChunks = [FALLBACK_KNOWLEDGE];
            }
            return;
        }

        const stats = fs.statSync(KNOWLEDGE_FILE_PATH);
        const currentMtime = stats.mtimeMs;

        if (!cachedContent || lastModifiedTime !== currentMtime) {
            cachedContent = fs.readFileSync(KNOWLEDGE_FILE_PATH, "utf-8");
            lastModifiedTime = currentMtime;
            
            // Chunking: split by '## ' headers
            const rawChunks = cachedContent.split('\n## ');
            cachedChunks = rawChunks.map((c, i) => {
                return (i === 0 || c.startsWith('#')) ? c : '## ' + c;
            });

            console.log(`[Knowledge] Loaded projectKnowledge.md into memory. (${cachedChunks.length} chunks)`);
        }
    } catch (error) {
        console.error("[Knowledge] Error reading knowledge file:", error.message);
        if (!cachedContent) {
            cachedContent = FALLBACK_KNOWLEDGE;
            cachedChunks = [FALLBACK_KNOWLEDGE];
        }
    }
};

/**
 * Returns the full knowledge file content.
 */
export const getKnowledge = () => {
    ensureKnowledgeLoaded();
    return cachedContent;
};

/**
 * Returns only the chunks of knowledge relevant to the given query.
 * Always includes the Overview and AI Assistant Instructions.
 * 
 * @param {string} query The user's message
 * @returns {string} Concatenated relevant chunks
 */
export const getRelevantKnowledge = (query) => {
    ensureKnowledgeLoaded();
    
    if (cachedChunks.length <= 1) return cachedContent; // Fallback

    const queryLower = (query || "").toLowerCase();
    const tokens = queryLower.split(/\s+/).filter(t => t.length > 2);

    let selectedChunks = new Set();
    
    // Chunk 0 is usually the Title + Overview + Purpose
    selectedChunks.add(cachedChunks[0]);

    // Find and always add the "AI Assistant Instructions" chunk
    const instructionsChunk = cachedChunks.find(c => c.toLowerCase().includes("ai assistant instructions"));
    if (instructionsChunk) {
        selectedChunks.add(instructionsChunk);
    }
    
    // Always add Core Features and Navigation for good baseline context
    const featuresChunk = cachedChunks.find(c => c.toLowerCase().includes("## core features"));
    if (featuresChunk) selectedChunks.add(featuresChunk);
    
    const navChunk = cachedChunks.find(c => c.toLowerCase().includes("## navigation"));
    if (navChunk) selectedChunks.add(navChunk);

    // If there's a specific query, score the remaining chunks
    if (tokens.length > 0) {
        cachedChunks.forEach(chunk => {
            const chunkLower = chunk.toLowerCase();
            let matches = 0;
            tokens.forEach(token => {
                if (chunkLower.includes(token)) matches++;
            });
            // If we have some keyword overlap, include the chunk
            if (matches > 0) {
                selectedChunks.add(chunk);
            }
        });
    }

    return Array.from(selectedChunks).join('\n\n');
};

/**
 * Preloads the knowledge file into memory.
 */
export const preloadKnowledge = () => {
    ensureKnowledgeLoaded();
};
