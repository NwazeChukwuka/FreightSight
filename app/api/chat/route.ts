import { generateText } from "ai"

export async function POST(request: Request) {
  try {
    const { message, trackingId } = await request.json()

    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400 })
    }

    const systemPrompt = `You are FreightSight, a helpful AI assistant for global parcel tracking. 
    You help users track parcels, check delivery status, and provide support.
    Be friendly, professional, and concise. Always provide accurate information.
    If you don't have information, suggest contacting support.`

    const userContext = trackingId ? `\nUser is asking about tracking ID: ${trackingId}` : ""

    const { text } = await generateText({
      model: "openai/gpt-4-mini",
      system: systemPrompt,
      prompt: message + userContext,
      temperature: 0.7,
      maxTokens: 500,
    })

    return Response.json({ message: text })
  } catch (error) {
    console.error("Chat API error:", error)
    return Response.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
