// Function Name: initUI
// Description: Initialize UI.
// Author: JoonChul Kim
function initUI() {
    $('#chat').animate({
        scrollTop: $('#chat').prop('scrollHeight')
    }, 'slow'); // show chat list. this process will *removed* when completely implement login function.

    // Main Menu Event Binding

    $('#btn_friends').click(function() {
        $('#nav_content').html("");

        $.ajax({
            url: "./modules/friends.html"
        }).done(function(page) {
            $('#nav_content').html(page);
            initFriends();
        });

        $('#btn_friends').prop('src', 'images/btn_friends_purple.png');
        $('#btn_chat').prop('src', 'images/btn_chat_grey.png');
        $('#btn_settings').prop('src', 'images/btn_settings_grey.png');
    });

    $('#btn_chat').click(function() {
        $('#nav_content').html("");

        $.ajax({
            url: "./modules/chatlist.html"
        }).done(function(page) {
            $('#nav_content').html(page);
            initChatlist();
        });

        $('#btn_friends').prop('src', 'images/btn_friends_grey.png');
        $('#btn_chat').prop('src', 'images/btn_chat_purple.png');
        $('#btn_settings').prop('src', 'images/btn_settings_grey.png');
    });

    $('#btn_settings').click(function() {
        $('#nav_content').html("");

        $.ajax({
            url: "./modules/settings.html"
        }).done(function(page) {
            $('#nav_content').html(page);
            initSettings();
        });

        $('#btn_friends').prop('src', 'images/btn_friends_grey.png');
        $('#btn_chat').prop('src', 'images/btn_chat_grey.png');
        $('#btn_settings').prop('src', 'images/btn_settings_purple.png');
    });

    $('#header_btn_more').click(function(e) {
        if($('#room_menu').css('display') == 'none') {
            $('#room_menu').css('right', $(window).width() - e.clientX);
            console.log($(window).width());
            $('#room_menu').css('top', e.clientY);
            $('#room_menu').show();
        } else
            $('#room_menu').hide();
    });

    $('#room_menu > li:nth-child(1)').click(function(e) {
        showPopup('changeRoomname.html', function() {
            initChangeRoomname();
        });
    });

    $('#room_menu > li:nth-child(2)').click(function(e) {
        showPopup('inviteFriend.html', function() {
            initInviteFriend();
        });
    });

    // Enter Key Event Binding to send messages.

    $('#typebox > textarea').keypress(function(event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13') {
            handleMessageProcess({
                "id": window.userData.id,
                "sender": window.userData.id,
                "nick": window.userData.nickname,
                "room": window.roomData.r_index,
                "text": $('#typebox > textarea').val()
            });

            event.preventDefault();
            event.stopPropagation();

            var pic;

            if(window.userData.photo == 'null')
                pic = 'images/roomicon.png';
            else
                pic = window.userData.photo;

            $('#chat').append(
                '<div class="chat_msg" style="background-image: url(' + pic + ')">' +
                    '<span class="chat_name">' + decodeURI(window.userData.nickname) + '</span>' +
                    $('#typebox > textarea').val() +
                    '<span class="chat_time">' + sendedTime() + '</span>' +
                '</div>'
            );

            $('#typebox > textarea').val("");

            $('#chat').animate({
                scrollTop: $('#chat').prop('scrollHeight')
            }, 'slow');
        }
    });

    // 회원가입 한 것의 성공 또는 실패 메시지
    socket.on('createMemberResult',function(result) {
        delete signingIn;

        var nick = $('#txt_signup_nickname').val();
        var memID = $('#txt_signup_id').val();

        if(result == "success") {
            noti("HUI", "회원가입이 완료되었습니다, " + nick + "님.\n로그인 해주세요.", true);
				
            $.ajax({
                url: "./modules/login.html"
            }).done(function(page) {
                $('#popup').html(page);
                initLogin(memID);
            });
        } else {
            noti("HUI", "회원가입에 실패했습니다.", true);
        }
    });

}

function sendedTime() {
    var now = new Date();
    return (now.toDateString()+ " " + now.getHours() + ':'
            + ((now.getMinutes() < 10) ? ("0" + now.getMinutes()): (now.getMinutes())));
}

// Function Name: startService
// Description: Codes about starting service.
// Author: JoonChul Kim
function startService() {
    hidePopup();
    noti("HUI", decodeURI(window.userData.nickname) + "님 반갑습니다.", false);

    $.ajax({
        url: "./modules/chatlist.html"
    }).done(function(page) {
        $('#nav_content').html(page);
        initChatlist();
    }); // show chatting room list. this process will *removed* when completely implement login function.

    socket.on('message',function(message){
        console.log(message);
        appendNewMessage(message);
    });
}

// Function Name: showPopup
// Input: URL to show, Callback Function
// Output: None.
// Description: Show popup screen and disable textarea.
// Author: JoonChul Kim
function showPopup(url, callback) {
    $('#transparented').show();
    $('#popup').show();

    $("#typebox > textarea").prop({"disabled": "disabled"});

    $.ajax({
        url: 'modules/' + url
    }).done(function(page) {
        $('#popup').html(page);
        if(typeof(callback) != undefined) {
            callback();
        }
    });
}

// Function Name: hidePopup
// Description: Hide popup screen and enable textarea.
// Author: JoonChul Kim
function hidePopup() {
    $('#transparented').hide();
    $('#popup').hide();
    $("#typebox > textarea").removeProp("disabled");
    $("#typebox > textarea").focus();
}

// Function Name: Enter Key Event Binder
// Description: Detect "Enter Key Event" from specific element and binding callback function.
// Author: JoonChul Kim
function enterKeyBind(element, callback) {
    $(element).keypress(function(event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13') {
            callback();
        }
     event.stopPropagation();
    });
}

// Function Name: noti
// Description: Show Notification
// Author: JoonChul Kim
function noti(notiTitle, notiBody, showAlert) {
    if(typeof(Notification) != "undefined" && Notification.permission == "granted") {
        new Notification(notiTitle, {icon: "images/roomicon.png", body: notiBody});
    } else {
        if(showAlert) {
            alert(notiBody);
        }
    }
}

// Function Name: dbgNoti
// Input: Boolean variable "starts"
// Output: None.
// Description: When it got true, starts make notifications, and got false, stop making.
// Author: JoonChul Kim
function dbgNoti(starts) {
    if(starts) {
        dbgNotiInterval = setInterval(function() {
                noti("HUI", new Date, false);
        }, 10000);
    } else {
        clearInterval(dbgNotiInterval);
    }
}

function appendNewMessage(msg) {
    var pic;

    if(msg.pic == 'null')
        pic = 'images/roomicon.png';
    else
        pic = msg.pic;

    $('#chat').append(
        '<div class="chat_msg" style="background-image: url(' + pic + ')">' +
            '<span class="chat_name">' + decodeURI(msg.nick) + '</span>' +
            msg.text +
            '<span class="chat_time">' + msg.time + '</span>' +
        '</div>'
    );

    $('#chat').animate({
        scrollTop: $('#chat').prop('scrollHeight')
    }, 1);
}