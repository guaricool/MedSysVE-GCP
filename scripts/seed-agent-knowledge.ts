import { seedKnowledgeBase } from "../lib/ai/seed-knowledge"

if (require.main === module) {
  seedKnowledgeBase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Error sembrando conocimiento:", err)
      process.exit(1)
    })
}

export { seedKnowledgeBase }
