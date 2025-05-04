const readline = require('readline');
const io = require('socket.io-client');

// Connect to your server
const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log(`[+] Connected as ${socket.id}`);
    promptInput();
});

socket.on('disconnect', () => {
    console.log('[!] Disconnected');
    process.exit(0);
});

socket.on('typingComment', ({postID, commentID}) => {
    console.log(`Someone is typing a comment on post ID: ${postID}, comment ID: ${commentID}`);
    // You can trigger a UI animation or message here
});

function promptInput() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'notif> '
    });

    rl.prompt();

    rl.on('line', (line) => {
        const input = line.trim();
        if (input === 'exit') {
            rl.close();
            socket.disconnect();
        } else if (input.startsWith('send ')) {
            const [, userId, ...msgParts] = input.split(' ');
            const message = msgParts.join(' ');
            if (!userId || !message) {
                console.log('Usage: send <userId> <message>');
            } 
            else {
                socket.emit('sendNotification', { toUserId: userId, message });
                console.log(`[>] Sent to ${userId}: ${message}`);
            }
        } else if (input.startsWith('post ')) {
            const [, option, PostID, commentID ] = input.split(' ');
            console.log(`option: ${option}, PostID: ${PostID}`);

            if (option === 'open') { socket.emit('viewPost', PostID); }
            else if (option === 'close') { socket.emit('stopViewingPost', PostID); }
            else if (option === 'typing') { socket.emit('typingComment', { postID: PostID, commentID: commentID });
        }

            else { console.log('Usage: post <postID> on|off'); }
        } else {
            console.log('Commands:\n  send <userId> <message>\n  exit');
        }
        rl.prompt();
    });
}
