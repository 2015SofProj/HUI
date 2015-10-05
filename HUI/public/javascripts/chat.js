var Chat = function(socket) {
  this.socket = socket;
};

//채팅 메세지를 전송하는 함수
Chat.prototype.sendMessage = function(room, text) {
  var message = {
    room: room,
    text: text
  };
  this.socket.emit('message', message);
};

//채팅방을 변경하기 위한 함수
Chat.prototype.changeRoom = function(room) {
  this.socket.emit('join', {
    newRoom: room
  });
};

//채팅 명령을 처리하기 위한 함수
Chat.prototype.processCommand = function(command) {
  var words = command.split(' ');
  var command = words[0]
                .substring(1, words[0].length)
                .toLowerCase();
  var message = false;

  switch(command) {
    case 'join': //채팅방 변경/생성 처리
      words.shift();
      var room = words.join(' ');
      this.changeRoom(room);
      break;
    case 'nick': //닉네임 변경 처리
      words.shift();
      var name = words.join(' ');
      this.socket.emit('nameAttempt', name);
      break;
    default:
      message = 'Unrecognized command.';
      break;
  };

  return message;
};

Chat.prototype.verifyUser = function(id, pw){
	var userInfo = {
			userId : id,
			userPw : pw
	};
	this.socket.emit('verify',userInfo);
};

Chat.prototype.tryConnecting = function(){
	this.socket.emit('connectionRequest');
};
