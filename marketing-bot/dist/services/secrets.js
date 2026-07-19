"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecret = getSecret;
const secret_manager_1 = require("@google-cloud/secret-manager");
const client = new secret_manager_1.SecretManagerServiceClient();
async function getSecret(secretName) {
    const projectId = process.env.PROJECT_ID || await client.getProjectId();
    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
    try {
        const [version] = await client.accessSecretVersion({ name });
        const data = version.payload?.data;
        if (!data) {
            throw new Error(`Payload empty for secret ${secretName}`);
        }
        // Check for UTF-16LE BOM (FF FE)
        let payloadStr = "";
        if (data.length >= 2 && data[0] === 0xFF && data[1] === 0xFE) {
            payloadStr = Buffer.from(data).toString('utf16le');
        }
        else {
            payloadStr = Buffer.from(data).toString('utf8');
        }
        return payloadStr.trim();
    }
    catch (error) {
        console.error(`Error accessing secret ${secretName}:`, error);
        throw error;
    }
}
