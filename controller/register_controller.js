var connection = require('./../config');
var path = require('path');

module.exports.register=function(req,res){
    var today = new Date();
    var users={
        "name":req.body.name,
        "email":req.body.email,
        "password":req.body.password,
        "region":req.body.region
    }
    connection.query('INSERT INTO users SET ?',users, function (error, results, fields) {
      if (error) {
        res.json({
            status:false,
            message:'there are some error with query'
        })
      }else{
        res.sendFile(path.join(__dirname + './../views/signup.html'));
        
      }
    });
}