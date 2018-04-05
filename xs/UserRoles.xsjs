function getUsername(){
   var username =  $.session.getUsername();
   return username;
}
//var result = "User " + getUsername();
var result = getUsername();
$.response.setBody(result);
