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
		var arrPersonals = [];
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
		strSql = 'select * from "PUBLIC"."SOLHEADER" Where "Estado" = ' + "'" + Estado + "'" + ' ORDER BY CAST ( "SolicitudId" AS INTEGER) Asc ';

		//	'select * from "PUBLIC"."SOLHEADER" ';

		try {
			statement = connection.prepareStatement(strSql);
			resultSet = statement.executeQuery();
			var dataPersonal;

			while (resultSet.next()) {
				dataPersonal = {
					SOLICITUDID: parseInt(resultSet.getString(1)),
					NUMEROPERSONA: resultSet.getString(2),
					NOMBREPERSONA: resultSet.getString(3),
					TIPOSOL: resultSet.getString(4),
					ESTADO: resultSet.getString(5),
					FECHAACTUAL: resultSet.getString(6),
					FECHAPROBABLEPARTO: resultSet.getString(7),
					COMENTARIO: resultSet.getString(8),
					ARCHIVODATA: resultSet.getBlob(9),
					ARCHIVONOMBRE: resultSet.getString(10),
					ARCHIVOTIPO: resultSet.getString(11),
					__metadata: {
						type: "SolHeader",
						uri: "/Solicitudes/SolHeader/SolHeader(" + resultSet.getString(1) + ")"
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
		//var parmCode = $.request.parameters.get('SolicitudId');
		sData = JSON.parse($.request.body.asString());

		var strSqlConsulta = 'select Top 1 CAST ( "SolicitudId" AS INTEGER) "SolicitudId" from "PUBLIC"."SOLHEADER" ORDER BY "SolicitudId" Desc';
		var arrPersonals = [];

		try {
			statement = connection.prepareStatement(strSqlConsulta);
			//statement.execute();
			resultSet = statement.executeQuery();

			var dataPersonal;
			while (resultSet.next()) {
				dataPersonal = {
					SOLICITUDID: resultSet.getString(1),
					__metadata: {
						type: "SolHeader",
						uri: "/Solicitudes/SolHeader/SolHeader(" + resultSet.getString(1) + ")"
					}
				};

				arrPersonals.push(dataPersonal);
			}
		} finally {
			//close([resultSet, statement, connection]);

			try {
				var SiguienteId;
				if (arrPersonals.length > 0) {
					SiguienteId = parseInt(dataPersonal.SOLICITUDID) + 1;
				} else {
					SiguienteId = 1;
				}
			} catch (err) {
				$.response.contentType = "text/plain";
				$.response.setBody("Error while executing query: [" + err.message + "]");
				$.response.returnCode = 200;
			}
		}
		//------REALIZA INSERT HEADER
		var strInsert =
			'insert into "PUBLIC"."SOLHEADER" ("SolicitudId", "NumeroPersona", "NombrePersona", "TipoSol", "Estado", "FechaActual", "FechaProbableParto", "Comentario", "ArchivoData", "ArchivoNombre", "ArchivoTipo") ' +
			' values( ' +
			" ?, " +
			" '123', " +
			" 'Carlos', " +
			" ?, " +
			" 'ACT', " +
			" '20180419', " +
			" ' ', " +
			" ?, " +
			" ?, " +
			" ?, " +
			" ? " +
			' ) ';

		try {
			statement = connection.prepareStatement(strInsert);
			statement.setString(1, SiguienteId.toString());
			statement.setString(2, sData.TIPOSOL);
			statement.setString(3, sData.COMENTARIO);
			statement.setString(4, sData.ARCHIVODATA);
			statement.setString(5, sData.ARCHIVONOMBRE);
			statement.setString(6, sData.ARCHIVOTIPO);
			statement.execute();
			//connection.commit();
		} finally {
			//close([statement, connection]);

			try {
				$.response.contentType = "application/json";
				$.response.setBody(JSON.stringify(SiguienteId.toString()));
				var statementDetail;
				//--------------REALIZA INSERT DETAIL           
				for (var i = 0; i < sData.MATERIALES.length; i++) {
					var obj = sData.MATERIALES[i];

					var SolicitudItem = i + 1;
					var strInsertDetail =
						'insert into "PUBLIC"."SOLDETAIL" ("SolicitudId", "SolicitudItem", "Estado", "Material", "Cantidad") ' +
						' values( ' +
						" ?, " +
						" ?, " +
						" 'ACT', " +
						" ?, " +
						" ? " +
						' ) ';

					try {
						statementDetail = connection.prepareStatement(strInsertDetail);
						statementDetail.setString(1, SiguienteId.toString());
						statementDetail.setString(2, SolicitudItem.toString());
						statementDetail.setString(3, obj.material);
						statementDetail.setString(4, obj.cantidad);
						statementDetail.execute();

					} finally {
						//close([statement, connection]);

						try {
							//	$.response.contentType = "application/json";
							//	$.response.setBody(JSON.stringify(SiguienteId.toString()));
						} catch (err) {
							$.response.contentType = "text/plain";
							$.response.setBody("Error while executing query: [" + err.message + "]");
							$.response.returnCode = 200;
						}
					}
					//});
				}
				//-------------CONSULTA CONSECUTIVO DEL LOG
				var strSqlConsultaLog =
					'select Top 1 "SolicitudId", "Sequence" from "PUBLIC"."SOLLOG" WHERE "SolicitudId" = ? ORDER BY "Sequence" Desc';
				var arrLog = [];
				var resultSetLog;
				try {
					var statementGetLog;
					statementGetLog = connection.prepareStatement(strSqlConsultaLog);
					statementGetLog.setString(1, SiguienteId.toString());
					resultSetLog = statementGetLog.executeQuery();

					var dataLog;
					while (resultSetLog.next()) {
						dataLog = {
							SOLICITUDID: resultSetLog.getString(1),
							SEQUENCE: resultSetLog.getString(2)
						};

						arrLog.push(dataLog);
					}
				} finally {
					//close([statement, connection]);
					var SiguienteSequence;
					if (arrLog.length > 0) {
						SiguienteSequence = dataLog.SEQUENCE + 1;
					} else {
						SiguienteSequence = 1;
					}
					try {
						//	$.response.contentType = "application/json";
						//	$.response.setBody(JSON.stringify(SiguienteId.toString()));
					} catch (err) {
						$.response.contentType = "text/plain";
						$.response.setBody("Error while executing Consulta Log: [" + err.message + "]");
						$.response.returnCode = 200;
					}
				}
				//-------------REALIZA INSERT LOG
				var statementInsertLog;
				
                var newDate = new Date();
                var datetime = "LastSync: " + newDate.today() + " @ " + newDate.timeNow();
				var strInsertLog =
					'insert into "PUBLIC"."SOLLOG" ("SolicitudId", "Sequence", "FechaActual", "HoraActual", "Usuario", "Estado", "Comentario") ' +
					' values( ' +
					" ?, " +
					" ?, " +
					" ?, " +
					" current_time, " +
					" 'CARLOSGU', " +
					" 'INI', " +
					" 'Creación Solicitud' " +
					' ) ';

				try {
				    
					statementInsertLog = connection.prepareStatement(strInsertLog);
					statementInsertLog.setString(1, SiguienteId.toString());
					statementInsertLog.setString(2, SiguienteSequence.toString());
					statementInsertLog.setString(3, newDate.today().toString());
					statementInsertLog.execute();

				} finally {
					//close([statement, connection]);

					try {
						//	$.response.contentType = "application/json";
						//	$.response.setBody(JSON.stringify(SiguienteId.toString()));
					} catch (err) {
						$.response.contentType = "text/plain";
						$.response.setBody("Error while executing Insert Log: [" + err.message + "]");
						$.response.returnCode = 200;
					}
				}

				connection.commit();
				close([statement, connection]);

				try {
					//	$.response.contentType = "application/json";
					//	$.response.setBody(JSON.stringify(SiguienteId.toString()));
				} catch (err) {
					$.response.contentType = "text/plain";
					$.response.setBody("Error while executing query: [" + err.message + "]");
					$.response.returnCode = 200;
				}
			} catch (err) {
				$.response.contentType = "text/plain";
				$.response.setBody("Error while executing query: [" + err.message + "]");
				$.response.returnCode = 200;
			}
		}
		break;
	case $.net.http.PUT:

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