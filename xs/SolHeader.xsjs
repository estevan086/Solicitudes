var connection = $.db.getConnection();
var statement = null;
var resultSet = null;
var strSql;

function close(closables) {
	closables.forEach(function(element) {
		element.close();
	});
}

switch ($.request.method) {
	case $.net.http.GET:
		var parmCode = $.request.parameters.get('SolicitudId');
		var arrPersonals = [];
        var Estado = ''; 
		var Pendiente = 'PEN';
        var Activo  = 'ACT';
        
    	var UserRole = "EMP";
        
        //Valida el Rol del Usuario
        if ( UserRole === "EMP" ){
            Estado = Activo;
        }
        else{
            Estado = Pendiente;
        }
        
        //Asigna String de Consulta
		strSql = 'select * from "PUBLIC"."SOLHEADER" Where "Estado" = ' + "'" + Estado +  "'"; 
		
		//	'select * from "PUBLIC"."SOLHEADER" ';

		try {
			statement = connection.prepareStatement(strSql);
			resultSet = statement.executeQuery();
			var dataPersonal;

			while (resultSet.next()) {
				dataPersonal = {
				    SOLICITUDID: resultSet.getString(8),
                    NUMEROPERSONA: resultSet.getString(1),
					NOMBREPERSONA: resultSet.getString(2),
					TIPOSOL: resultSet.getString(3),
					ESTADO: resultSet.getString(4),
					FECHAACTUAL: resultSet.getString(5),
					FECHAPROBABLEPARTO: resultSet.getString(6),
					ADJUNTO: resultSet.getBlob(7),
					__metadata: {
						type: "SolHeader",
						uri: "/Solicitudes/SolHeader/SolHeader(" + resultSet.getString(8) + ")"
					}
				};

				arrPersonals.push(dataPersonal);
			}
		} finally {
			close([resultSet, statement, connection]);

			try {
				var objPersonal = parmCode ? {
					SolHeader: arrPersonals[0] ? arrPersonals[0] : {}
				} : {
					SolHeader: arrPersonals
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
	case $.net.http.PUT:
		var sData = JSON.parse($.request.body.asString());

		var strInsert = 'insert into "PUBLIC"."SOLHEADER" (SolicitudId, NumeroPersona, NombrePersona, TipoSol, Estado, FechaActual, FechaProbableParto, Adjunto) values("1","123","Carlos",?,"ACT","20180419","","")';

		try {
			statement = connection.prepareStatement(strSql);
			statement.setString(1, sData.TIPOSOL);
			statement.execute();
			connection.commit();
		} finally {
			close([statement, connection]);

			try {
				$.response.contentType = "application/json";
				$.response.setBody(JSON.stringify({
					d: sData
				}));
			} catch (err) {
				$.response.contentType = "text/plain";
				$.response.setBody("Error while executing query: [" + err.message + "]");
				$.response.returnCode = 200;
			}
		}
		break;
	case $.net.http.DEL:

		var parmCodedel = $.request.parameters.get('Codigo');

		var strDelete = "delete from S0019120377.PERSONAL where CODIGO=?";

		strSql = strDelete;

		try {
			statement = connection.prepareStatement(strSql);
			statement.setString(1, parmCodedel);
			statement.execute();
			connection.commit();
		} finally {
			close([statement, connection]);
			$.response.returnCode = 200;
			$.response.contentType = "application/json";
			$.response.setBody(JSON.stringify({
				d: {
					CODIGO: parseInt(parmCodedel)
				}
			}));
		}

		break;
	default:
		break;
}