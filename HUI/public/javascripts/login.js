// Function Name: initLogin
// Description: Binding Events to login
// Author: JoonChul Kim
function initLogin(id) {
    // Change popup contents to sign up when click "sign up" button.
    $('#btn_login_signup').click(function() {
        $.ajax({
            url: "./modules/signup.html"
        }).done(function(page) {
            $('#popup').html(page);
            initSignup();
        });
    });

    // Try login when click "login" button or press "Enter" key.
    $('#btn_login_square').click(function() {
        tryLogin();
    });

    enterKeyBind('#txt_login_id', function() {
        tryLogin();
    });

    enterKeyBind('#txt_login_pw', function() {
        tryLogin();
    });

    // If it receive parameter, fill id textbox.
    if(typeof(id) != 'undefined') {
        $("#txt_login_id").val(id);
    }
}

//Function Name: tryLogin
//Description: Try login.
//Author: JoonChul Kim
function tryLogin() {
    if(typeof(loggingIn) != 'undefined' && loggingIn) {
        alert("로그인 중입니다.\n잠시만 기다려주세요.");
        return false;
    } // Avoid duplicate trying.

    loggingIn = true;

    verifyMember({
        'memID':encodeURI($('#txt_login_id').val()),
        'memPW':$('#txt_login_pw').val()
    }, function(succeed) {
        delete loggingIn;

        if(succeed) {
        // When it succeed login, it try to make a session.
            $.post("http://localhost:3000/login", {userId : $('#txt_login_id').val()}, function(data) {
                var info = JSON.parse(data);
                if(info.result==="done") {
                // Below code are what to do after made a session.
                    settings = {
                        "Alert":{
                            "DesktopAlert":true,
                            "MessagePreview":false,
                            "AlertWithSound":true,
                        },
                        "General": {
                            "SendType":0
                        }
                    }; // Load user settings.

                    if(settings.Alert.DesktopAlert) {
                        if(typeof(Notification) != "undefined" && Notification.permission != "granted") {
                            Notification.requestPermission();
                        }

                        if(typeof(Notification) != "undefined" && Notification.permission == "denied") {
                            alert("웹 브라우저에서 알림 기능이 거부되어 있습니다.\n이 브라우저에서는 알림을 표시할 수 없습니다.");
                        }
                    } // Check whether HUI can show Desktop Notification or not.

                    // noti("HUI", "로그인이 완료되었습니다.", true); // This line will be removed.
                    getInfo($('#txt_login_id').val(), function() {
                        startService();
                    });
                } else {
                    noti("HUI", "로그인에 실패했습니다.", true);
                }
            });
        } else {
            // If it succeed login but failed make a session, it shows a fail message.
            noti("HUI", "로그인에 실패했습니다.", true);
        }
    });
}