
// 모듈 Import
var express = require('express');
var app = express();
var mysql  = require('mysql');
var cors = require('cors');
var bodyParser = require('body-parser');
var ip = require("ip");

// bodyParser 설정
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({    
    extended: true
}));

app.use(cors());

// 데이터베이스 연결 설정 . 이부분 user와 password확인
var connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : '1234',
    database : 'qr'
});

// 서버 설정
app.listen(8000, function() {
    console.log('server on', ip.address());
});

// 데이트베이스 연결
app.connect(function(err){
  if(err){
    console.error('error connecting'+err.stack);
    return;
  }
  connection.end();
});

const time = function(qrcode) {
  setTimeout(() => {
    SQL = "SELECT permit FROM seat WHERE qr = '" + qrcode +"';";
    connection.query(SQL, (err, results, fields) => {
      if (err) throw err;
      const json2 = JSON.parse(JSON.stringify(results));
  
      if(json2[0] === "1") {
        SQL = "UPDATE seat SET permit = '0' WHERE qr = '" + req.params.num + "';";
        console.log(SQL);
        connection.query(SQL, function(error, results, fields) {
          if (error) throw error;
          console.log("시간 초과");
        });
      }
    })
  }, 3000);
}

// [POST]  회원가입
app.post('/join', function(req, res){
  let id = req.body.id;
  let pw = req.body.pw;
  let name = req.body.name;

  let SQL1 = "SELECT id FROM user WHERE id = '" + id + "';";
  let SQL2 = "INSERT INTO user(id, pw, name) VALUE ('" + id + "','" + pw + "','" + name + "')";
  console.log(SQL1);
  connection.query(SQL1, function(error, result, fields) {
    if (error) throw error;
    const json = JSON.parse(JSON.stringify(result));
	if (json[0] != null)
	{
		if(json[0].id == id) // 중복되는 아이디가 존재할 경우
		{
		  res.send("이미 존재하는 아이디");
		  return;		
		}
	}
	connection.query(SQL2, function(error, result, fields) {
      if (error) throw error;
	  res.send("회원가입 성공");
    })
    return;
  })
});

// [POST] 로그인
app.post('/login', function(req, res){
  let id = req.body.id;
  let pw = req.body.pw;
  console.log("로그인");

  let SQL = "SELECT pw, qr FROM user WHERE id = '" + id + "';";
  console.log(SQL);
  connection.query(SQL, function(error, results, fields) {
    if (error) throw error;
    const json = JSON.parse(JSON.stringify(results));
    let result = {};
	try {
		if(json[0].pw == pw) // 로그인에 성공했을 경우
		{
		  result = {
			status: 200,
			qr: json[0].qr
		  };
		}
		else // 실패할 경우
		{
		  result = {
			status: 401,
		  };
		}
	} catch (e) {
		result = {
			status: 401,
		  };
	}
    res.send(result);
  })
});

// [GET] 자리 상태 받아오기
app.get('/seat/:num', function(req, res) {
  const SQL = "SELECT permit FROM seat WHERE qr ='" + req.params.num + "';";
  console.log(SQL);
  connection.query(SQL, function(error, results, fields) {
    if (error) throw error;
    const json = JSON.parse(JSON.stringify(results));
    res.send(json[0].permit);
  });
});

// [GET] 자리 일어서기
app.get('/stand/:num', function(req, res) {
  SQL = "UPDATE seat SET permit = '0' WHERE qr = '" + req.params.num + "';";
  console.log(SQL);
  connection.query(SQL, function(error, results, fields) {
    if (error) throw error;
    res.send("성공");
  });
});

// [POST] 자리 앉기 요청
app.post('/seat/:qr', function(req, res) {
  let id = req.body.id;
  const qr = req.params.qr;

  if (!id || !qr) {
    const result = {
      status: 403,
      message: "양식 오류",
    };

    res.json(result);
    return;
  }

  console.log("qr 앉기 요청");
  let result = {};
  let SQL = "SELECT permit, qr FROM seat WHERE qr = '" + qr + "';";
  console.log(SQL);
  connection.query(SQL, function(error, results, fields) {
    if (error) throw error;
    const json = JSON.parse(JSON.stringify(results));

	if (json[0] == null) {
	  result = {
        status: 404,
        message: '존재하지 않은 자리'
      };

      res.send(result);
	  return;
	}
	
    if(json[0].permit === "1") // 자리 상태값이 1일 경우
    {
      result = {
        status: 401,
        message: '누군가 앉아있음, 값이 1임'
      };

      res.send(result);
    }
    else if(json[0].permit === "0") // 0일 경우
    {
      if(error) throw error;
      const qrcode = json[0].qr;
      let SQL = "SELECT qr FROM user WHERE id = '" + id + "';";
      connection.query(SQL, function(error, results, fields) {
        const json = JSON.parse(JSON.stringify(results));
        if(json[0].qr === qrcode) // 권한 확인
        {
          SQL = "UPDATE seat SET permit = '1' WHERE qr = '" + qrcode + "';";
          connection.query(SQL, function(error, results, fields) {
            if (error) throw error;
            result = {
              status: 200,
              message: '성공'
            };

            time(qrcode);

            res.send(result);
          })
        }
        else {
          result = {
            status: 402,
            message: '권한이 없습니다.',
          };
          res.json(result);
          return;
        }
      })
    }
  });

  
});