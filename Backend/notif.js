const readline = require('readline');
const io = require('socket.io-client');

// Connect to your server
const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log(`[+] Connected as ${socket.id}`);
    rl.prompt();
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

    rl.on('line', (input) => {
        input = input.toLowerCase();
        if (input.startsWith('send ')) sendprompt(input);
        else if (input.startsWith('post ')) postprompt(input);
        else if (input.startsWith('comment ')) commentprompt(input);

        else if (input === 'exit') {
            console.log('Exiting...');
            rl.close();
            return;
        } else {
            console.log('Commands:\n  send <userId> <message>\n  post <open|close> <pid>');
            console.log('  comment typing <CID> [0|1]\n  exit');
        }
        rl.prompt();
    });

    rl.on('close', () => {
        console.log('Goodbye!');
        process.exit(0);
    });
}

prompt();
