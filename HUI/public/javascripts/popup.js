function initInviteFriend() {
	$('.btn_popup_negative').click(function() { hidePopup() });

    getFriends(window.userData.id, function(data) {
        $('#list_friends').html("");

        if(typeof(data.friendList.length) != 'undefined' && data.friendList.length != 0) {
            $('#list_friends').css('text-align', '');
            for(var i = 0; i < data.friendList.length; i++) {
                var profilePicture = 'images/roomicon.png';
                var name = 'null';

                if(data.friendList[i].photo != 'null')
                    profilePicture = data.friendList[i].photo;

                name = decodeURI(data.friendList[i].nickname);

                $('#list_friends').append(
                    '<div class="popup_list_tuple" onclick="selectFriendToInvite(this, \'' + data.friendList[i].memID + '\')">' +
                        '<div>' +
                            '<div class="popup_list_pic"  style="background-image: url(\'' + profilePicture + '\')"></div>' +
                        '</div>' +
                        '<div>' +
                            '<span class="span_room_title">' + name + '</span>' +
                        '</div>' +
                    '</div>'
                );
            }
        } else {
            alert('친구가 없습니다!');
            hidePopup();
        }
    });
}

function selectFriendToInvite(selected, selectedId) {
	$('.popup_list_tuple').css('background-color', '');

	$(selected).css('background-color', '#B6B6B6');

	$('.btn_popup_positive').unbind();
	$('.btn_popup_positive').click(function() {
		alert(window.userData.id + " / " + selectedId + " / " + window.roomData.r_index)
		inviteNewFriend(window.userData.id, selectedId, window.roomData.r_index);
	});
}

function initChangeRoomname() {
    $('.btn_popup_negative').click(function() { hidePopup() });

    $('#txt_change_roomname').val(decodeURI(window.roomData.roomName));

    $('.btn_popup_positive').click(function() { tryChangeRoomname(); });
    enterKeyBind('#txt_change_roomname', function() { tryChangeRoomname() });
}

function tryChangeRoomname() {
    updateChatroomNameFront(window.roomData.r_index, encodeURI($('#txt_change_roomname').val()), function(answer) {

        var data = JSON.parse(answer);

        if(data.result) {
            hidePopup();
            initChatlist();
            tryJoinRoom(window.userData.id, window.roomData.r_index);
        } else {
            alert('방 이름 변경에 실패했습니다.\n잠시 후 다시 시도해주세요.');
        }
    });
}