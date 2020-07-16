var express=require("express");
var app=express();
var bodyParser=require('body-parser');
var connection = require('./config');
var session = require('express-session');
var path = require('path');
var events=["football","volleyball","cricket","basketball"];
var authenticateController=require('./controller/authenticate_controller.js');
var registerController=require('./controller/register_controller.js');

app.set('view engine','ejs');
app.use(express.static('public'));
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

// app.get("/login",(req,res)=>{
//         res.render("signup.ejs");
// });
app.get('/login', function(request, response) {
	response.sendFile(path.join(__dirname + '/views/signup.html'));
});

app.post('/login', function(request, response) {
	var email = request.body.email;
	var password = request.body.password;
	if (email && password) {
		connection.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.ids=results[0].id;
                request.session.name=results[0].name;
                request.session.region=results[0].region;
                console.log(request.session.name);
				console.log(request.session.region);
				console.log(request.session.ids);
				console.log(results);
				
				response.redirect("/home");
			} else {
				response.send('Incorrect Username and/or Password!');
			}			
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

app.post('/register',registerController.register);

app.get("/home",(req,res)=>{
	if(req.session.loggedin){
		connection.query('SELECT * FROM events,all_sports where events.event=all_sports.name and place=?',[req.session.region], function(error, results, fields) {
			if(error){
				console.log(error);
				res.send("error has occured");
			}else {
				console.log(results);
				//console.log(results[0].name);
				//console.log(results[3].pic);
				res.render("image",{results:results});
			}
		});
	}
	else res.sendFile(path.join(__dirname + '/views/signup.html'));
});

app.post("/home",(req,res)=>{
	var event=[[req.body.event_id,req.session.ids]]
	connection.query('INSERT INTO enrolment (eve_id,id) values ?',[event], function (error, results, fields) {
		if (error) {
			console.log(error);
			res.json({
				status:false,
				message:'there are some error with query'
			})
		}else{
			res.redirect("/home");
		}
		});
})

app.get("/addEvent",(req,res)=>{
	if(req.session.loggedin){
	connection.query('SELECT * FROM all_sports', function(error, results, fields) {
		if(error){
			console.log(error);
			res.send("error has occured");
		}else {
			//console.log(results);
			//console.log(results[0].name);
			//console.log(results[3].pic);
			res.render("addEvent",{results:results});
		}
	});
}else{
	res.sendFile(path.join(__dirname + '/views/signup.html'));
}
});

app.post("/addEvent",function(req,res){
	console.log(req.body.sport);
	//var today = new Date();
	connection.query('select * from all_sports where name=?',[req.body.sport], function (error, all_spo, fields) {
		if (error) {
			console.log(error);
		  res.json({
			  status:false,
			  message:'there are some error with query'
		  })
		}else{
			var idd=all_spo[0].id;
			var event=[[req.body.desc,req.body.datetime,req.session.ids,req.body.place,req.body.sport,idd]];
			//console.log(event);
			
			connection.query('INSERT INTO events (description,date,id,place,event,sport_id) values ?',[event], function (error, results, fields) {
			if (error) {
				console.log(error);
				res.json({
					status:false,
					message:'there are some error with query'
				})
			}else{
				res.redirect("/home");
			}
			});
		}
	  });
});

app.post("/info",(req,res)=>{
	connection.query('SELECT * FROM events,all_sports where events.event=all_sports.name and eve_id=?',[req.body.event_id], function(error, results, fields) {
		if(error){
			console.log(error);
			res.send("error has occured");
		}else {
			connection.query('select * from enrolment where id=? and eve_id=?',[req.session.ids,req.body.event_id],(error,enrol,fields)=>{
				//console.log(results[0].name);
				//console.log(results[3].pic);
				console.log(req.session.ids);
				console.log(req.body.event_id);
				console.log(enrol);
				if(enrol.length==0)
				{
					var enrol_button=true;
				}else{
					enrol_button=false;
				}
				//console.log(enrol_button);
				connection.query('select * from coments where eve_id=?',[req.body.event_id],(error,all_comments,field)=>{
					console.log(all_comments);
					res.render("moreinfo",{results:results,enrol_button:enrol_button,all_comments:all_comments});
				});
			});
		}
	});
});

app.post("/comment",(req,res)=>{
	var event=[[req.body.event_id,req.session.ids,req.body.comments,req.session.name]];
	connection.query('INSERT INTO coments (eve_id,id,statement,name) values ?',[event], function (error, results, fields) {
		if (error) {
			console.log(error);
			res.json({
				status:false,
				message:'there are some error with query'
			})
		}else{
			console.log(results);
			res.redirect("home");
		}
		});
});

app.get("/myevents",(req,res)=>{
	if(req.session.loggedin){
	connection.query('select * from events,all_sports where events.event=all_sports.name and events.id=?',[req.session.ids], function (error, results, fields) {
		if (error) {
			console.log(error);
			res.json({
				status:false,
				message:'there are some error with query'
			})
		}else{
			console.log(results);
			res.render("myevents",{results:results});
		}
		});
	}else{
		res.sendFile(path.join(__dirname + '/views/signup.html'));
	}
});

app.post("/myevents/:id/delete",(req,res)=>{
	
	connection.query('delete from enrolment where eve_id=? and id=?',[req.params.id,req.session.ids], function (error, results, fields) {
		if (error) {
			console.log(req.params.id);
			res.json({
				status:false,
				message:'there are some error with queryyyy'
			})
		}else{
			console.log("Events done");
			connection.query('delete from events where eve_id=?',[req.params.id], function (error, results, fields) {
				if (error) {
					console.log(error);
					res.json({
						status:false,
						message:'there are some error with queryyy'
					})
				}else{
					res.redirect("/myevents");
				}
				});
		}
		});
});

app.get("/enrol_events",(req,res)=>{
	if(req.session.loggedin){
	connection.query('select * from enrolment,events,all_sports where enrolment.eve_id=events.eve_id and all_sports.name=events.event and enrolment.id=?',[req.session.ids], function (error, results, fields) {
		if (error) {
			console.log(req.params.id);
			res.json({
				status:false,
				message:'there are some error with queryyyy'
			})
		}else{
			res.render("enrolledpage",{results:results});
		}
	});
}else{
	res.sendFile(path.join(__dirname + '/views/signup.html'));
}
});

app.post("/enrol_events",(req,res)=>{
	connection.query('delete from enrolment where eve_id=? and id=?',[req.body.event_id,req.session.ids], function (error, results, fields) {
		if (error) {
			console.log(req.params.id);
			res.json({
				status:false,
				message:'there are some error with queryyyy'
			})
		}else{
			res.redirect("/enrol_events");
		}
	});
});

	
app.get('/logout', function(req, res, next) {
	if (req.session.loggedin) {
	  // delete session object
	  req.session.destroy(function(err) {
		if(err) {
		  return next(err);
		} else {
		  return res.redirect('/login');
		}
	  });
	}else{
		res.sendFile(path.join(__dirname + '/views/signup.html'));
	}
  });

app.listen(3000,()=>{
    console.log("SERVER IS UP");
});