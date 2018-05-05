
var dest = $.net.http.readDestination("Solicitudes.destination","colsubsidio");

var client = new $.net.http.Client();
var req = new $.web.WebRequest($.net.http.GET, "Validar_usuarioSet('80926574')?$format=json");
client.request(req, dest);

// var response = client.getResponse().body.asString();
// $.response.setBody(response); 

var response = client.getResponse();
var oData = JSON.parse(response.body.asString());
$.response.contentType = "application/json";
$.response.setBody(JSON.stringify( oData.d ) );
$.response.status = $.net.http.OK; 