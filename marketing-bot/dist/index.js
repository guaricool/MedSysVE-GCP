"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const secrets_1 = require("./services/secrets");
const browser_1 = require("./services/browser");
const ai_1 = require("./services/ai");
const instagram_1 = require("./services/instagram");
async function main() {
    console.log("Starting MedSysVE Marketing Bot (Phase 3)...");
    try {
        console.log("1. Fetching secrets...");
        const igUser = await (0, secrets_1.getSecret)("IG_SYSTEM_USER");
        const igPass = await (0, secrets_1.getSecret)("IG_SYSTEM_PASS");
        const igToken = await (0, secrets_1.getSecret)("IG_ACCESS_TOKEN");
        const igAccountId = await (0, secrets_1.getSecret)("IG_ACCOUNT_ID");
        const geminiApiKey = await (0, secrets_1.getSecret)("GEMINI_API_KEY");
        // GCP project config for Vertex AI
        const projectId = "medsysve-gcp";
        const location = "us-central1";
        let imageBuffer;
        let captionContext;
        const postStyle = process.env.POST_STYLE || "screenshot";
        if (postStyle === "hyperrealistic") {
            console.log("2. Route A: Generating spectacular AI Image (Hyper-realistic)...");
            const aiPrompts = [
                "A hyper-realistic, cinematic photo of a modern doctor using a sleek tablet in a bright, futuristic medical clinic. High quality, 8k, professional lighting. The tablet screen glows with modern medical software. 35mm lens.",
                "A confident Venezuelan female doctor in a modern white coat, smiling, standing in a state-of-the-art hospital hallway, cinematic depth of field. High quality, ultra-realistic.",
            ];
            const selectedPrompt = aiPrompts[Math.floor(Math.random() * aiPrompts.length)];
            console.log(`Selected AI Prompt: ${selectedPrompt}`);
            imageBuffer = await (0, ai_1.generateAIImage)(selectedPrompt, projectId, location);
            captionContext = "Una imagen generada con IA hiperrealista que representa la modernidad y tecnología de la nueva era de la medicina en Venezuela gracias a MedSysVE.";
        }
        else if (postStyle === "cartoon") {
            console.log("2. Route B: Generating spectacular AI Image (Cartoon/Illustration)...");
            const aiPrompts = [
                "A high quality, vibrant 3D Pixar-style cartoon of a friendly doctor looking happy while looking at a futuristic computer screen that shows medical data. Colorful, modern, medical tech.",
                "A cute and professional 2D vector illustration of a superhero doctor flying with a laptop, symbolizing fast and efficient medical care with modern software. Bright colors, MedSysVE style."
            ];
            const selectedPrompt = aiPrompts[Math.floor(Math.random() * aiPrompts.length)];
            console.log(`Selected AI Prompt: ${selectedPrompt}`);
            imageBuffer = await (0, ai_1.generateAIImage)(selectedPrompt, projectId, location);
            captionContext = "Una ilustración animada y creativa que destaca lo fácil y divertido que es gestionar tu consultorio con MedSysVE.";
        }
        else {
            console.log("2. Route C: Taking screenshot via Puppeteer...");
            const { buffer, moduleDescription } = await (0, browser_1.takeScreenshot)(igUser, igPass);
            imageBuffer = buffer;
            captionContext = moduleDescription;
        }
        console.log("3. Generating caption with Google AI Studio (Gemini 3 Preview)...");
        const { caption, hashtags } = await (0, ai_1.generateContentForImage)(imageBuffer, geminiApiKey, captionContext);
        console.log("Caption generated:", caption);
        console.log("Hashtags generated:", hashtags);
        console.log("4. Publishing to Instagram...");
        const { mediaId: postId, url: imageUrl } = await (0, instagram_1.publishToInstagram)(imageBuffer, caption, hashtags, igToken, igAccountId);
        console.log(`Job completed successfully! Instagram Post ID: ${postId}`);
        console.log("5. Saving post to MedSysVE database...");
        const appUrl = process.env.MEDSYSVE_APP_URL || "https://www.medsysve.com";
        const apiSecret = process.env.BOT_API_SECRET || "marketing-bot-secret-123";
        try {
            // Import axios if not already imported (it's not imported at the top, so we require it here)
            const axios = require("axios");
            await axios.post(`${appUrl}/api/admin/marketing/save-post`, {
                imageUrl,
                caption,
                hashtags,
                style: postStyle,
                status: "PUBLISHED",
                igMediaId: postId
            }, {
                headers: {
                    'Authorization': `Bearer ${apiSecret}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log("Post saved successfully to database.");
        }
        catch (dbError) {
            console.error("Failed to save post to MedSysVE DB (non-fatal):", dbError.response?.data || dbError.message);
        }
        process.exit(0);
    }
    catch (error) {
        console.error("Marketing Bot failed with error:", error);
        process.exit(1);
    }
}
main();
