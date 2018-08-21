const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
	res.sendFile(__dirname + 'public/index.html');
});

const names = [
'Verlene',
'Jule',
'Jefferey',
'Johnny',
'Ranee',
'Chrystal',
'Esperanza',
'Sebrina',
'Allan',
'Sherly'
];
let users = {};
const rooms = {
  "lobby": {
    user_created: false
  }
}

function updateOnlineCount() {
	io.emit('currently online', Object.keys(users).length);
}

io.on('connection', function(socket){
  users[socket.id] = {};
  users[socket.id].name = names.length ? names.pop() : 'default';
  socket.join('lobby');
  updateOnlineCount();
  socket.emit('set name', users[socket.id].name);
  socket.broadcast.emit('admin message', `${users[socket.id].name} logged on`);
  socket.emit('admin message', `Logged on, now in the lobby. Type /help for list of commands.`);
  socket.on('disconnect', function(){
    io.emit('admin message', `${users[socket.id].name} has logged out`);
    delete users[socket.id];
    updateOnlineCount();
  });
  socket.on('chat message', function(msg) {
    if (rooms[msg.room] && socket.rooms[msg.room]) {
    	let ct = new Date();
      socket.broadcast.to(msg.room).emit('chat message', {user: users[socket.id].name, content: msg.content, time: `${ct.getHours()}:${ct.getMinutes()}`});
      socket.emit('sent time', {id: msg.id, content:`${ct.getHours()}:${ct.getMinutes()}`});
    } else {
      socket.emit('admin message', `The room you are in either doesn't exist or you are not a member`);
    }
  });
  socket.on('name change', function(newName){
  	let oldName = users[socket.id].name;
  	users[socket.id].name = newName;
  	io.emit('name change', `${oldName} changed name to ${newName}`);
  });
  socket.on('join room', function(newRoom) {
    if (!rooms[newRoom]) { // if the room doesn't exist yet
      rooms[newRoom] = {
        admin_id: socket.id,
        user_created: true
      };
    } else if (socket.rooms[newRoom]) { // If the client has already joined
      socket.emit('admin message', `You have already joined ${newRoom}`);
      return;
    }
    let roomAdmin = `the current admin is ${users[rooms[newRoom].admin_id].name}`;
    if (rooms[newRoom].admin_id == socket.id) {
      roomAdmin = "you are the admin";
    }
    socket.broadcast.to(newRoom).emit('admin message', `${users[socket.id].name} joined the room.`);
    socket.join(newRoom);
    socket.emit('admin message', `You joined the room ${newRoom}, ${roomAdmin}.`);
  });
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});