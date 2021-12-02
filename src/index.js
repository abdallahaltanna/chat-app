const path = require('path');
const http = require('http');
const express = require('express');
const socket = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

// create express application
const app = express();

// create http server
const server = http.createServer(app);

// connect socket.io
const io = socket(server);

const port = process.env.PORT || 3000;
const publicDirestoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirestoryPath));

io.on('connection', (socket) => {
  socket.on('join', (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options })

    if (error) {
      return callback(error)
    }

    socket.join(user.room);

    socket.emit('message', generateMessage('Admin', 'Welcome!'));
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined`));

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback()
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id)
    
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback('Profanity is not allowed!');
    }

    io.to(user.room).emit('message', generateMessage(user.username, message));
    callback('Delivered!');
  });

  socket.on('sendLocation', (coords, callback) => {
    const user = getUser(socket.id)
    io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)

    if (user) {
      io.to(user.room).emit('message', generateMessage(user.username, `${user.username} has left!`));
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  });
});

server.listen(port, () => {
  console.log(`You listen on port ${port}`);
});
