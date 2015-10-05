var socketio = require('socket.io');
var mysql = require('mysql'); //MySQL API 불러오기
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};
var chatList = new Array(); //송신 되는 메세지들을 저장하기 위한 변수
var tmp = new Array();  //DB에 저장하기 위해 메세지들을 저장하는 변수
var str = '';   //메세지들을 하나의 문자열 형태로 결합하여 저장하는 변수
var encryption = require('./encode_msg.js');
var crypto = require('crypto');

// 동기 처리를 위한 Step 라이브러리 사용
var Step = require('step');
var Async = require('async');

//MySQL 접속
var db = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'adjnj',
});

db.query('USE HUI');

//Socket.IO 서버를 시작하고  Socket.IO가 콘솔에 출력하는 로깅을 제한하며 유입되는 연결을 처리 -->

exports.listen = function(server) {
    io = socketio.listen(server);
    io.set('log level', 1);

    //연결 처리
    io.sockets.on('connection', function (socket) {
        console.log("socket connect success");
        // 멤버를 생성하기 전에 서버에서 유효한 요청인지 검사해야한다.
        // 멤버 생성
        createMember(socket);
        verifyMember(socket);
        //사용자 정보 불러오기
        getUserInfo(socket);

        // 채팅방 버튼 클릭 이벤트가 발생 하였을 때
        //handleRoomJoining(socket);
        createNewChatroom(socket);
        //readRoomList(socket);

        //로그인 성공시, 친구 목록을 불러옴
        getFriends(socket);
        // 새 친구 추가
        //addNewFriend(socket);
        addNewFriend2(socket);
        //닉네임 변경
        changeNickname(socket);
        //비밀번호 변경
        changePassword(socket);

        //프로필 사진 변경
        updatePhoto(socket);

        //설정 저장
        updateSettings(socket);

        //방 입장
        joinRoom(socket);

        //방목록 받아오기
        getChatRoom(socket);

        // 친구 초대
        inviteNewFriend(socket);

        //메세지 전송
        handleMessageProcess(socket);

        //  채팅방 이름 업데이트
        updateChatroomName(socket);

        //접속해제시 실행
        handleClientDisconnectionProcess(socket);

        /*
            로그인 - 로그인 된 아이디로 채팅방을 불러옴 -
         */
        //readRoomList();

        // guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed); //사용자 접속시 손님 닉네임 부여
        // joinRoom(socket, 'Lobby'); //사용자가 접속하면 대기실로 이동
        // handleMessageBroadcasting(socket, nickNames); //메세지 처리
        // handleNameChangeAttempts(socket, nickNames, namesUsed); //닉네임 변경 처리
        // handleRoomJoining(socket); //채팅방 생성이나 변경 처리

        // //이미 생성된 채팅방 목록을 사용자에게 제공
        // socket.on('rooms', function() {
        //  socket.emit('rooms', io.sockets.manager.rooms);
        // });

        // //접속 끊었을 때의 처리
        // handleClientDisconnection(socket, nickNames, namesUsed);
    });
};

//사용자 닉네임 처리
function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
    var name = 'Guest' + guestNumber;
    nickNames[socket.id] = name; //닉네임을 클라이언트 연결 아이디와 연동
    socket.emit('nameResult', { //사용자에게 닉네임을 알려줌
        success: true,
        name: name
    });
    namesUsed.push(name); //생성된 닉네임을 사용 중 닉네임에 추가
    return guestNumber + 1;
}


////채팅방 입장 처리
//function joinRoom(socket, room) {
//    socket.join(room);
//    // 방의 아이디 생성
//    currentRoom[socket.id] = room; //사용자가 입장한 방의 정보를 저장
//
//    //이전에 주고받은 메세지 목록을 불러옴
//    var query = "SELECT chatList FROM `ChatList` where m_index = ? order by `test`.`chatTime` ASC";
//    db.query(
//            query,[100],
//            function(err,rows){
//                if(err) throw err;
//                else{
//                    var decodeRows = decodeMessage(rows);
//                    socket.emit('prevMessage',{rows : decodeRows});
//                }
//            }
//    );//db query end
//
//    db.query(query,function(err,results){
//        if(err)
//        {
//            throw err;
//        }
//        else
//        {
//            /* DB에서 불러온 채팅 목록을 화면에 뿌려주도록 한다. --> 서버에서 스크립트를 보내서 뿌려줄것인지
//                아니면 데이터만 보내준 뒤에 클라이언트에서 처리할 것인지?
//            */
//
//        }
//    });
//
//    socket.emit('joinResult', {room: room}); //사용자에게 채팅방에 입장한 사실을 알림
//    socket.broadcast.to(room).emit('message', { //채팅방의 다른 사용자에게 새로운 사용자가 입장했음을 알림
//        text: nickNames[socket.id] + ' has joined ' + room + '.'
//    });
//
//    var usersInRoom = io.sockets.clients(room); //사용자가 참여한 방에 다른 사용자가 있는지 판단
//    if (usersInRoom.length > 1) { //다른 사용자가 있는 경우
//        var usersInRoomSummary = 'Users currently in ' + room + ': ';
//        for (var index in usersInRoom) {
//            var userSocketId = usersInRoom[index].id;
//            if (userSocketId != socket.id) {
//                if (index > 0) {
//                    usersInRoomSummary += ', ';
//                }
//                usersInRoomSummary += nickNames[userSocketId];
//            }
//        }
//        usersInRoomSummary += '.';
//        socket.emit('message', {text: usersInRoomSummary});
//    }
//}

//닉네임 변경 처리
function handleNameChangeAttempts(socket, nickNames, namesUsed) {
    socket.on('nameAttempt', function(name) {
        if (name.indexOf('Guest') == 0) {
            socket.emit('nameResult', {
                success: false,
                message: 'Names cannot begin with "Guest".'
            });
        } else {
            if (namesUsed.indexOf(name) == -1) { //등록되지 않은 닉네임이라면 등록
                var previousName = nickNames[socket.id];
                var previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete namesUsed[previousNameIndex]; //변경 전 닉네임은 삭제
                socket.emit('nameResult', {
                    success: true,
                    name: name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit('message', {
                    text: previousName + ' is now known as ' + name + '.'
                });
            } else {
                socket.emit('nameResult', { //이미 등록된 닉네임인 경우 클라이언트에 오류 전송
                    success: false,
                    message: 'That name is already in use.'
                });
            }
        }
    });
}

//메세지가 송신된 시각을 반환하는 함수
function sendedTime() {
    var now = new Date();
    return (now.toDateString()+ " " + now.getHours() + ':'
            + ((now.getMinutes() < 10) ? ("0" + now.getMinutes()): (now.getMinutes())));
}

//'시:분:초'형태로 반환
Date.prototype.getTime = function(){
    return ((this.getHours() < 10)?"0":"") + this.getHours() +":"
    + ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
}

// //메세지와 보낸 사람을 정해진 형태의 문자열로 만들어 배열(chatList)에 저장
// function messageFormat (msg, sender){
//     chatList.push('{"time":"'+sendedTime()+'","msg":'+encryption.encodeMessage(msg)+',"sender":"'+sender+'"}');
// }

//XSS공격 방지(ASCII문자를 동일한 의미의 HTML문자로 변경)
function escape(message){
    message = message.toString();
    var escaped = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return escaped;
}
// //메세지 처리
// function handleMessageBroadcasting(socket) {
//     socket.on('message', function (message) {
//         var escaped = escape(message.text);
//         //메세지(msg)를 {"time":"메세지 송신 시간","msg":"메세지 내용","sender":"보낸 사람"} 형태로 배열에 저장
//         messageFormat(escaped,nickNames[socket.id]);
//         //{"number":메세지 갯수,"message":[{msg},{msg},{msg},{msg},.....,{msg}]}형태의 문자열을 DB에 저장
//         if(chatList.length == 20){
//             tmp = chatList;
//             //배열의 원소들을 하나의 문자열로 결합
//             for (var i in tmp)
//                 str += tmp[i]+',';
//             str = str.substring(0,str.lastIndexOf(","));
//             //DB에 저장할 형태로 변경
//             var sentence = '{"number":'+tmp.length+',"message":'+'[' +str+']}';
//             //data1 : 가장 오래된 메세지의 송신 시각 , data2 : 문자열(메세지들)
//             db.query('INSERT INTO test ' +  'SET data1 = ?, data2 = ?',
//                     [new Date(JSON.parse(sentence).message[0].time).getTime(),sentence], function(err, result) {
//                 if (err) {
//                     console.log(err);
//                 } else {
//                     console.log('success > the number of data is 20');
//                     //변수 초기화
//                     tmp = new Array();
//                     chatList = new Array();
//                     str='';
//                 }
//             });
//         }

//         socket.broadcast.to(message.room).emit('message', {
//             text: nickNames[socket.id] + ': ' + message.text
//         });
//     });
// }

//채팅방 만들기 처리
function handleRoomJoining(socket) {
    socket.on('join', function(room) {
        socket.leave(currentRoom[socket.id]); //현재 있던 방에서 나옴
        joinRoom(socket, room.newRoom); //이미 만들어진 채팅방이나 새로운 채팅방을 만듦
    });
}

// //사용자의 접속 해제 처리
// function handleClientDisconnection(socket) {
//     socket.on('disconnect', function() {
//         //메세지 20개가 쌓이기 전-채팅방에 접속해 있던 사람이 접속해제를 할때, chatList에 저장되어 있는 메세지를 DB에 저장
//         if(chatList.length>0){
//             tmp = chatList;
//             for(var i in tmp)
//                 str += tmp[i]+',';
//             str = str.substring(0,str.lastIndexOf(","));
//             var sentence ='{"number":'+tmp.length+',"message":'+'[' +str+']}';
//             db.query('INSERT INTO test ' + 'SET data1 = ?, data2 = ?',
//                     [new Date(JSON.parse(sentence).message[0].time).getTime(),sentence], function(err, result) {
//                 if (err) {
//                     console.log(err);
//                 } else {
//                     console.log('success > the number of data is '+tmp.length);
//                     tmp = new Array();
//                     chatList=new Array();
//                     str='';

//                 }
//             });

//         }
//         var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
//         //사용자의 닉네임 삭제
//         delete namesUsed[nameIndex];
//         delete nickNames[socket.id];
//     });
// }

//File_Name : chat_server.js
//Function_Name : verifyMember
//Input_Data : socket
//Output_Data : {verify : true} or {verify : false}
//Description : 사용자가 로그인 폼에 입력한 정보가 올바른지 판단
function verifyMember(socket){

    socket.on('verifyMember',function(data,callback){
        var identification = JSON.parse(data);
        var encryptedPw = encryptPw(identification.memPW);
        db.query('SELECT count(*) exist, m_index FROM `MemberInfo` WHERE memID = ? and memPW = ?',
            [identification.memID,encryptedPw],function(err,rows){
                if(err)
                    console.log(err);
                else{
                    //console.log(rows[0].exist);
                    if(rows[0].exist == 1){
                        socket.emit('verifyMemberResult',{verify : true});
                        //콜백함수를 사용하여 결과를 전달할 경우
                        //callback({verify : true});
                    }else{
                        socket.emit('verifyMemberResult',{verify : false});
                        //콜백함수를 사용하여 결과를 전달할 경우
                        //callback({verify : false});
                    }
                }
            });
    });
}

function encryptPw(passwd){
    var md5hash;
    var sha512hash;
    var combine;
    var encrypted;
    md5hash= crypto.createHash('md5').update(passwd).digest('hex');
    sha512hash = crypto.createHash('sha512').update(passwd).digest('hex');
    combine = md5hash + 'cherryBlossomWind' + sha512hash;
    encrypted = crypto.createHash('sha256').update(combine).digest('hex');
    return encrypted
}

/*
 * 2015. 04. 03. 11:20
 * creator : Hanbyul Kang
 * Description : Create member information function
 * input : socket, member nickname, id, PW
 * output : success message
 */
function createMember(socket)
{
    console.log(" IN create memeber function");
    // Create Member가 발생하기를 기다린다.
    socket.on('createMember', function (data) {
        // 사용자 ID, 사용자 PW, 사용자 닉네임, 사용자 PHOTO URL, 개인 세팅 정보를 DB에 저장.
        // 들어온 데이터 JSON 형식으로 파싱
        var queryValue = JSON.parse(data);
        console.log(queryValue.personalSetting.toString());

        // 아이디가 존재하는지 체크해서 있으면 있다는 메시지 출력
        var queryResult = db.query('SELECT memID FROM MemberInfo WHERE memID = ?',[queryValue.memID],function(err,result){
            console.log(" select info : " + JSON.stringify(result));
            // 아이디가 존재하지 않으면
            if(JSON.stringify(result) == '[]')
            {
                // 실제로 Database에 insert한다.
                var encryptedPw = encryptPw(queryValue.memPW);
                db.query('INSERT INTO MemberInfo ' +
                        'SET memID = ?, memPW = ?, nickname = ?, photo = ?, personalSetting = ?',
                        [queryValue.memID,encryptedPw,queryValue.nickName,queryValue.photoURL, JSON.stringify(queryValue.personalSetting.toString())], function(err, result) {
                    //에러가 발생했을 경우
                    if (err) {
                        //실패 메시지를 클라이언트에게 출력
                        socket.emit('createMemberResult',"error");
                    } else {
                        console.log("DB Input Successed.");
                        // Friend List에 새로운 값을 Insert
                        addFriendList(queryValue.memID);
                        // 성공하면 성공했다는 메시지를 클라이언트에게 보내준다.
                        socket.emit('createMemberResult',"success");
                    }
                }); // insert db query end


            }
            //아이디가 존재하면
            else
            {
                console.log("now id existing");
                //이미 존재한다고 알림
                socket.emit('createMemberResult',"exist");
            }
        }); // select db query end
    });
}// create member end

/*
 * creator : Hanbyul Kang
 * Description : add friend list default value
 * input : memberID
 * output : success message
 */
function addFriendList(memID) {
    console.log("add new friend list for new member! : " + memID);
    // 회원가입을 한 사람의 friend list 기본 값 생성 함수 시작
    Async.waterfall([
        function (callback) {
            // memID를 통해서 m_index를 가져온다.
            var selectMindexFriendList = "SELECT m_index FROM MemberInfo WHERE memID = ?;";
            db.query(selectMindexFriendList,[memID],function (err,selectQueryResult) {
                if(err) {
                    console.log("select mindex in addfriendlist error");
                } else {
                    console.log("raw select m_index in addfriendlist data : " + selectQueryResult.m_index);
                    callback(null,selectQueryResult[0].m_index);
                }
            });
        },
        // friendlist에 기본값으로 insert함 / fList는 default 생성
        function (m_index,callback) {
            console.log("start insert query in addfriendlist after select query! : " + m_index);
            var insertNewFriendList = "INSERT INTO FriendList (m_index,memID) VALUES (?,?);";
            db.query(insertNewFriendList,[m_index,memID],function(err,queryResult){
               if(err) {
                   console.log("insert into friend list error! : " + err);
               } else {
                   console.log("insert into friend list success!");
               }
            });
        }
    ],
    function(err,results){
        console.log("add new friendlist async function end : " + results);
        console.log(arguments);
    });
}

/*
 * 2015. 04. 17. 10:11
 * creator : Hanbyul Kang
 * Description : Read Room List from Database
 * input : memID, r_index
 * output : chatMsgList
 */
function readChatContentList(socket) {
    console.log("IN read chat List");
    socket.on('readChatList', function (inputData) {
        // raw data
        var parsedData = JSON.parse(inputData);
        // parse memeber id to raw data
        var memID = parsedData.memID;
        var r_index = parsedData.r_index;
        // Exist ID check
        var checkQuery = "SELECT m_index FROM MemberInfo WHERE memID = ?;";
        db.query(checkQuery, [memID], function (err, checkResult) {
            // 아이디가 없을 경우에 에러 처리
            if (err) {
                // 에러처리 후 false 전송
                console.log(err);
                socket.emit('readChatList', JSON.stringify({ num: 0, memList: false }));
            } else {
                if (JSON.stringify(checkResult) == '[]') {
                    //아이디가 없으면 비정상적으로 들어온 경로 이므로 에러 호출.
                    console.log(checkResult);
                    socket.emit('readChatList', JSON.stringify({ num: 0, memList: false }));
                } else {
                    console.log("read chat content List check id result : " + checkResult);
                    var m_index = checkResult;
                    // 채팅 목록 불러오기
                    var readQuery = "SELECT chatMsgList FROM ChatContentList WHERE r_index = ?;";
                    db.query(readQuery, [r_index], function (err, readResult) {
                        if (err) {
                            //에러처리
                            console.log(err);
                            socket.emit('readChatList', JSON.stringify({ num: 0, memList: false }));
                        } else {
                            console.log("readResult " + readResult);
                            //불러온 결과를 JSON 형태의 문자열로 해서 클라이언트에 전송
                            socket.emit('readChatList', JSON.parse(readResult[0].chatMsgList));
                        }
                    }); //db query end
                } //  read chat list else end
            }// id check else end
        }); //check id query end
    });
}//read Room List function end

// Function name : createNewChatrooom
// Descritpion : send result that success or fail message.
// Input : JSON data (userID, roomName, createdTime)
// Output : result message ( true or false )
// Author : Hanbyul Kang
function createNewChatroom(socket) {
    console.log(" IN create new chat room");
    socket.on('sendForCreateRoom', function (inputData) {
        // parse raw data ( uesrUID / roomnName)
        var parsedData = JSON.parse(inputData);
        // Setting data.
        var inUserUID = parsedData.userUID;
        var roomName = encodeURI(parsedData.roomName);
        //var createdTime = parsedData.createdTime;
        var memberIndex;
        // 채팅방 생성 시작
        Async.waterfall([
            // memID를 가져온다.
            function (callback) {
                // m_inde가져오기
                var findIndexQuery = "SELECT m_index FROM MemberInfo WHERE memID = ?;";
                db.query(findIndexQuery, [inUserUID], function (err, queryResult) {
                    if (err) {
                        // 에러 처리 및 false 반환
                        console.log("select member index error : " + err);
                        var falseJsonResult = JSON.stringify({ resultRoomName: roomName, boolResult: 'false', r_index: 'error' });
                        // error emit to client, roomName and bool form error result
                        socket.emit('sendForCreateRoomResult', falseJsonResult);
                    } else {
                        console.log("select m_index query result : " + queryResult);
                        memberIndex = queryResult[0].m_index;
                        callback(null, memberIndex);
                    }
                }); // find query end
            },
            // ChatList에 새로운 값을 입력한다.
            function (data, callback) {
                // ChatList joinedMember에 자기 자신을 집어넣기 위하여 JSON 형태로 만든다.
                var insertJoinMem = JSON.stringify({ memNum: 1, memList: [memberIndex] });
                console.log("insert join mem : " + insertJoinMem);
                // ChatList  r_index is auto increment
                var dbquery = "INSERT INTO ChatList SET roomName = ?, joinedMember = ?";
                db.query(dbquery, [roomName, insertJoinMem], function (err, queryResult) {
                    if (err) {
                        // error
                        console.log("insert into chat list error : " + err);
                        // error result
                        var falseJsonResult = JSON.stringify({ resultRoomName: roomName, boolResult: 'false', r_index: 'error' });
                        // error emit to client, roomName and bool form error result
                        socket.emit('sendForCreateRoomResult', falseJsonResult);
                    } else {
                        console.log("insert query result : " + queryResult);
                        callback(null, roomName);
                    }
                });// db query end
            },
            // roomName을 가지고 r_index를 가져온다.
            function (data, callback) {
                // 방 인덱스 선택
                var selectRindexQuery = "SELECT r_index FROM ChatList WHERE roomName = ?;";
                var r_index;
                db.query(selectRindexQuery, [roomName], function (err, selectRindexQueryResult) {
                    if (err) {
                        // 에러 처리 및 false 반환
                        console.log("select r index query error : " + err);
                        var falseJsonResult = JSON.stringify({ resultRoomName: roomName, boolResult: 'false', r_index: 'error' });
                        // error emit to client, roomName and bool form error result
                        socket.emit('sendForCreateRoomResult', falseJsonResult);
                    } else {
                        r_index = selectRindexQueryResult[0].r_index;
                        console.log("r_index : " + r_index);
                        callback(null, r_index);
                    }
                });
            },
            // memberInfo 테이블에 있는 r_indexList를 수정하기 위해 가져온다.
            function (r_index, callback) {
                console.log("memberinfotable r_index : " + r_index + " / memberindex : " + memberIndex);
                // MemberInfo테이블에 있는 rIndexList를 불러온다.
                var selectList = "SELECT r_IndexList FROM MemberInfo WHERE m_index =?";
                db.query(selectList, [memberIndex], function (err, queryResult) {
                    if (err) {
                        // 에러처리
                        console.log("select r_indexList from memberinfo error : " + err);
                        var falseJsonResult = JSON.stringify({ resultRoomName: roomName, boolResult: 'false', r_index: 'error' });
                        // error emit to client, roomName and bool form error result
                        socket.emit('sendForCreateRoomResult', falseJsonResult);
                    } else {
                        // queryResult 안에 있는 r_indexList를 꺼냄
                        var r_indexList = JSON.parse(queryResult[0].r_IndexList);
                        console.log("memberinfotable r_index query result : " + r_indexList.num);
                        callback(null, r_indexList, r_index);
                    }
                });
            },
            // rIndexList를 새로 만들어서 update한다.
            function (query, r_index, callback) {
                console.log("query : " + query + "/ r_index : " + r_index);
                // r_indexList에 있는 num / rIndexList 값 얻기
                var num = query.num;
                var rIndexList = query.rIndexList;
                // num값 업데이트 및 r_index를 rIndexList에 push
                num += 1;
                rIndexList.push(r_index);
                // JSON 형태로 변환
                var updatedList = JSON.stringify({ num: num, rIndexList: rIndexList });
                console.log("Updated rIndexList : " + updatedList);
                // Update
                var updateQuery = "UPDATE MemberInfo SET r_IndexList =? WHERE m_index = ?;";
                db.query(updateQuery, [updatedList, memberIndex], function (err, queryResult) {
                    if (err) {
                        // 에러처리 및 false 반환
                        console.log("Update memberinfo r_indexList error : " + err);
                        var falseJsonResult = JSON.stringify({ resultRoomName: roomName, boolResult: 'false', r_index: 'error' });
                        // error emit to client, roomName and bool form error result
                        socket.emit('sendForCreateRoomResult', falseJsonResult);
                    } else {
                        // update query 결과 및 r_index
                        console.log("query result : " + queryResult + " / r_index : " + r_index);
                        callback(null, r_index);
                    }
                });
            }
        ], function (err, result) {
            // Send to success message.
            var trueJsonResult = JSON.stringify({ resultRoomName: roomName, boolResult: 'true', r_index: result });
            // success emit to client, roomName and bool form success result
            console.log("trueJsonResult : " + trueJsonResult);
            socket.emit('sendForCreateRoomResult', trueJsonResult);
        });

    }); // socket on sendforcrateroom end
}
// Function name : updateChatroomName
// Descritpion : 대화방 이름 변경
// Input : r_index / new Room Name
// Output :
// Author : Hanbyul Kang
function updateChatroomName(socket) {
    console.log("IN update chat room name");
    socket.on('updateChatroomName', function (inputData) {
        var parsedData = JSON.parse(inputData);
        var r_index = parsedData.r_index;       //기존의 r_index
        var newName = parsedData.newName;       //새로 바꿀 room Name
        console.log("update chat room rindex : " + r_index + "/ newname : " + newName);

        // 기존의 roomName에서 업데이트
        var updateNameQuery = "UPDATE ChatList SET roomName = ? WHERE r_index = ?;";
        db.query(updateNameQuery, [newName, r_index], function (err, updateNameResult) {
            if (err) {
                console.log("Update chatroom name error : " + err);
                socket.emit('updateChatroomNameFront', JSON.stringify({ roomName: "error", result: false }));
            } else {
                console.log("Update chatroom name result : " + updateNameResult);
                socket.emit('updateChatroomNameFront', JSON.stringify({ roomName: newName, result: true }));
            }
        });
    });
}
// Function name : inviteNewFriend
// Descritpion : We invite new friends to chat rooms.
// Input : JSON data (friend List / memID / r_index)
// Output : result message ( true or false )
// Author : Hanbyul Kang
function inviteNewFriend(socket) {
    console.log("IN invite new friend");
    socket.on('inviteNewFriend', function (newFriendData) {
        var parsedRawData = JSON.parse(newFriendData);
        // 사용자 memID
        var inMemID = parsedRawData.memID;
        // 친구 이름
        var friendName = parsedRawData.friendName;
        // 해당하는 r_index
        var r_index = parsedRawData.r_index;
        console.log("inMemID : " + inMemID + "/ friendName : " + friendName + " / r_index :  " + r_index);
        // 친구의 index
        var m_index;

        Async.waterfall([
            // inviteNewFriend와 연동되는 함수
            function getFriendIndex(callback) {
                console.log("friend ID : " + friendName + "/ myID " + inMemID);
                // 친구의 m_index를 불러온다.
                var callMindexQuery = "SELECT m_index FROM MemberInfo WHERE memID = ?;";
                db.query(callMindexQuery, [friendName], function (err, callMindexResult) {
                    if (err != null) {
                        console.log("call m_index query error : " + err);
                        return false;
                    } else {
                        console.log("call mindex result  :" + callMindexResult[0].m_index);
                        // 아이디 체크
                        // 아이디가 아예 없는지 / 아이디가 자기 자신인지
                        if (callMindexResult.length == 0) {
                            // 아이디가 없으면 에러
                            console.log("call mindex error");
                            return false;
                        } else {
                            // 아이디가 있으면 해당 m_index 리턴
                            console.log("call mindex success");
                            m_index = callMindexResult[0].m_index;
                            callback(null,callMindexResult[0].m_index);
                        }
                    }
                });
            },
            function (f_m_index,callback) {
                // r_index로 방의 joinedMember를 불러온다.
                var CheckQuery = "SELECT joinedMember FROM ChatList WHERE r_index = ?;";
                db.query(CheckQuery, [r_index], function (err, queryResult) {
                    if (err) {
                        console.log("invite new friend check id query error : " + err);
                        socket.emit('inviteNewFriend', false);
                    } else {
                        console.log("Select joinedMember for invite friends query result : " + queryResult[0].joinedMember);
                        var joinedMember = JSON.parse(queryResult[0].joinedMember);
                        var existMemNum = joinedMember.memNum;     // 현재 joinedMember의 친구 수
                        var existMemList = joinedMember.memList;    // 현재 memList
                        console.log("memnum : " + existMemNum + " / existMemList : " + existMemList);
                        // 친구 이름을 통해 친구의 m_index를 얻어온다.
                        //var friendIndex = getFriendIndex(friendName, inMemID);
                        //console.log("get friendindex result : " + friendIndex);

                        // update data
                        existMemNum += 1;
                        joinedMember.memList.push(f_m_index);

                        // 데이터를 다시 직렬화 한다.
                        joinedMember = JSON.stringify({ memNum: existMemNum, memList: existMemList });
                        console.log("To JSON Joined Member : " + joinedMember);
                        callback(null,joinedMember);
                    }
                });
            },
            function (joinedMember,callback) {
                //실제 업데이트
                var updateDbQuery = "UPDATE ChatList SET joinedMember = ? WHERE r_index = ?;";
                db.query(updateDbQuery, [joinedMember, r_index], function (inErr, updateQuery) {
                    if (inErr) {
                        console.log(inErr);
                        socket.emit('inviteNewFriend', false);
                    } else {
                        callback(null, "trash");
                    }
                });
            },
            // 친구의 r_indexList도 수정해준다.
            function (trash, callback) {
                console.log("trash");
                // MemberInfo테이블에 있는 rIndexList를 불러온다.
                var selectList = "SELECT r_indexList FROM MemberInfo WHERE m_index =?;";
                db.query(selectList, [m_index], function (err, queryResult) {
                    if (err) {
                        // 에러처리
                        console.log("select r_indexList from memberinfo error : " + err);
                        // error emit to client, roomName and bool form error result
                        socket.emit('inviteNewFriend', false);
                    } else {
                        console.log("memberinfotable r_index query result : " + queryResult[0].r_indexList);
                        // queryResult 안에 있는 r_indexList를 꺼냄
                        var r_indexList = JSON.parse(queryResult[0].r_indexList);
                        callback(null, r_indexList);
                    }
                });
            },
            function (r_indexList, callback) {
                // pop을 하기 전의 r_indexList
                console.log("Before pop r_indexList : " + r_indexList.rIndexList);
                // m_index로 r_indexList에서 r_index를 삭제한다.
                r_indexList.rIndexList.push(r_index);
                // push을 하고 난 후의 r_indexList
                console.log("After pop r_indexList : " + r_indexList.rIndexList);

                r_indexList.num += 1;

                console.log("final list : " + r_indexList.num + "/ rrr : " + r_indexList.rIndexList);
                // MemberInfo 테이블의 r_indexList 업데이트
                var tempString = JSON.stringify(r_indexList);
                // 업데이트 쿼리
                var updateIndexQuery = "UPDATE MemberInfo SET r_indexList = ? WHERE m_index = ?;";
                db.query(updateIndexQuery, [tempString, m_index], function (err, updateIndexResult) {
                    if (err) {
                        // 에러 처리 후 false 전달
                        console.log("update r_indexList query error : " + err);
                        socket.emit('inviteNewFriend', false);
                    } else {
                        // 업데이트 결과 출력
                        console.log("update r_indexList query result : " + updateIndexResult);
                        // 다음 함수로 m_index 전달
                        callback(null, true);
                    }
                });
            }
        ],
        function (err, result) {
            if (result == true) {
                // 성공시 true 리턴
                socket.emit('inviteNewFriend', true);
            }
        });
    });
}


// Function name : getOutRoom
// Description : 채팅방에서 나갈 때 쓰는 함수
// Input : JSON 형태의 memID / room index
// Output : 결과 메시지 ( true / false )
function getOutRoom(socket) {
    socket.on('getOutRoom', function (data, callback) {
        // memID 와 Room Name을 받아온다.
        var userData = JSON.parse(data);
        var memID = userData.memID;     // 멤버 아이디
        var rindex = userData.r_index;  // room 인덱스

        // 동기 처리 시작
        Async.waterfall([
            // memID로 m_index를 가져온다.
            function (callback) {
                // select 쿼리문
                var selectInfoquery = "SELECT m_index, joinedMember FROM MemberInfo WHERE memID = ?";
                db.query(selectInfoquery, [memID], function (err, selectInforesult) {
                    if (err) {
                        // 에러 처리 후 false 전달
                        console.log("select info query error : " + err);
                        socket.emit('getOutRoomFront', false);
                    } else {
                        // 결과값 handling
                        console.log("select info query : " + selectInforesult);
                        // 다음 함수로 r_indexList 및 m_index 전달
                        callback(null, selectInforesult[0].r_indexList, selectInforesult[0].m_index);
                    }
                });
            },
            // MemberInfo 테이블 안의 r_indexList를 업데이트 한다. => 삭제
            function (r_indexList, m_index, callback) {
                // pop을 하기 전의 r_indexList
                console.log("Before pop r_indexList : " + rIndexList.rIndexList);
                // m_index로 r_indexList에서 r_index를 삭제한다.
                r_indexList.rIndexList.pop(rindex);
                // pop을 하고 난 후의 r_indexList
                console.log("After pop r_indexList : " + rIndexList.rIndexList);
                // MemberInfo 테이블의 r_indexList 업데이트
                // 업데이트 쿼리
                var updateIndexQuery = "UPDATE MemberInfo SET r_indexList =? WHERE m_index = ?;";
                db.query(updateIndexQuery, [r_indexList, m_index], function (err, updateIndexResult) {
                    if (err) {
                        // 에러 처리 후 false 전달
                        console.log("update r_indexList query error : " + err);
                        socket.emit('getOutRoomFront', false);
                    } else {
                        // 업데이트 결과 출력
                        console.log("update r_indexList query result : " + updateIndexResult);
                        // 다음 함수로 m_index 전달
                        callback(null, m_index);
                    }
                });
            },
            // r_index로 알아온 joinedMember에 m_index가 있는지 확인한다.
            function (m_index,callback) {
                // select 쿼리문
                var selectMemQuery = "SELECT joinedMember FROM ChatList WHERE r_index = ?";
                db.query(selectMemQuery, [rindex], function (err, selectMemResult) {
                    if (err) {
                        // 에러 처리 후 false 전달
                        console.log("select joinedmember query error : " + err);
                        socket.emit('getOutRoomFront', false);
                    } else {
                        var inResult = false;
                        // 결과 안에 해당하는 m_index 값이 있는지 확인
                        console.log("select joinedmember query result : " + selectMemResult);
                        for (var i = 0; i < selectMemResult[0].memList.length; i++) {
                            // m_index값이 있으면
                            if (selectMemResult[0].memList[i] == m_index) {
                                // 다음 함수에 삭제 메시지 전달하기 위해 변수 변경
                                inResult = true;
                            }
                            // 없으면
                            else {
                                // 에러 메시지 호출 후 종료.
                                socket.emit('getOutRoomFront', false);
                            }
                        }
                        // 다음 함수로 확인 결과 및 m_index, joinedMember 전달
                        callback(null,inResult,m_index,joinedMember);
                    }
                });
            },
            // 확인이 되었으면 삭제한다.
            function (identifyResult, m_index, joinedMember, callback) {
                // joinedMember에 ID가 있을 경우 아이디를 삭제
                if (identifyResult == true) {
                    // 삭제의 방법은 joinedMember에서 해당 m_index에 해당하는 값만 pop시킨다.
                    joinedMember.memList.pop(m_index);
                    // Update 쿼리
                    var updateMemQuery = "UPDATE ChatList SET joinedMember = ? WHERE r_index = ?";
                    db.query(updateMemQuery, [joinedMember, rindex], function (err, updateMemResult) {
                        if (err) {
                            // 에러 메시지 출력 후 종료.
                            console.log("update joinedmember query error : " + err);
                            socket.emit('getOutRoomFront', false);
                        } else {
                            // 업데이트 결과 출력
                            console.log("update joinedmember query result : " + updateMemResult);
                            // 마지막 함수에 true를 전달
                            callback(null, true);
                        }
                    });
                }
                // 아이디가 없을 경우 에러 처리
                else {
                    socket.emit('getOutRoomFront', false);
                }
            }
        ],
        function (err, result) {
            if (result == true) {
                socket.emit('getOutRoomFront', true);
            } else {
                socket.emit('getOutRoomFront', false);
            }
        });
    });
}
// Function name : addNewFriend2
// Descritpion : add New friend function
// Input : memberID, friends List
// Output : update success list
// Author : Hanbyul kang
function addNewFriend2(socket) {
    console.log("IN Add New Friend 2");
    socket.on('addNewFriend2', function (friendData) {
        console.log("IN Socket.on(addNewFriend)");
        // 들어온 데이터 파싱
        var parsedData = JSON.parse(friendData);
        // Debug용 콘솔
        console.log("IN ParsedData : " + parsedData);
        // 멤버 아이디
        var memID = parsedData.memID;
        // 추가하고자 하는 친구 이름
        var fName = parsedData.fList;
        // friendList 테이블 업데이트용 m_index
        var out_m_index;
        // frinedlist 테이블에서 number를 업데이트 하기 위한 변수
        var f_number;
        // Step 라이브러리를 사용해서 비동기 처리가 아닌 순서대로 처리
        Async.waterfall([
            // m_index를 MemberInfo 테이블에서 가져오기
            function (callback) {
                var checkIDQuery = "SELECT m_index FROM MemberInfo WHERE memID = ?;";

                db.query(checkIDQuery, [memID], function (err, queryResult) {
                    var tmpReturn = null;
                    if (err) {
                        // 에러처리를 어떻게 해야하는가?
                        console.log("select index error : " + err);
                        //return null;
                        socket.emit('addNewFriend2', 'false');
                        return;
                    } else {
                        // 성공한 m_index값을 다음 함수에 넘겨줌
                        tmpReturn = queryResult[0].m_index;
                        console.log("select index : " + queryResult[0].m_index);
                        // friendlist 테이블 업데이트용 m_index
                        out_m_index = queryResult[0].m_index;
                        console.log("");
                        // 다음 함수로 전달
                        callback(null, queryResult[0].m_index);
                    }
                });
            },
            // 아이디가 등록되어 있으면 fList를 m_index를 사용해 FriendList 테이블에서 가져온다.
            // 아이디가 등록되어 있지 않으면 FriendList에 m_index를 사용해 등록한다.
            function (m_index_result, callback) {
                console.log("next function m_index_result : " + m_index_result);
                // 아이디가 등록되어 있으면, null 은 예시
                console.log("if register m_index");
                var selectDbQuery = "SELECT fList FROM FriendList WHERE m_index = ?;";
                db.query(selectDbQuery, [m_index_result], function (inErr, queryResult) {
                    if (inErr) {
                        console.log("select flist from friendlist error : " + inErr);
                        //return null;
                        socket.emit('addNewFriend2', 'false');
                        return;
                    } else {
                        // 기존의 fList를 다음 함수에 넘겨준다.
                        console.log("select fList From FriendList : " + queryResult[0].fList);
                        var dd = queryResult[0].fList;
                        f_number = dd.number;
                        console.log("test0 : " + dd + "test1 : " + dd.number + " / test2 : " + dd.list);
                        //return queryResult;
                        callback(null, queryResult[0].fList);
                    }
                });
            },
            // fList를 기존에 있던 내용에서 새로운 내용으로 업데이트 한다.
            function (oldFriendList, callback) {
                // setting friend list to json
                console.log("old friend list : " + oldFriendList);
                var existFriendList = oldFriendList;

                console.log("friend name for add : " + fName + " / existFriendList : " + existFriendList);
                console.log("friendlist list : " + existFriendList.number);

                // 친구의 m_index를 불러온다.
                var callMindexQuery = "SELECT m_index FROM MemberInfo WHERE memID = ?;";
                db.query(callMindexQuery, [fName], function (err, callMindexResult) {
                    if (err) {
                        console.log("call m_index query error : " + err);
                        socket.emit('addNewFriend2', 'false');
                    } else {
                        // 아이디 체크
                        for (var i = 0; i < existFriendList.list.length; i++) {
                            // 아이디가 아예 없는 지 / 기존에 있는 아이디인지 / 자기 자신인지 체크
                            if (callMindexResult.length == 0 || existFriendList.list[i] == callMindexResult[0].m_index || callMindexResult[0].m_index == out_m_index) {
                                // 있으면 리턴 / 끝
                                socket.emit('addNewFriend2', 'false');
                            }
                            // 아니면 계속 진행
                        }

                        console.log("call friend m_index query : " + callMindexResult);
                        existFriendList.list.push(callMindexResult[0].m_index);
                        // number +1
                        f_number += 1;
                        existFriendList.number = f_number;
                        console.log("call friend number : " + existFriendList.number);
                        //console.log("exist friend list3 : " + existFriendList);
                        console.log("between new and old friend list : " + JSON.stringify(existFriendList));
                        //return newFriendList;
                        callback(null, JSON.stringify(existFriendList));
                    }
                });
            },
            //number update
            // fList를 FriendList 테이블에 업데이트 시킨다.
            function (newFriendList, callback) {
                console.log("final update db query data : " + newFriendList);
                console.log("newFriendList : " + newFriendList + "/ m_index :" + out_m_index);

                var updateDBQuery = "UPDATE FriendList SET fList = ? WHERE m_index = ? ;";
                db.query(updateDBQuery, [newFriendList, out_m_index], function (inErr, queryResult) {
                    if (inErr) {
                        console.log("update friendlist error : " + inErr);
                        socket.emit('addNewFriend2', 'false');
                        return;
                    } else {
                        console.log("update query result : " + JSON.stringify(queryResult));
                        callback(null, 'true');
                    }
                });
            }
            // 전체 순서 끝
        ],
        function (err, results) {
            console.log("final result : " + results);
            socket.emit('addNewFriend2', 'true');
        });
    });
}

// Function name : getUserInfo
// Descritpion : get information of the user
// Input : user id
// Output : information of the user
// Author : Hyunyi Kim
function getUserInfo(socket){
    socket.on('getUserInfo',function(data,callback){
        var userId = data;
        var query = "SELECT count(*) exist, memID id, nickname nickname, photo photo, personalSetting settings FROM `MemberInfo` WHERE memID = ?";
        db.query(query,[userId],function(err,row){
            if(err){
                throw err;
            }else{
                if(row[0].exist == 1){
                    socket.emit('getUserInfoResult',{userInfo : row});
                }else{
                    socket.emit('getUserInfoResult',{userInfo : 'none'});
                }
            }
        });
    });
}

//Function name : getFriends
//Descritpion : get list of friends of the user from DB
//Input : socket
//Output : list of friends
//Author : Hyunyi Kim
function getFriends(socket){
	  socket.on('checkFriends',function(data,callback){
	      var userId = data;
	      var query = "SELECT fList FROM `FriendList` WHERE memID = ?";
	      db.query(query,[userId],function(err,row){
	          if(err){
	              throw err;
	          }else{
	            var number = row[0].fList.number;
	            if(number >0){
	                return makeList(socket,row);
	            }else{
	                socket.emit('checkFriendsResult',{friendList : false});
	            }
	          }
	      });

	  });
	}

//Function name : makeList
//Descritpion : make sentence for multi column suq query. In query, This sentence will be used in the ~ part of "select .. from.. where .. in (~)".
//Input : socket, row(the returned data of function,getFriends)
//Output : the sentence merging m_index of user's friends
//Author : Hyunyi Kim
function makeList(socket,row){
    var list="";
    var data = JSON.parse(row[0].fList)
    for(var i=0; i<data.number;i++){
        list +=data.list[i];
        if(i!=data.number-1)
            list +=", ";
    }
    return offerFriendList(socket,list);
}

//Function name : offerFriendList
//Descritpion : retrun the information(m_index,memID,nickname,photo) of user's friends to the Front-side
//Input : socket, list(will be used in the query)
//Output : information of user's friends
//Author : Hyunyi Kim
function offerFriendList(socket,list){
    var query = "SELECT m_index,memID,nickname,photo FROM `MemberInfo` WHERE m_index in ("+list+")";
    db.query(query,function(err,row){
        if(err){
            throw err;
        }else{
                socket.emit('checkFriendsResult',{friendList : row});
        }
    });
}

//Function name  : changeNickname
//Description : change the nickname of the user
//input : user id and nickname that the user inputs
//output : JSON data ({success : true})
//Author : Hyunyi Kim
function changeNickname(socket){
    socket.on('changeNickname',function(data,callback){
        var userId = JSON.parse(data).memID;
        var input = JSON.parse(data).newNick;
        console.log(input);
        var query = "UPDATE `MemberInfo` SET `nickname`= ? WHERE `memID`=?";
        db.query(query,[input,userId],function(err){
            if(err){
                socket.emit('changeNicknameResult',{success : false});
                throw err;
            }else{
                socket.emit('changeNicknameResult',{success : true});
            }
        });
    });
}

//Function name  : checkPassword
//Description : check if user's input is as same as existing password
//input : user id and existing password that user inputs
//output : true or false
//Author : Hyunyi Kim
function checkPassword(data,callback){
    var userId = JSON.parse(data).memID;
        var existing = JSON.parse(data).existing;
        var existingPw = encryptPw(existing);
        /*code_compare existing password with user's input*/
        var compareQuery = "SELECT count(*) exist FROM `MemberInfo` WHERE memID = ? && ? = (SELECT memPW FROM `MemberInfo` WHERE memID = ?)";
        db.query(compareQuery,[userId,existingPw, userId],function(err,row){
            if(err){
                throw err;
            }else{
                if(row[0].exist == 1){
                    console.log(true);
                    callback(true);
                }else{
                    console.log(false);
                    callback(false);
                }
            }
        });
}

//Function name  : changePassword
//Description : change the password of the user
//input : user id and password that the user inputs
//output : JSON data ({success : true},{success : false})
//Author : Hyunyi Kim
function changePassword(socket){
    socket.on('changePassword',function(data){
        checkPassword(data,function(booldata){
            if(booldata == true){
                var userId = JSON.parse(data).memID;
                var input = JSON.parse(data).newPw;
                console.log(input);
                var newPasswd = encryptPw(input);
                var query = "UPDATE `MemberInfo` SET `memPW`= ? WHERE `memID`=?";
                db.query(query,[newPasswd,userId],function(err){
                    if(err){
                        console.log('true');
                        socket.emit('changePasswordResult',{success : false});
                    }else{
                        console.log('false');
                        socket.emit('changePasswordResult',{success : true});
                    }
                });
            }else{
                console.log('else false');
                socket.emit('changePasswordResult',{success : false});
            }
        });
    });
}

//Function name  : updatePhoto
//Description : change user's photo
//input : mem_idimage_url
//output : JSON data ({success : true})
//Author : Hyunyi Kim
function updatePhoto(socket){
    socket.on('updatePhoto',function(data){
        var userId = data.memID;
        var input = data.newURL;
        console.log(userId);
        console.log(input);
        var query = "UPDATE `MemberInfo` SET `photo`= ? WHERE `memID` = ?";
        db.query(query,[input,userId],function(err){
            console.log(query);
            if(err){
                console.log(false);
                socket.emit('updatePhotoResult',{success : false});
            }else{
                console.log(true);
                socket.emit('updatePhotoResult',{success : true});
            }
        });
    });
}

//Function name  : updateSettings
//Description : save user's settings
//input : settings and memId
//output : JSON data ({success : true})
//Author : Hyunyi Kim
function updateSettings(socket){
    socket.on('updateSettings',function(memID, settings){
        var userId = memID;
        var input = JSON.stringify(settings);

        var query = "UPDATE `MemberInfo` SET `personalSetting`= ? WHERE `memID` = ?";
        db.query(query,[input,userId],function(err){
            if(err){
                socket.emit('updateSettingsResult',{success : false});
            }else{
                socket.emit('updateSettingsResult',{success : true});
            }
        });
    });
}

//Function name  : joinRoom
//Description : enter the selected chatting room
//input : memID and room_name
//output :
//Author : Hyunyi Kim
function joinRoom(socket) {
socket.on('joinRoom',function(memID,r_index){
  var userId = memID;
  console.log('passed user_id : '+userId);
  var r_index = r_index;
  console.log('passed room_name : '+r_index);
  console.log('In joinRoom procedure');
  Async.waterfall([
      // function (callback) {
      //     console.log('1st function : Using room_name, find the r_index matched to the room_name');
      //     var query = "SELECT r_index FROM `ChatList` WHERE `roomName`= ?";
      //     db.query(query,[room_name],function(err,rows){
      //         if(err){
      //             console.log(':::happens error:::');
      //             socket.emit('joinRoomResult',{success : false});
      //         }else{
      //             console.log('1st :: receive return value from DB');
      //             console.log('received value(r_index) is : '+rows[0].r_index);
      //             //call_next_function
      //             callback(null,rows[0].r_index);
      //         }
      //     });
      // },
      function (callback){
        var pre_r_index = currentRoom[socket.id];
        var now_r_index = r_index;
        console.log('previous r_indes is '+pre_r_index);
        console.log('present selected r_indes is '+now_r_index);

            if(chatList.length > 0 && chatList[pre_r_index].length>0){
                tmp = chatList[pre_r_index];
                for(var i in tmp)
                    str += tmp[i]+',';
                str = str.substring(0,str.lastIndexOf(","));
                var sentence ='{"number":'+tmp.length+',"message":'+'[' +str+']}';
                db.query('INSERT INTO `ChatContentList`(`chatMsgList`, `r_index`) VALUES (?,?)',
                        [sentence, pre_r_index], function(err, result) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('success > the number of data is '+tmp.length);
                        tmp = new Array();
                        chatList=new Array();
                        str='';

                    }
                });

            }

        callback(null,true);
      },
      function(result,callback) {
          console.log('check if now the user enters any room');
          console.log(currentRoom[socket.id]);
          console.log(socket.id);
          if(currentRoom[socket.id] == null){
              console.log('the user not belog to any room');
              socket.join(r_index);
              console.log('in socket, complete to join the room');
              currentRoom[socket.id] = r_index;
              console.log('complete to register the r_index to the array,currentRoom');
              callback(null,true);
          }else{
            console.log('the user belog to which room so,first of all, need to leave current room');
              socket.leave(currentRoom[socket.id]);
              console.log('complete to leave current room');
              socket.join(r_index);
              console.log('after leave current room, complete to enter new room');
              currentRoom[socket.id] = r_index;
              console.log('complete to join new room');
              callback(null,true);
          }
      },
      function(result,callback){
          if(result){
              var query = "SELECT `r_index`,`roomName` FROM `ChatList` WHERE r_index = ?";
              db.query(query,[r_index],function(err,row){
                  if(err){
                      throw err;
                  }else{
                      console.log('I will print r_index, roomName');
                      console.log(row[0].r_index);
                      console.log(row[0].roomName);
                      callback(null,row);
                  }
              });
          }else{
              socket.emit('joinRoomResult',{success : false});
          }
      }
      ],
      function (err,results) {
        console.log("final result : " + results);
        console.log("I will print the participating users in this room : "+r_index);
        var usersInRoom = io.sockets.clients(r_index);
        console.log(io.sockets.clients(r_index));
        console.log(usersInRoom);
          if (usersInRoom.length >= 1) {
            var usersInRoomSummary = 'Users currently in ' + r_index + ': ';
            console.log(usersInRoomSummary);
            for (var index in usersInRoom) {
              var userSocketId = usersInRoom[index].id;
              console.log(userSocketId);

                if (index > 0) {
                  usersInRoomSummary += ', ';
                }
                usersInRoomSummary += userSocketId;

            }
            usersInRoomSummary += '.';
            console.log(usersInRoomSummary);
          }
            var query = "SELECT `chatMsgList` FROM `ChatContentList` WHERE `r_index` = ?";
          db.query(
            query,r_index,
            function(err,row){
                if(err) throw err;
                else{
                    decodeMessage(row,function(result){
                        var rows = result;
                    for(var i in rows){
                        var obj = JSON.parse(rows[i].chatMsgList);
                        console.log(obj.number);
                        for(var j =0; j<obj.number;j++){
                            console.log("\'" + obj.message[j].sender + "\'");
                            console.log("\"" + obj.message[j].msg + "\"");
                            console.log(obj.message[j].time);

                            prevMessage(socket,r_index,j,obj);
                        }
                    }
                    });

                    // decodeMessage(rows,function(decodeRows){
                    //     socket.broadcast.to(r_index).emit('prevMessage', decodeRows);
                    // });

                }
            }

    );
            socket.emit('joinRoomResult',{success : true, r_index : results[0].r_index, roomName : results[0].roomName});

  }
  );
});
}

function prevMessage(socket,r_index,j,obj){
    var photo = getPicture(socket,obj.message[j].sender,function(data){
        console.log('This is j '+ j);
        console.log('This is obj '+ JSON.stringify(obj));
        console.log('This is r_index '+ r_index);
        console.log('This is data '+ data);
        console.log(obj.message[j].sender);
        socket.emit('message', {
            sender : obj.message[j].sender, nick: obj.message[j].nick, text : obj.message[j].msg, r_index : r_index, pic : data, time : obj.message[j].time
        });
    });
}

function decodeMessage(rows,callback){
    for(var i in rows){

        var obj = JSON.parse(rows[i].chatMsgList);
        console.log('-----------------------');
        console.log(obj);
        console.log(obj.number);
        for(var j=0;j<obj.number;j++){
            var toJSON = JSON.stringify(obj.message[j].msg);
            obj.message[j].msg = encryption.decodeMessage(toJSON);
        }
        rows[i].chatMsgList = JSON.stringify(obj);
    }
    callback(rows);
}

//Function name : getChatRoom
//Descritpion : get list of chatroom stored in DB
//Input : socket
//Output : list of chatRoom
//Author : Hyunyi Kim
function getChatRoom(socket) {
    socket.on('getChatRoom', function (data, callback) {
        var userId = data;
        var query = "SELECT r_indexList FROM `MemberInfo` WHERE memID = ?";
        db.query(query, [userId], function (err, row) {
            if (err) {
                throw err;
            } else {
                var number = JSON.parse(row[0].r_indexList).num;
                console.log(number);
                if (number > 0) {
                    return makeChatList(socket, row);
                } else {
                    socket.emit('getChatRoomResult', { chatRoomList: false });
                }
                // var number = JSON.parse(row[0].fList).number;
                // console.log(JSON.parse(row[0].fList).number);
                // if(number >0){
                //     return makeList(socket,row);
                // }else{
                //     socket.emit('checkFriendsResult',{friendList : false});
                // }
            }
        });

    });
}


//Function name : makeChatList
//Descritpion : make sentence for multi column suq query. In query, This sentence will be used in the ~ part of "select .. from.. where .. in (~)".
//Input : socket, row(the returned data of function,getChatRoom)
//Output : the sentence merging m_index of user's chat room
//Author : Hyunyi Kim
function makeChatList(socket, row) {
    var list = "";
    var data = JSON.parse(row[0].r_indexList)
    for (var i = 0; i < data.num; i++) {
        list += data.rIndexList[i];
        if (i != data.num - 1)
            list += ", ";
    }
    return offerChatList(socket, list);
}

//Function name : offerChatList
//Descritpion : retrun the information(the name of chat room) of user's chat room to the Front-side
//Input : socket, list(will be used in the query)
//Output : information of user's chat room
//Author : Hyunyi Kim
function offerChatList(socket, list) {
    var query = "SELECT `r_index`,`roomName` FROM `ChatList` WHERE r_index in (" + list + ")";
    db.query(query, function (err, row) {
        if (err) {
            throw err;
        } else {
            socket.emit('getChatRoomResult', { chatRoomList: row });
        }
    });
}

//메세지와 보낸 사람을 정해진 형태의 문자열로 만들어 배열(chatList)에 저장
function messageFormat (msg, sender,nick,r_index){
    chatList[r_index].push('{"time":"'+sendedTime()+'","msg":'+encryption.encodeMessage(msg)+',"sender":"'+sender+'","nick":"' + nick + '"}');
}

//Function name  : handleMessageProcess
//Description : handle saving sended message and sending passed message
//input :{sender : 김현이, room: 21, text: "message"}
//output : {success : true}, {success : false}
//Author : Hyunyi Kim
function handleMessageProcess(socket) {
    socket.on('message', function (message) {
        var time = sendedTime();
        console.log('sendedTime is '+time);
        console.log('enter the message_process');
        console.log(message);
        console.log('In this time, r_index : '+message.room);
        if(typeof(chatList[message.room])=='undefined'){
            chatList[message.room]=new Array();
        }
        console.log('In this time, r_index : '+message.room);
        var escaped = escape(message.text);
        console.log(escaped);
        //메세지(msg)를 {"time":"메세지 송신 시간","msg":"메세지 내용","sender":"보낸 사람"} 형태로 배열에 저장
        messageFormat(escaped,message.sender,message.nick,message.room)
        console.log('In this time, r_index : '+message.room);
        console.log(chatList[message.room]);
        console.log(chatList[message.room].length);
        //{"number":메세지 갯수,"message":[{msg},{msg},{msg},{msg},.....,{msg}]}형태의 문자열을 DB에 저장
        if(chatList[message.room].length == 20){
            console.log('I gather the 20 data');
            console.log('In this time, r_index : '+message.room);
            tmp = chatList[message.room];
            //배열의 원소들을 하나의 문자열로 결합
            for (var i in tmp)
                str += tmp[i]+',';
            str = str.substring(0,str.lastIndexOf(","));
            //DB에 저장할 형태로 변경
            var sentence = '{"number":'+tmp.length+',"message":'+'[' +str+']}';
            //data1 : 가장 오래된 메세지의 송신 시각 , data2 : 문자열(메세지들)
             //------------------------------------------------------//
            console.log('In this time, r_index : '+message.room);
            db.query('INSERT INTO `ChatContentList`(`chatMsgList`, `r_index`) VALUES (?,?)',
                    [sentence, message.room], function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('success > the number of data is 20');
                    //변수 초기화
                    tmp = new Array();
                    chatList[message.room] = new Array();
                    str='';
                }
            });
        }

        var photo = getPicture(socket,message.sender,function(data){
            console.log(data);
            socket.broadcast.to(message.room).emit('message', {
                sender : message.sender, nick: message.nick, text : message.text, r_index : message.room, pic : data, time : time
            });
        });
    });
}

function sendMessage(socket,message,picture,time){
    console.log(message);
    console.log(picture);
    console.log(time);
    var query = "SELECT `nickname` FROM `MemberInfo` WHERE `memID` = ?";
    db.query(query,[message.sender],function(err, row){
        if(err)
            console.log(err);
        else{
            socket.broadcast.to(message.room).emit('message', {
                sender : message.sender, nick: message.nick, text : message.text, r_index : message.room, pic : picture, time : time
            });
        }
    });
}




function getPicture(socket,memID,callback){
    var query = "SELECT `photo` FROM `MemberInfo` WHERE `memID` = ?";
    db.query(query, [memID], function (err, row) {
        console.log(row);
        console.log(row[0]);
        console.log(row[0].photo);
        callback(row[0].photo);
    });
}

function handleClientDisconnectionProcess(socket) {
    socket.on('disconnect', function() {
        //메세지 20개가 쌓이기 전-채팅방에 접속해 있던 사람이 접속해제를 할때, chatList에 저장되어 있는 메세지를 DB에 저장
        var r_index = currentRoom[socket.id];
        console.log(r_index);
        if(typeof(r_index)=='undefined'){
            return;
        }

        if(chatList.length > 0 && typeof(chatList[r_index]) != 'undefined' && chatList[r_index].length>0){
            tmp = chatList[r_index];
            for(var i in tmp)
                str += tmp[i]+',';
            str = str.substring(0,str.lastIndexOf(","));
            var sentence ='{"number":'+tmp.length+',"message":'+'[' +str+']}';
            db.query('INSERT INTO `ChatContentList`(`chatMsgList`, `r_index`) VALUES (?,?)',
                    [sentence, r_index], function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('success > the number of data is '+tmp.length);
                    tmp = new Array();
                    chatList=new Array();
                    str='';

                }
            });

        }
    });
}

