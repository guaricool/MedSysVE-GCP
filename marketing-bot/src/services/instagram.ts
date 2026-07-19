import axios from "axios";
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";

const storage = new Storage();

export async function publishToInstagram(
  imageBuffer: Buffer,
  caption: string,
  hashtags: string,
  accessToken: string,
  instagramAccountId: string
): Promise<{ mediaId: string, url: string }> {
  console.log("Uploading image to temporary GCS bucket...");
  const bucketName = process.env.TEMP_BUCKET_NAME || "medsysve-bot-temp";
  const fileName = `ig-post-${randomUUID()}.png`;
  
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);

  await file.save(imageBuffer, {
    metadata: { contentType: "image/png" }
  });

  // The bucket is configured to be public, so we can just use the public URL
  const url = `https://storage.googleapis.com/${bucketName}/${fileName}`;

  console.log("Image uploaded to GCS. URL generated.");
  console.log("Publishing to Instagram via Graph API...");

  const fullText = `${caption}\n\n${hashtags}`;

  try {
    // 1. Create a media container
    const containerRes = await axios.post(
      `https://graph.facebook.com/v19.0/${instagramAccountId}/media`,
      {
        image_url: url,
        caption: fullText,
        access_token: accessToken
      }
    );

    const creationId = containerRes.data.id;
    console.log(`Media container created: ${creationId}`);

    // Wait a few seconds for Instagram to process the image
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 2. Publish the container
    const publishRes = await axios.post(
      `https://graph.facebook.com/v19.0/${instagramAccountId}/media_publish`,
      {
        creation_id: creationId,
        access_token: accessToken
      }
    );

    const publishData = publishRes.data;
    console.log("Media published successfully. ID:", publishData.id);
    return { mediaId: publishData.id, url };
  } catch (error: any) {
    console.error("Instagram API Error:", JSON.stringify(error.response?.data || error.message, null, 2));
    throw error;
  }
}
