//입력받은대로 출력 (브라우저가 텍스트를 HTML태그로 인식하지 않음)
function divEscapedContentElement(message) {
	return $('<div></div>').text(message);
}

//시스템이 생성한 신뢰할 수 있는 내용을 화면에 출력
function divSystemContentElement(message) {
	return $('<div></div>').html('<i>' + message + '</i>');
}

function loginProcess(chatApp, socket){
	var id = $('#login-id').val();
	var pw = $('#login-pw').val();
	chatApp.verifyUser(id,pw);
}
//사용자 입력을 처리
function processUserInput(chatApp, socket) {
	var message = $('#send-message').val();
	var systemMessage;

	//채팅 명령 처리
	if (message.charAt(0) == '/') {
		systemMessage = chatApp.processCommand(message);
		if (systemMessage) {
			$('#messages').append(divSystemContentElement(systemMessage));
		}
	} else { //메세지를 다른 모든 사용자에게 전송하고, 대화글 목록에 추가
		chatApp.sendMessage($('#room').text(), message);
		$('#messages').append(divEscapedContentElement(message));
		$('#messages').scrollTop($('#messages').prop('scrollHeight'));
	}

	$('#send-message').val('');
}

//웹 브라우저가 로딩 된 후에 소행할 로직-->

var socket = io.connect();
var rows;

$(document).ready(function() {
	var chatApp = new Chat(socket);
	
	socket.on('verifyResult',function(result){
		var message;
		var identifiedUser = result.state;
		if(identifiedUser=='none')
			message = 'You enter wrong information. Try again';
		else
			chatApp.tryConnecting();
	});

	//닉네임 변경 요청 결과 출력
	socket.on('nameResult', function(result) {
		var message;

		if (result.success) {
			message = 'You are now known as ' + result.name + '.';
		} else {
			message = result.message;
		}
		$('#messages').append(divSystemContentElement(message));
	});
	
	//이전에 주고받은 메세지 목록을 출력
	socket.on('prevMessage',function(result){
	    rows = result.rows;
	    for(var i in rows){
	    	obj = JSON.parse(rows[i].data2);
	    	for(var j = 0; j<obj.number;j++){
	    		$('#messages').append(divSystemContentElement(obj.message[j].sender +
	    				' : ' +obj.message[j].msg +' > '+obj.message[j].time));
	    	}
	    };
	  });

	//채팅방 변경 결과 출력
	socket.on('joinResult', function(result) {
		$('#room').text(result.room);
		$('#messages').append(divSystemContentElement('Room changed.'));
	});

	//수신한 메세지 출력
	socket.on('message', function (message) {
		var newElement = $('<div></div>').text(message.text);
		$('#messages').append(newElement);
	});

	//입장할 수 있는 채팅방 목록 출력
	socket.on('rooms', function(rooms) {
		$('#room-list').empty();

		for(var room in rooms) {
			room = room.substring(1, room.length);
			if (room != '') {
				$('#room-list').append(divEscapedContentElement(room));
			}
		}

		//채팅방 이름을 클릭하여 채팅방을 변경
		$('#room-list div').click(function() {
			chatApp.processCommand('/join ' + $(this).text());
			$('#send-message').focus();
		});
	});

	//주기적으로 현재 채팅방 목록 요청
	setInterval(function() {
		socket.emit('rooms');
	}, 1000);

	$('#send-message').focus();

	//메세지를 전송하기 위해 폼을 submit
	$('#send-form').submit(function() {
		processUserInput(chatApp, socket);
		return false;
	});
});

