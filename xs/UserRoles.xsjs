function getUserName(){
   var username =  $.session.getUsername();
   return username;
}
function getUserRole(){
   var userrole =  "EMP";
   return userrole;
}

$.response.setBody(JSON.stringify(
                            		{
                            			"UserName" : getUserName(),
                            			"UserRole" : getUserRole()
                            		}
                                )
                   );
