const OpenAI = require('openai-api');
const OPENAI_API_KEY = process.env.OPENAI_SECRET_KEY;  // Use environment variable for the secret key

const openai = new OpenAI(OPENAI_API_KEY);

// Exported serverless function handler
exports.handle = async (event, context, cb) => {
    try {
        const { text, thread_id } = JSON.parse(event.body);  // Extracting text and thread_id from the incoming POST request

        const response = await openai.callAssistant({
            model: 'chatgpt4-o',
            user: 'asst_lKkJBD2pFIrjo6uRPjNCxcqp',  // Use the specific assistant ID
            messages: [{ role: 'user', content: text }],
            thread_id: thread_id || undefined
        });

        const responseBody = {
            text: response.data.choices[0].message.content.trim(),
            thread_id: response.data.thread_id  // Ensure thread_id is sent back
        };

        return cb(null, {
            statusCode: 200,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(responseBody)
        });
    } catch (error) {
        return cb(null, {
            statusCode: 500,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ error: 'Error processing your request' })
        });
    }
};