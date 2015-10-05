/*** Initialize Chatlist ***/
function initChatlist() {
    $('nav').animate({
        scrollTop: $('#btn_new_chat').height() + 10
    }, 'fast');
    
    $('#btn_new_chat').click(function() {
        showPopup('newChatRoom.html', initNewChatRoom);
    });

    getChatRoom(window.userData.id, function(data) {
        if(!data.chatRoomList) {
            $('#nav_content > div:nth-child(2)').css('text-align', 'center');
            $('#nav_content > div:nth-child(2)').html('<span style="margin: 20px; display: inline-block;">대화가 없어요 T-T</span>');
            $('#nav_content > div:nth-child(3)').html('')
        } else {
            $('#nav_content > div:nth-child(2)').html('');
            $('#nav_content > div:nth-child(3)').html('');

            for(var i = 0; i < data.chatRoomList.length; i++) {
                $('#nav_content > div:nth-child(3)').append(
                    '<div class="chat_list_tuple" onclick="tryJoinRoom(\'' + window.userData.id + '\', \'' + data.chatRoomList[i].r_index + '\')">' +
                        '<div>' +
                            '<img src="images/roomicon.png" />' +
                        '</div>' +
                        '<div>' +
                            '<span class="span_room_title">' + decodeURI(data.chatRoomList[i].roomName) + '</span><br />' +
                            '<span class="span_room_info">마지막 대화 내용</span>' +
                        '</div>' +
                    '</div>'
                );
            }
        }
    });
}

function initNewChatRoom() {
    $('#btn_close_popup').click(function() {
        hidePopup();
    });

    // Try add a new friend when click "add" button or press "Enter" key.
    $('#btn_add_room').click(function() {
    	tryCreateRoom();
    });
    
    enterKeyBind('#txt_new_room_id', function() {
        tryCreateRoom();
    });
}

function tryCreateRoom() {
	if(typeof(adding) != 'undefined' && adding) {
        alert("새 채팅방을 생성하는 중입니다.\n잠시만 기다려주세요.");
        
        return false;
    } // Avoid duplicate trying.
    
    adding = true;

    if($('#txt_new_room_id').val() == "") {
        alert('새 채팅방의 이름을 입력해주세요.');
    } else {
		sendForCreateRoom(window.userData.id, $("#txt_new_room_id").val(), function(result) {
            var data = JSON.parse(result);
			if(data.boolResult == 'true') {
				noti("HUI", "새로운 채팅방이 생성되었습니다.", true);
                hidePopup();
                initChatlist();
			} else {
				noti("HUI", "새로운 채팅방 생성에 실패했습니다.", true);
			}

            delete adding;
		});
	}
}

function tryJoinRoom(memId, rIndex) {
    joinRoom(memId, rIndex, function(result) {
        console.log(JSON.stringify(result));
        if(result.success) {
            $('#header_room_name').html(decodeURI(result.roomName));
            $('#chat').html('');
            window.roomData = result;
        } else {
            alert('일시적으로 채팅방에 입장할 수 없습니다.\n잠시 후 다시 시도해주세요.');
        }
    });
}