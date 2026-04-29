import { generateText } from "ai"

export const generateAIResponse = async (userMessage, context = {}) => {
  try {
    const systemPrompt = `You are FreightSight, a helpful AI assistant for global parcel tracking. 
    You help users:
    - Track their parcels by tracking ID
    - Check delivery status and estimated arrival
    - Provide support and answer questions about shipping
    - Suggest next steps if there are issues
    
    Be friendly, professional, and concise. Always provide accurate information based on the context provided.
    If you don't have information, suggest contacting support.`

    const userContext = context.trackingId
      ? `\nUser is tracking parcel: ${context.trackingId}\nParcel Status: ${context.status}\nCurrent Location: ${context.location}`
      : ""

    const { text } = await generateText({
      model: "openai/gpt-4-mini",
      system: systemPrompt,
      prompt: userMessage + userContext,
      temperature: 0.7,
      maxTokens: 500,
    })

    return text
  } catch (error) {
    console.error("AI generation error:", error.message)
    return "I apologize, but I'm having trouble processing your request. Please try again or contact our support team."
  }
}

export const parseUserIntent = (message) => {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("track") || lowerMessage.includes("where") || lowerMessage.includes("status")) {
    return "TRACK"
  }
  if (lowerMessage.includes("delay") || lowerMessage.includes("late") || lowerMessage.includes("problem")) {
    return "ISSUE"
  }
  if (lowerMessage.includes("deliver") || lowerMessage.includes("arrive") || lowerMessage.includes("when")) {
    return "ETA"
  }
  if (lowerMessage.includes("help") || lowerMessage.includes("support") || lowerMessage.includes("contact")) {
    return "SUPPORT"
  }

  return "GENERAL"
}
