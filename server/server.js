require('dotenv').config();
console.log(process.env.HARPERDB_URL); // remove this after you've confirmed it working
const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const {Server} = require('socket.io');
const server = http.createServer(app);
const {harperSaveMessage, harperGetMessages} = require('./services/harper-save-messages');
const leaveRoom = require('./utils/leave-room'); 

app.use(cors());

// app.get('/', (req, res) => {
//     res.send('Hello World!!!');
// });

const io = new Server(server, {
    cors:{
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
})

const CHAT_BOT = 'Chat Bot';
let chatRoom = ''; // E.g. javascript, node,...
let allUsers = []; // All users in current chat room

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.on('join_room', (data) => {
        const { username, room } = data; 
        socket.join(room);
        console.log(`User ${username} has joined room ${room}`)
        let __createdtime__ = Date.now(); 
        socket.to(room).emit('receive_message', {
        message: `${username} has joined the chat room`,
        username: CHAT_BOT,
        __createdtime__,
        });
        socket.emit('receive_message', {
            message: `Welcome ${username}`,
            username: CHAT_BOT,
            __createdtime__,
        });
        chatRoom = room;
        allUsers.push({ id: socket.id, username, room });
        chatRoomUsers = allUsers.filter((user) => user.room === room);
        socket.to(room).emit('chatroom_users', chatRoomUsers);
        socket.emit('chatroom_users', chatRoomUsers);
        // Get last 100 messages sent in the chat room
        harperGetMessages(room)
        .then((last100Messages) => {
          // console.log('latest messages', last100Messages);
          socket.emit('last_100_messages', last100Messages);
        })
        .catch((err) => console.log(err));
    });
    socket.on('send_message', (data) => {
        const { message, username, room, __createdtime__ } = data;
        io.in(room).emit('receive_message', data); // Send to all users in room, including sender
        harperSaveMessage(message, username, room, __createdtime__) // Save message in db
          .then((response) => console.log(response))
          .catch((err) => console.log(err));
    });
    socket.on('leave_room', (data) => {
        const { username, room } = data;
        socket.leave(room);
        const __createdtime__ = Date.now();
        // Remove user from memory
        allUsers = leaveRoom(socket.id, allUsers);
        socket.to(room).emit('chatroom_users', allUsers);
        socket.to(room).emit('receive_message', {
          username: CHAT_BOT,
          message: `${username} has left the chat`,
          __createdtime__,
        });
        console.log(`${username} has left the chat`);
    });
    socket.on('disconnect', () => {
        console.log('User disconnected from the chat');
        const user = allUsers.find((user) => user.id == socket.id);
        if (user?.username) {
          allUsers = leaveRoom(socket.id, allUsers);
          socket.to(chatRoom).emit('chatroom_users', allUsers);
          socket.to(chatRoom).emit('receive_message', {
            message: `${user.username} has disconnected from the chat.`,
          });
        }
    });
});

server.listen(4000, () => {
    console.log('Server is listening on port 4000');
});