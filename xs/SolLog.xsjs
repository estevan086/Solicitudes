var connection = $.db.getConnection();
var statement = null;
var resultSet = null;
var sData = null;
var strSql;

function close(closables) {
	closables.forEach(function(element) {
		element.close();
	});
}

switch ($.request.method) {
	case $.net.http.GET:
		var parmCode = $.request.parameters.get('SolicitudId');
		
		var arrLog = [];
		var Estado = '';
		var Pendiente = 'PEN';
		var Activo = 'ACT';

		var UserRole = "EMP";

		//Valida el Rol del Usuario
		if (UserRole === "EMP") {
			Estado = Activo;
		} else {
			Estado = Pendiente; 
		}

		//Asigna String de Consulta
		if (  parmCode == null || parmCode == '' ){
            strSql = 'select "SolicitudId", "Sequence", "FechaActual", "HoraActual", "Usuario", "Estado", "Comentario" from "PUBLIC"."SOLLOG" ORDER BY CAST ( "SolicitudId" AS INTEGER) Asc ';
		}
		else{
		    strSql = 'select "SolicitudId", "Sequence", "FechaActual", "HoraActual", "Usuario", "Estado", "Comentario" from "PUBLIC"."SOLLOG" Where "SolicitudId" = ' +  parmCode  + ' ORDER BY CAST ( "SolicitudId" AS INTEGER) Asc ';
        }
        
		//strSql = 	'select * from "PUBLIC"."SOLLOG" ';

		try {
			statement = connection.prepareStatement(strSql);
			resultSet = statement.executeQuery();
			var dataLog;

			while (resultSet.next()) {
				dataLog = {
					SOLICITUDID: parseInt(resultSet.getString(1)),
					SEQUENCE: resultSet.getString(2),
					FECHAACTUAL: resultSet.getString(3),
					HORAACTUAL: resultSet.getString(4),
					USUARIO: resultSet.getString(5),
					ESTADO: resultSet.getString(6),
					COMENTARIO: resultSet.getString(7),
					__metadata: {
						type: "SolLog",
						uri: "/Solicitudes/SolLog/SolLog(" + resultSet.getString(1) + ")"
					}
				};

				arrLog.push(dataLog);
			}
		} finally {
			close([resultSet, statement, connection]);

			try {
				var objPersonal = parmCode ? {
					items: arrLog
				} : {
					items: arrLog
				};
				$.response.contentType = "application/json";
				$.response.setBody(JSON.stringify(objPersonal));
			} catch (err) {
				$.response.contentType = "text/plain";
				$.response.setBody("Error while executing query: [" + err.message + "]");
				$.response.returnCode = 500;
			}
		}
		break;
	case $.net.http.POST:
	
		break;
	case $.net.http.PUT:
	
		break;
	case $.net.http.DEL:

		break;
	default:
		break;
}