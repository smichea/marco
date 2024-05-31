// Helper functions to manage cookies
function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

async function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value;
    if (message.trim()) {
        displayMessage('user', message);
        chatInput.value = '';

        // Retrieve thread ID from cookie
        let threadId = getCookie('thread_id');

        // Making a POST request to your Scaleway Serverless function
        const response = await fetch('https://your-scaleway-function-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: message, thread_id: threadId })
        });

        if (response.ok) {
            const data = await response.json();
            const assistantMessage = data.text;  // Assuming the response includes a field 'text'
            displayMessage('assistant', assistantMessage);

            // Save thread ID to cookie if it's not set yet
            if (!threadId && data.thread_id) {
                setCookie('thread_id', data.thread_id, 7);  // Set cookie for 7 days
            }
        } else {
            displayMessage('assistant', 'Failed to fetch response.');
        }
    }
}

function displayMessage(sender, text) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    messageElement.innerText = text;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('chat-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
