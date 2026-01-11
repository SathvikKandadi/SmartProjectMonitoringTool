const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Analyze abstract with OpenAI
 * @param {String} abstractText - Abstract text to analyze
 * @returns {Object} AI analysis with feedback, rating, and suggestions
 */
const analyzeAbstractWithAI = async (abstractText) => {
  try {
    const prompt = `You are an academic reviewer for college project abstracts. Analyze the following abstract and provide:

1. Overall Feedback (2-3 paragraphs)
2. Rating (0-10 scale)
3. Specific Suggestions for improvement (bullet points)

Evaluate based on:
- Structure and organization
- Clarity and coherence
- Academic tone and language
- Completeness (background, objectives, methodology, expected outcomes)
- Technical accuracy
- Grammar and formatting

Abstract to review:
"""
${abstractText}
"""

Provide your response in the following JSON format:
{
  "feedback": "detailed feedback here",
  "rating": 7.5,
  "suggestions": "• Suggestion 1\\n• Suggestion 2\\n• Suggestion 3"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert academic reviewer specializing in evaluating college project abstracts. Provide constructive, detailed feedback."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content);

    // Ensure suggestions is always a string
    let suggestions = response.suggestions || "• No specific suggestions provided";
    if (typeof suggestions !== 'string') {
      suggestions = String(suggestions);
    }

    return {
      feedback: response.feedback || "Analysis completed",
      rating: parseFloat(response.rating) || 5.0,
      suggestions: suggestions
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Return fallback response if API fails
    return {
      feedback: "AI analysis is currently unavailable. Please try again later or consult your guide for feedback.",
      rating: null,
      suggestions: "• Ensure your abstract includes background, objectives, methodology, and expected outcomes\n• Use clear, academic language\n• Check grammar and formatting"
    };
  }
};

module.exports = {
  analyzeAbstractWithAI
};

