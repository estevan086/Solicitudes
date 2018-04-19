var connection = $.db.getConnection();
var statement = null;
var resultSet = null;
var strSql;

var parmCode = $.request.parameters.get('Estado');
var arrPersonals = [];

var Pendiente = 'PEN';


strSql = 'select * from "PUBLIC"."SOLHEADER" Where "Estado" = ' + "'" + Pendiente +  "'"; 

statement = connection.prepareStatement(strSql);
resultSet = statement.executeQuery();
var dataPersonal;
while (resultSet.next()) {
	dataPersonal = {
		CODIGO: resultSet.getString(1),
		__metadata: {
			type: "SolHeader",
			uri: "/Solicitudes/SolHeader/SolHeader(" + resultSet.getString(1) + ")"
		}
	};

	arrPersonals.push(dataPersonal);
}

var objPersonal = {
	d: arrPersonals
};
$.response.contentType = "application/json";
$.response.setBody(JSON.stringify(objPersonal));