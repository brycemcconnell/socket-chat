const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
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

function updateOnlineCount() {
	io.emit('currently online', Object.keys(users).length);
}

io.on('connection', function(socket){
  users[socket.id] = {};
  users[socket.id].name = names.length ? names.pop() : 'default';
  updateOnlineCount();
  socket.emit('set name', users[socket.id].name);
  socket.broadcast.emit('admin message', `${users[socket.id].name} joined the chat`);
  socket.emit('admin message', `You joined the chat`);
  socket.on('disconnect', function(){
    io.emit('admin message', `${users[socket.id].name} left the chat`);
    delete users[socket.id];
    updateOnlineCount();
  });
  socket.on('chat message', function(msg){
  	let ct = new Date();
  	socket.broadcast.emit('chat message', {user: users[socket.id].name, content: msg.content, time: `${ct.getHours()}:${ct.getMinutes()}`});
  	socket.emit('sent time', {id: msg.id, content:`${ct.getHours()}:${ct.getMinutes()}`});
  });
  socket.on('name change', function(newName){
  	let oldName = users[socket.id].name;
  	users[socket.id].name = newName;
  	io.emit('name change', `${oldName} changed name to ${newName}`);
  });
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});