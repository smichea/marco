const { OpenAI } = require("openai");
const url = require("url");
const OPENAI_API_KEY = process.env.OPENAI_SECRET_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

exports.handle = async (event, context) => {
  try {
    console.log("Received event:", event);

    if (!event.body) {
      throw new Error("Event body is undefined");
    }

    const parsedBody = JSON.parse(event.body);
    console.log("Parsed input:", parsedBody);

    const { text, thread_id } = parsedBody;

    if (!text) {
      throw new Error("Text property is missing in the input");
    }

    let thread;
    if (!thread_id) {
      // Step 2: Create a Thread
      thread = await openai.beta.threads.create();
    } else {
      // Reuse existing thread
      thread = { id: thread_id };
    }
    console.log("Thread ID:", thread.id);

    // Step 3: Add a Message to the Thread
    const myThreadMessage = await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: text,
    });
    console.log("This is the message object: ", myThreadMessage);

    // Step 4: Create a Run and Stream the Response
    const myRun = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: "asst_lKkJBD2pFIrjo6uRPjNCxcqp",
    });
    console.log("This is the run object: ", myRun);

    // Periodically retrieve the Run to check on its status
    const retrieveRun = async () => {
      let keepRetrievingRun;
      while (true) {
        keepRetrievingRun = await openai.beta.threads.runs.retrieve(thread.id, myRun.id);
        console.log(`Run status: ${keepRetrievingRun.status}`);

        if (keepRetrievingRun.status === "completed") {
          console.log("Run completed.");
          break;
        }

        // Wait before checking the status again
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      return keepRetrievingRun;
    };

    const completedRun = await retrieveRun();

    // Retrieve the Messages added by the Assistant to the Thread
    const allMessages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = allMessages.data.find(
      (msg) => msg.role === "assistant"
    );

    const responseBody = {
      text: assistantMessage.content,
      thread_id: thread.id,
    };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(responseBody),
    };
  } catch (error) {
    console.error("Error processing request:", error.message);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Error processing your request", message: error.message }),
    };
  }
};

// This will execute when testing locally, but not when the function is launched
if ("file://" + __filename === url.pathToFileURL(process.argv[1]).href) {
  import("@scaleway/serverless-functions").then((scw_fnc_node) => {
    scw_fnc_node.serveHandler(exports.handle, 8080);
  });
}
