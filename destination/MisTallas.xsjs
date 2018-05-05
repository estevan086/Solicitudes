// Obtiene Parametro (Cedula)
var pCedula = $.request.parameters.get('Cedula');
// Realiza Lectura del Destination
var dest = $.net.http.readDestination("Solicitudes.destination","MisTallas");
// Instancia un Objeto Cliente HTTP 
var client = new $.net.http.Client();
// Asigna URI del Servicio OData del Backend
var uri = "Mis_tallasSet?$filter=Cedula eq '"+pCedula+"'&$format=json";
// Codifica el uri para evitar conflictos con espacios y caracteres especiales
var encoded = encodeURI(uri);
// Realiza el Request GET 
var req = new $.web.WebRequest($.net.http.GET, encoded);
client.request(req, dest);
// Obtiene la Respuesta del Cliente
var response = client.getResponse();
// Obtiene la respuesta en formato JSON
var oData = JSON.parse(response.body.asString());
var objData =  {
					items: oData.d.results
				};
// Realiza el retorno de los datos
$.response.contentType = "application/json";
$.response.setBody(JSON.stringify( objData ) );
$.response.status = $.net.http.OK; 