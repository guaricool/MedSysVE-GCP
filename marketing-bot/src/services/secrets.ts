import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const client = new SecretManagerServiceClient();

export async function getSecret(secretName: string): Promise<string> {
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
    } else {
      payloadStr = Buffer.from(data).toString('utf8');
    }

    return payloadStr.trim();
  } catch (error) {
    console.error(`Error accessing secret ${secretName}:`, error);
    throw error;
  }
}
