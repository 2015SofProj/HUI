/*** Initialize Settings ***/
function initSettings() {
    $('#btn_changeNickname').click(function() {
        showPopup('changeNickname.html', initChangeNickname);
    });

    $('#_file').hover(
        function() { $('#btn_changePhoto').css('text-decoration', 'underline'); },
        function() { $('#btn_changePhoto').css('text-decoration', ''); }
    ); // To hide the real input element.

    $('#_file').change(function() {
        var FR = new FileReader();
        FR.onload = function(e) {
            if(typeof(changing) != 'undefined' && changing) {
                alert('프로필 사진 변경 중입니다.\n잠시만 기다려 주세요.');
                return false;
            }

            changing = true;

            $.ajax({
                url: "https://api.imgur.com/3/upload",
                beforeSend: function (xhr) {xhr.setRequestHeader("Authorization", "Client-ID c4dddb0e18734dc");},
                type: "POST",
                data: {
                    image: e.target.result.replace(/.*,/, '')
                },
                datatype: "json",
                success: function(data) {
                    if(data.success == true) {
                        $("#profileImage").css("background-image", "url(" + data.data.link + ")");
                    }

                    updatePhoto({
                        'memID': window.userData.id,
                        'newURL': data.data.link
                    }, function(result) {
                        console.log(result);
                        if(!result.success) {
                            alert('프로필 사진 변경에 실패하였습니다.');
                        } else {
                            getInfo(window.userData.id);
                        }
                    });

                    delete changing;
                },
                error: function(data) {
                    alert('프로필 사진 변경에 실패하였습니다.');

                    delete changing;
                }
            });
        };
        FR.readAsDataURL( document.getElementById('_file').files[0] );
    });

    $('#btn_changePassword').click(function() {
        showPopup('changePassword.html', initChangePassword);
    });

    if(window.userData.photo !== "null")
        $('#profileImage').css('background-image', 'url(' + window.userData.photo + ')');

    $('#settings_account > div:nth-child(2) > strong').html(decodeURI(window.userData.nickname) + ' (' + decodeURI(window.userData.id) + ')');

    if (typeof(settings) == 'undefined' || settings === null || settings === "null") {
        settings = {
            "Alert":{
                "DesktopAlert":true,
                "MessagePreview":false,
                "AlertWithSound":true,
            },
            "General":{
                "SendType":0
            }
        };
    } else {
        if(settings.Alert.AlertWithSound) {
            $("#settings_alert_with_sound > img").prop("src", "images/set_switch_on.png");
        } else {
            $("#settings_alert_with_sound > img").prop("src", "images/set_switch_off.png");
        }

        if(settings.Alert.DesktopAlert) {
            $("#settings_desktop_alert > img").prop("src", "images/set_switch_on.png");
        } else {
            $("#settings_desktop_alert > img").prop("src", "images/set_switch_off.png");
        }

        if(settings.Alert.MessagePreview) {
            $("#settings_message_preview > img").prop("src", "images/set_switch_on.png");
        } else {
            $("#settings_message_preview > img").prop("src", "images/set_switch_off.png");
        }

        if(settings.General.SendType == 0) {
            $("#settings_sendtype_0 > div > img").prop("src", "images/set_radio_on.png");
            $("#settings_sendtype_1 > div > img").prop("src", "images/set_radio_off.png");
        } else {
            $("#settings_sendtype_0 > div > img").prop("src", "images/set_radio_off.png");
            $("#settings_sendtype_1 > div > img").prop("src", "images/set_radio_on.png");
        }
    }

    // Alert Settings Event Binding
    $("#settings_desktop_alert").click(function() {
        if(settings.Alert.DesktopAlert) {
            settings.Alert.DesktopAlert = false;
            $("#settings_desktop_alert > img").prop("src", "images/set_switch_off.png");
        } else {
        	if(typeof(Notification) == "undefined") {
        		alert("이 브라우저에서는 알림 기능이 지원되지 않습니다.");
        	} else {
	        	if(Notification.permission == "denied") {
					alert("웹 브라우저에서 알림 기능이 거부되어 있습니다.\n이 브라우저에서는 알림을 표시할 수 없습니다.");
				}

				if(Notification.permission != "granted") {
					Notification.requestPermission();
				}
        	}

			settings.Alert.DesktopAlert = true;
            $("#settings_desktop_alert > img").prop("src", "images/set_switch_on.png");
        }

        updateSettings(window.userData.id, settings, function(){});
    });

    $("#settings_message_preview").click(function() {
        if(settings.Alert.MessagePreview) {
            settings.Alert.MessagePreview = false;
            $("#settings_message_preview > img").prop("src", "images/set_switch_off.png");
        } else {
            settings.Alert.MessagePreview = true;
            $("#settings_message_preview > img").prop("src", "images/set_switch_on.png");
        }

        updateSettings(window.userData.id, settings, function(){});
    });

    $("#settings_alert_with_sound").click(function() {
        if(settings.Alert.AlertWithSound) {
            settings.Alert.AlertWithSound = false;
            $("#settings_alert_with_sound > img").prop("src", "images/set_switch_off.png");
        } else {
            settings.Alert.AlertWithSound = true;
            $("#settings_alert_with_sound > img").prop("src", "images/set_switch_on.png");
        }

        updateSettings(window.userData.id, settings, function(){});
    });

    // General Settings Event Binding
    $("#settings_sendtype_0").click(function() {
        settings.General.SendType = 0;

        $("#settings_sendtype_0 > div > img").prop("src", "images/set_radio_on.png");
        $("#settings_sendtype_1 > div > img").prop("src", "images/set_radio_off.png");

        updateSettings(window.userData.id, settings, function(){});
    });

    $("#settings_sendtype_1").click(function() {
        settings.General.SendType = 1;

        $("#settings_sendtype_0 > div > img").prop("src", "images/set_radio_off.png");
        $("#settings_sendtype_1 > div > img").prop("src", "images/set_radio_on.png");

        updateSettings(window.userData.id, settings, function(){});
    });


    // Logout Event Binding
    $("#settings_logout").click(function() {
        $.get("http://192.168.60.100:3000/logout",function(data){
            if(data==='logout'){
                document.location.reload();
            }
        });
    });
}

// Function Name: initChangeNickname
// Description: Binding Events to change nickname
// Author: JoonChul Kim
function initChangeNickname() {
    $('#txt_change_nickname').val(window.userData.nickname);

    $('#txt_change_nickname_back').click(function() {
        hidePopup();
    });

    // Try sign up when click "change" button or press "Enter" key.
    $('#txt_change_nickname_square').click(function() {
        tryChangeNickname();
    });

    enterKeyBind('#txt_change_nickname', function() {
        tryChangeNickname();
    });
}

//Function Name: tryChangeNickname
//Description: Try change nickname.
//Author: JoonChul Kim
function tryChangeNickname() {
    if(typeof(changing) != 'undefined' && changing) {
        alert("닉네임 변경 중입니다.\n잠시만 기다려주세요.");

        return false;
    } // Avoid duplicate trying.

    changing = true;

    var memID = window.userData.id;

    if($('#txt_change_nickname').val() == "") {
        alert('모든 칸을 채워주세요.');
    } else {
        changeNickname({
            "memID": encodeURI(memID),
            "newNick": encodeURI($('#txt_change_nickname').val())
        }, function(result) {
            delete changing;

            if(result.success) {
                alert("닉네임이 변경되었습니다.");

                document.location.reload();
            } else {
                alert("닉네임 변경에 실패했습니다.");
            }
        });
    }
}

// Function Name: initChangePassword
// Description: Binding Events to change password
// Author: JoonChul Kim
function initChangePassword() {
    $('#txt_change_pasword_back').click(function() {
        hidePopup();
    });

    // Try sign up when click "change" button or press "Enter" key.
    $('#txt_change_pasword_square').click(function() {
        tryChangePassword();
    });

    enterKeyBind('#txt_change_pasword_current_pw', function() {
        tryChangePassword();
    });

    enterKeyBind('#txt_change_pasword_new_pw', function() {
        tryChangePassword();
    });

    enterKeyBind('#txt_change_pasword_new_pw_re', function() {
        tryChangePassword();
    });
}

//Function Name: tryChangePassword
//Description: Try change password.
//Author: JoonChul Kim
function tryChangePassword() {
    if(typeof(changing) != 'undefined' && changing) {
        alert("암호 변경 중입니다.\n잠시만 기다려주세요.");

        return false;
    } // Avoid duplicate trying.

    changing = true;

    var memID = window.userData.id;

    if($('#txt_change_pasword_current_pw').val() == "" || $('#txt_change_pasword_new_pw').val() == "" || $('#txt_change_pasword_new_pw_re').val() == "") {
        alert('모든 칸을 채워주세요.');
    } else if($('#txt_change_pasword_new_pw').val() != $('#txt_change_pasword_new_pw_re').val()) {
        alert('암호와 암호 확인이 일치하지 않습니다.');
    } else {
        changePassword({
            "memID": encodeURI(memID),
            "existing": $('#txt_change_pasword_current_pw').val(),
            "newPw": $('#txt_change_pasword_new_pw').val()
        }, function(result) {
            delete changing;

            if(result.success) {
                alert("암호가 변경되었습니다.\n다시 로그인해주세요.");

                $.get("http://192.168.60.100:3000/logout",function(data){
                    if(data==='logout'){
                        document.location.reload();
                    }
                });
            } else {
                alert("암호 변경에 실패했습니다.");
            }
        });
    }
}