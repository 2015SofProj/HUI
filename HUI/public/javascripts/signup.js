// Function Name: initSignup
// Description: Binding Events to sign up
// Author: JoonChul Kim
function initSignup() {
	// Change popup contents to login when click "Back" button.
    $('#btn_signup_back').click(function() {
        $.ajax({
            url: "./modules/login.html"
        }).done(function(page) {
            $('#popup').html(page);
            initLogin();
        });
    });

    // Try sign up when click "sign up" button or press "Enter" key.
    $('#btn_signup_square').click(function() {
    	trySignup();
    });
    
    enterKeyBind('#txt_signup_id', function() {
    	trySignup();
    });
    
    enterKeyBind('#txt_signup_nickname', function() {
    	trySignup();
    });
    
    enterKeyBind('#txt_signup_pw', function() {
    	trySignup();
    });
    
    enterKeyBind('#txt_signup_pw_re', function() {
    	trySignup();
    });
}

//Function Name: trySignup
//Description: Try sign up.
//Author: JoonChul Kim
function trySignup() {
	if(typeof(signingUp) != 'undefined' && signingUp) {
		alert("회원가입 중입니다.\n잠시만 기다려주세요.");
		
		return false;
	} // Avoid duplicate trying.
	
	signingIn = true;
	
	var memID = $('#txt_signup_id').val();
	var nickname = $('#txt_signup_nickname').val();
	
	if($('#txt_signup_id').val() == "" || $('#txt_signup_nickname').val() == "") {
		alert('모든 칸을 채워주세요.');
	} else if($('#txt_signup_pw').val() != $('#txt_signup_pw_re').val()) {
		alert('암호와 암호 확인이 일치하지 않습니다.');
    } else {
    	createMember({
    		"memID": encodeURI(memID),
    		"memPW": $('#txt_signup_pw').val(),
    		"nickName": encodeURI(nickname),
    		"photoURL": "null",
    		"personalSetting": "null"
		}, function(result) {
			delete signingIn;
			
			if(result == "success") {
				noti("HUI", "회원가입이 완료되었습니다, " + nickname + "님.\n로그인 해주세요.", true);
				
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
}