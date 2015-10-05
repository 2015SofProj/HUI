// name: Anonymous
// Description: Initializer
$(document).ready(function() {
    socket = io.connect();

    initUI();
    verifyUser();


});



//name : verifyUser
//Input : 없음
//OUTPUT : 세션이 유효할 경우, 로그인 팝업이 사라짐
//Description : 페이지가 뜰 때마다 세션에 저장된 사용자인지 확인
//Author : Hyunyi Kim
function verifyUser(){
    $.post("http://localhost:3000/verify",function(data){
        var info = JSON.parse(data);

        if(info.result==="done") {
            hidePopup();
            getInfo(info.id, function() {
                startService();
            });
        } else {
            showPopup('login.html', function() {
                initLogin();
            }); // show login popup.
        }
    });
}

// name : createMember
// Input : JSON 형태로 된 userdata
// OUTPUT : Success or Fail Message
// Description : 회원가입용 함수 / 성공 또는 실패에 따라서 틀려진다.
// Author : Hanbyul Kang
function createMember(inUserData,callback)
{
    //chat_server.js 파일에 있는 createMemeber함수에 userData를 넘겨준다.
    socket.emit('createMember', JSON.stringify(inUserData));

    //return 'error';
}

//Function_Name : verifyMember
//Input_Data : JSON 형태로 된 사용자 정보
//Output_Data : 'success' or 'fail'
//Description : 사용자가 로그인 폼에 입력한 정보가 올바른지 판단
//Author: Hyuni Kim
function verifyMember(inUserData,callback){
    socket.emit('verifyMember',JSON.stringify(inUserData));
//  socket.on을 따로 작성지 않고, socket.emit의 콜백함수로 작성할 경우
//  socket.emit('verifyMember',JSON.stringify(inUserData),
//          function(result){
//      if(result.verify){
//          callback('success');
//      }else{
//          callback('fail');
//      }
//  });

    socket.on('verifyMemberResult',function(result){
        if(typeof(callback) != 'undefined') {
            callback(result.verify);
        } else {
            return result.verify;
        }
    });
}


//Function name : deleteFriends
//Descritpion : delete friend from database
//Input : userid, friend id
//Output : result message ( true or false )
//Author : Hanbyul Kang
function deleteFriends(userID,friendId,callback) {
    console.log("in DeleteFriends");
    socket.emit('deleteFriend',JSON.stringify({memID : userID, friendID : friendId}));
    socket.on('deleteFriend',function(result){
        callback(result);
    });
}

// Function name : sendForCreateRoom
// Descritpion : Send signal to create new chat room.
// Input : none
// Output : result message ( true or false )
// Author : Hanbyul Kang
function sendForCreateRoom(userUID,roomName,callback) {
    // cretae Message to JSON
    console.log("userID : " + userUID + "   room name : " + roomName);
    // get now time
    var createdTime = new Date().getTime();

    var message = JSON.stringify({ 'userUID' : userUID, 'roomName':roomName, 'createdTime' : createdTime});
    console.log("Send data to server : " + message);

    console.log("sendforcreateroom forsend message : " + message);
    socket.emit('sendForCreateRoom',message);
    socket.on('sendForCreateRoomResult',function (result) {
        console.log("Created room result : " + result);
        // result Return
        callback(result);
    });
    //fail to create chat room
    return false;
}

// Function name  : readChatList
// Description : read chat list from database (if success to create chat room or exist chat room )
// input : user id, room name
// output : chat list (JSON)
// Author : Hanbyul Kang
function readChatList(userUID,roomName,callback) {
    var message = JSON.stringify({ memID: userUID, roomName : roomName});
    //for debug
    console.log("readchatList data for send : "  + message);
    // data send to server
    socket.emit('readChatContentList',message);
    // accept data from server
    socket.on('readChatContentList',function(outputData){
        // return JSON data in chatlist
        // if first data is '0', error!
        callback(outputData);
    });
}
// Function name : updateChatroomName
// Descritpion : 대화방 이름 변경
// Input : r_index / new Room Name
// Output :
// Author : Hanbyul Kang
function updateChatroomNameFront(r_index, newName, callback) {
    console.log("In update chat room name");
    var jsonMessage = JSON.stringify({ r_index: r_index, newName: newName });
    socket.emit('updateChatroomName', jsonMessage);
    socket.on('updateChatroomNameFront', function (resultData) {
        console.log("update chatroom name result : " + resultData);
        callback(resultData);
    });
}

// Function name  : inviteNewFriend
// Description : read chat list from database (if success to create chat room or exist chat room )
// input : user id, r_index / friendName
// output : true / false
// Author : Hanbyul Kang
function inviteNewFriend(userUID, friendName, r_index,callback) {
    var jsonMessage = JSON.stringify({ memID: userUID, friendName: friendName, r_index: r_index })
    console.log("invite new friend json message : " + jsonMessage);
    socket.emit('inviteNewFriend', jsonMessage);
    socket.on('inviteNewFriend', function (resultData) {
        console.log("invite result data : " + resultData);
        callback(resultData);
    });
}


//Function name  : addNewFriends
//Description : add new friend to database
//input : user id, room name
//output : memID, friendName
//Author : Hanbyul Kang
function addNewFriends(userID,friendName,callback) {
    var jsonMessage = JSON.stringify({memID : userID, fList : friendName});

    console.log(jsonMessage);

    socket.emit('addNewFriend2',jsonMessage);
    socket.on('addNewFriend2',function (resultData) {
        callback(resultData);
    });
}

//Function name  : getInfo
//Description : get user information from DB
//input : user id sotred in session
//output : user information(JSON)
//Author : Hyunyi Kim
function getInfo(userId, callback){
    socket.emit('getUserInfo',userId);

    socket.on('getUserInfoResult',function(data){
        //return data.userInfo[0];
        getUserInfo(data.userInfo[0]);

        if(typeof(callback) != 'undefined') {
            callback();
        }
    });

}

//Function name  : getUserInfo
//Description : give information about user stored in session to client-side
//input : -
//output : user information(JSON)
//Author : Hyunyi Kim
function getUserInfo(data){
    window.userData = data;
    window.settings = JSON.parse(data.settings);
    return data;
}

//Function name  : getFriends
//Description : get the list of friends of the user
//input : user id
//output : list of friends(JSON)
//Author : Hyunyi Kim
function getFriends(userId,callback){
    socket.emit('checkFriends', userId);

    socket.on('checkFriendsResult',function(data){
        callback(data);
    });
}

//Function name  : changeNickname
//Description : change the nickname of the user
//input : JSON data (user id and nickname that the user inputs)
//output : check whether success is true or not
//Author : Hyunyi Kim
function changeNickname(inUserData,callback){
    socket.emit('changeNickname',JSON.stringify(inUserData));

    socket.on('changeNicknameResult',function(data){
        callback(data);
    });
}

//Function name  : changePassword
//Description : change the password of the user
//input : JSON data (user id and password that the user inputs)
//output : check whether success is true or not
//Author : Hyunyi Kim
function changePassword(inUserData,callback){
    socket.emit('changePassword',JSON.stringify(inUserData));

    socket.on('changePasswordResult',function(data){
        callback(data);
    });
}


//Function name  : updatePhoto
//Description : change user's photo
//input : image_url
//output : check whether success is true or not
//Author : Hyunyi Kim
function updatePhoto(inUserData, callback){
    console.log(inUserData);
    socket.emit('updatePhoto', inUserData);

    socket.on('updatePhotoResult',function(data){
        callback(data);
    });
}

//Function name  : updateSettings
//Description : save user's settings
//input : JSON
//output : check whether success is true or not
//Author : Hyunyi Kim
function updateSettings(memID, inUserData, callback){
    socket.emit('updateSettings', memID, inUserData);

    socket.on('updateSettingsResult',function(data){
        callback(data);
    });
}

//Function name  : joinRoom
//Description : enter the selected chatting room
//input : memId and room_name
//output : success message
//Author : Hyunyi Kim
function joinRoom(memID, room, callback){
    socket.emit('joinRoom',memID, room);

    socket.on('joinRoomResult',function(data){
      if(typeof(callback) != 'undefined')
        callback(data);
    });
}

//Function name  : getChatRoom
//Description : get the list of chat Room
//input : user id
//output : list of chatRoom(JSON)
//Author : Hyunyi Kim
function getChatRoom(userId,callback){
    socket.emit('getChatRoom', userId);

    socket.on('getChatRoomResult',function(data){
        callback(data);
    });
}

function handleMessageProcess(message){
    console.log('====================================================');
    socket.emit('message', message);

}
