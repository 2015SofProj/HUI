/*** Initialize Friends List ***/
function initFriends() {
    $('nav').animate({
        scrollTop: $('#btn_new_friend').height() + 10
    }, 'fast');
    
    $('#btn_new_friend').click(function() {
        showPopup('newFriend.html', initNewFriend);
    });

	getFriends(window.userData.id, function(data) {
		$('#nav_content > div:nth-child(2)').html("");

        if(typeof(data.friendList.length) != 'undefined' && data.friendList.length != 0) {
            $('#nav_content > div:nth-child(2)').css('text-align', '');
        	for(var i = 0; i < data.friendList.length; i++) {
        		var profilePicture = 'images/roomicon.png';
        		var name = 'null';
        		var time = '';

        		if(data.friendList[i].photo != 'null')
        			profilePicture = data.friendList[i].photo;

        		name = decodeURI(data.friendList[i].nickname);

        		$('#nav_content > div:nth-child(2)').append(
        			'<div class="chat_list_tuple">' + 
    			        '<div>' +
    			            '<div class="pic" style="background-image: url(\'' + profilePicture + '\')"></div>' +
    			        '</div>' +
    			        '<div>' +
    			            '<span class="span_room_title">' + name + '</span><br />' +
    			            '<span class="span_room_info">Last seen just ago.</span>' +
    			        '</div>' +
    			    '</div>'
    			);
        	}
        } else {
            $('#nav_content > div:nth-child(2)').css('text-align', 'center');
            $('#nav_content > div:nth-child(2)').html('<span style="margin: 20px; display: inline-block;">왕따예요.<br />친구가 없어요 T-T</span>');
        }
    });
}

// Function Name: initNewFriend
// Description: Binding Events to add a new friend.
// Author: JoonChul Kim
function initNewFriend() {
    $('#btn_close_popup').click(function() {
        hidePopup();
    });

    // Try add a new friend when click "add" button or press "Enter" key.
    $('#btn_add_friend').click(function() {
        tryAddNewFriend();
    });
    
    enterKeyBind('#txt_new_friend_id', function() {
        tryAddNewFriend();
    });
}

function tryAddNewFriend() {
    if(typeof(adding) != 'undefined' && adding) {
        alert("새 친구를 추가하는 중입니다.\n잠시만 기다려주세요.");
        
        return false;
    } // Avoid duplicate trying.
    
    adding = true;
    
    var memID = window.userData.id;
    
    if($('#txt_new_friend_id').val() == "") {
        alert('새 친구의 ID를 입력해주세요.');
    } else {
        addNewFriends(encodeURI(memID), encodeURI($('#txt_new_friend_id').val()), function(result) {
            delete adding;

            console.log(typeof(result) + " / " + result);
            
            if(result == 'true') {
                hidePopup();
                initFriends();
            } else {
                alert("새 친구를 추가하지 못했습니다.\nID가 올바른지 확인해주세요.");
            }
        });
    }
}