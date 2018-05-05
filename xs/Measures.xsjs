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

// For todays date;
Date.prototype.today = function () { 
    return  this.getFullYear() + (((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1)  + ((this.getDate() < 10)?"0":"") + this.getDate();
}

// For the time now
Date.prototype.timeNow = function () {
     return ((this.getHours() < 10)?"0":"") + this.getHours() + ((this.getMinutes() < 10)?"0":"") + this.getMinutes() + ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
}

switch ($.request.method) {
	case $.net.http.GET:
		var parmCode = $.request.parameters.get('SolicitudId');
		var arrTallas = [];
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
		//strSql = 'select * from "PUBLIC"."SOLHEADER" Where "Estado" = ' + "'" + Estado + "'" + ' ORDER BY CAST ( "SolicitudId" AS INTEGER) Asc ';

		strSql = 'select * from "PUBLIC"."MEASURES" ';

		try {
			statement = connection.prepareStatement(strSql);
			resultSet = statement.executeQuery();
			var dataTallas;

			while (resultSet.next()) {
				dataTallas = {
					SEQUENCE: parseInt(resultSet.getString(1)),
					NUMEROPERSONA: resultSet.getString(2),
					NUMERODIRECTORIO: resultSet.getString(3),
					MATERIAL: resultSet.getString(4),
					TALLA: resultSet.getString(5),
					ESTADO: resultSet.getString(6),
					FECHA: resultSet.getString(7),
					HORA: resultSet.getString(8),
					__metadata: {
						type: "Measures",
						uri: "/Solicitudes/Measures/Measures(" + resultSet.getString(1) + ")"
					}
				};

				arrTallas.push(dataTallas);
			}
		} finally {
			close([resultSet, statement, connection]);

			try {
				var objPersonal = parmCode ? {
					items: arrTallas
				} : {
					items: arrTallas
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
		//var parmCode = $.request.parameters.get('SolicitudId');
		sData = JSON.parse($.request.body.asString());

		var strSqlConsulta = 'select Top 1 "Sequence" from "PUBLIC"."MEASURES" ORDER BY "Sequence" Desc';
		var arrSiguienteSeq = [];

		try {
			statement = connection.prepareStatement(strSqlConsulta);
			//statement.execute();
			resultSet = statement.executeQuery();

			var dataSiguienteSeq;
			while (resultSet.next()) {
				dataSiguienteSeq = {
					SEQUENCE: resultSet.getString(1),
					__metadata: {
						type: "Measures",
						uri: "/Solicitudes/Measures/Measures(" + resultSet.getString(1) + ")"
					}
				};

				arrSiguienteSeq.push(dataSiguienteSeq);
			}
		} finally {
			//close([resultSet, statement, connection]);

			try {
				var SiguienteId;
				if (arrSiguienteSeq.length > 0) {
					SiguienteId = parseInt(dataSiguienteSeq.SEQUENCE) + 1;
				} else {
					SiguienteId = 1;
				}
			} catch (err) {
				$.response.contentType = "text/plain";
				$.response.setBody("Error while executing query: [" + err.message + "]");
				$.response.returnCode = 200;
			}
		}
		//------REALIZA INSERT TALLAS
        var statementInsert;
		//--------------REALIZA INSERT DETAIL           
		for (var i = 0; i < sData.MATERIALES.length; i++) {
			var obj = sData.MATERIALES[i];

			var Item = i + 1;	
			var SiguienteIdSeq = SiguienteId + Item;
    		var strInsert =
    			'insert into "PUBLIC"."MEASURES" ("Sequence", "NumeroPersona", "NumeroDirectorio", "Material", "Talla", "Estado", "Fecha", "Hora" ) ' +
    			' values( ' +
    			" ?, " +
    			" '123', " +
    			" '900001', " +
    			" ?, " +
    			" ?, " +
    			" 'ACT', " +
    			" ' ', " +
    			" ' ' " +
    			' ) ';

    		try {
    			statementInsert = connection.prepareStatement(strInsert);
    			statementInsert.setString(1, SiguienteIdSeq.toString());
    			statementInsert.setString(2, sData.MATERIAL);
    			statementInsert.setString(3, sData.TALLA);
    			statementInsert.execute();
    		
    			//connection.commit();
    		} finally {
    			//close([statementInsert, connection]);
    
    			try {
    			//	$.response.contentType = "application/json";
    			//	$.response.setBody(JSON.stringify(SiguienteId.toString()));
    			} catch (err) {
    				$.response.contentType = "text/plain";
    				$.response.setBody("Error while executing query: [" + err.message + "]");
    				$.response.returnCode = 200;
    			}
    		}
		}

		//---Realiza Commit a la base de Datos
		try {
    		connection.commit();
    		close([statementInsert, connection]);
			$.response.contentType = "application/json";
			$.response.setBody(JSON.stringify(SiguienteId.toString()));
		} catch (err) {
			$.response.contentType = "text/plain";
			$.response.setBody("Error while executing query: [" + err.message + "]");
			$.response.returnCode = 200;
		}
		break;
	case $.net.http.PUT:

		break;
	case $.net.http.DEL:

		break;
	default:
		break;
}