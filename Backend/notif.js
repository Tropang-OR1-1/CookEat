const readline = require('readline');
const io = require('socket.io-client');
//const notification = require('./config/socket/notification');

//const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjYzAyZmQ5ZjQxNGUzMjhmY2Y4YzZiZTE0NjUwMDM1MmJjYTc2YmMyMjdkMzg1N2Y0YjZkNTljZjA2Yjg1Y2IzIiwicGF5bG9hZCI6ImE5MzAxMmM2LTYwNGYtNGQxNS05ZWQ1LTIwY2VmOGUxOTA0MiIsImlhdCI6MTc0NzAyMzYyNSwiZXhwIjoxNzQ3NjI4NDI1fQ.2vZqQgX9hGzRlyoZJbjniIFZEHNJbSdCyBCcrRr6Dn8';
const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzMTIzNDg0YjIwNjlmNDNjZTVhYTgxY2IzMmZmNTE3OWYzMzhiYzAyY2Y2NjI3MTNjMzdlODNiNDQ4MjEwMTZhIiwicGF5bG9hZCI6ImViZTUxNzk2LWUyZWYtNDMyYi04OWQ1LWZjZjhmOWUwNWMzYSIsImlhdCI6MTc0Nzc5OTMxNSwiZXhwIjoxNzQ4NDA0MTE1fQ.zsPf4q01mhICRYBxO0Z-fVt_fy8xRACjy5IMGywXvZI';
//const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2YWZkNjlhNjJkMjlkMzYwNWNkOWU1OGY5ZmE4NDMxODljMWQ2ZmVhMjY0MGJlMTUzZjJiNmU5ZTcwY2MyMTdhIiwicGF5bG9hZCI6ImQ2NTBhNjRkLTAwMDUtNGYwMS05MTFiLTllMzQyYTZkNWE1YyIsImlhdCI6MTc0NzA1NTg4NSwiZXhwIjoxNzQ3NjYwNjg1fQ.rYkw8qJhYGMvqeM331gxI_Ja9NBiXfLjimglYGICyHQ';
// Connect to your server
const socket = io('http://localhost:3000', {
    auth: {
        token: token
        }
    });

socket.on('connect', () => {
    //socket.emit('notify');
    console.log(`[+] Connected as ${socket.id}`);
    rl.prompt();
});

socket.on('connect_error', (err) => {
    console.error('[!] Connection error:', err.message);
});

socket.on('client_error', (err) => {
    console.error('[!] client error:', err.message);
    });

socket.on('disconnect', () => {
    console.log('[!] Disconnected');
    process.exit(0);
});

// Handle typing notifications
socket.on('typingComment', ({ postID, commentID }) => {
    console.log(`Someone is typing on post ID: ${postID}, comment ID: ${commentID}`);
});

socket.on('stopTypingComment', ({ postID, commentID }) => {
    console.log(`Someone stopped typing on post ID: ${postID}, comment ID: ${commentID}`);
});

socket.on('postViewCountUpdate', ({ postId, count }) => {
    console.log(`Viewer update on post ${postId}: ${count}`);
    });

socket.on('notificationBatch', (notifications) => {
    console.log('Unread Notifications:', notifications);
    });

socket.on('notification', (notification) => {
    console.log('New Notification:', notification);
    });

socket.on('markedAsRead', (response) => {
    if (response.success) console.log('Notifications marked as read.');
    else console.error('Failed to mark notifications as read:', response.error);
});


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'notif> '
});

function sendprompt(input) {
    const [, userId, ...msgParts] = input.split(' ');
    const message = msgParts.join(' ');
    if (!userId || !message) {
        console.log('Usage: send <userId> <message>');
    } else {
        socket.emit('sendNotification', { toUserId: userId, message });
        console.log(`[>] Sent to ${userId}: ${message}`);
        }
    }

function readprompt(input) {
    // Remove the keyword "read" and trim any extra spaces
    const [, arrStr] = input.trim().split(/\s+(.+)/);

    try {
        // Attempt to parse the remaining input as JSON
        const arr = JSON.parse(arrStr);

        // Check if the parsed result is actually an array
        if (Array.isArray(arr)) {
            console.log('Parsed array:', arr);
            socket.emit('markAsRead', { notificationIds: arr });
        } else {
            console.error('Input is not an array');
        }
    } catch (err) {
        console.error('Failed to parse input as array:', err);
    }
}


function postprompt(input) {
    const [, option, PostID] = input.split(' ');

    if (option === 'open') { socket.emit('viewPost', PostID); }
    else if (option === 'close') { socket.emit('stopViewingPost', PostID); }
    else console.log('post [open|close] <PID>');
}

function commentprompt(input) {
    const [, option, commentID, toggle] = input.split(' ');

    if (option === 'typing') {
        if (toggle === '1' || toggle === 'true')
            socket.emit('typingComment', { commentID: commentID, toggle: true });
        else if (toggle === '0' || toggle === 'false')
            socket.emit('typingComment', { commentID: commentID, toggle: false });
        else console.log('comment typing <CID> [0|1]');
    } else console.log('comment typing <CID> [0|1]');
}

function prompt() {
    rl.prompt();
    console.log('Commands:\n  send <userId> <message>\n  post <open|close> <pid>');
    console.log('  comment typing <CID> [0|1]\n  read <[]>\n  notify\n  exit');
    rl.on('line', (input) => {
        input = input.toLowerCase();
        if (input.startsWith('send ')) sendprompt(input);
        else if (input.startsWith('post ')) postprompt(input);
        else if (input.startsWith('comment ')) commentprompt(input);
        else if (input.startsWith('notify')) socket.emit('notify');
        else if (input.startsWith('read ')) readprompt(input);
        else if (input.startsWith('exit')) {
            console.log('Exiting...');
            rl.close();
            return;
        }
        console.log('Commands:\n  send <userId> <message>\n  post <open|close> <pid>');
        console.log('  comment typing <CID> [0|1]\n  read <[]>\n  notify\n  exit');
        
        rl.prompt();
    });

    rl.on('close', () => {
        console.log('Goodbye!');
        process.exit(0);
    });
}

prompt();
