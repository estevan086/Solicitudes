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
		
		var arrDetail = [];
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
            strSql = 'select "SolicitudId", "SolicitudItem", "Estado", "Material", "Cantidad" from "PUBLIC"."SOLDETAIL" ORDER BY CAST ( "SolicitudItem" AS INTEGER) Asc ';
		}
		else{
		    strSql = 'select "SolicitudId", "SolicitudItem", "Estado", "Material", "Cantidad" from "PUBLIC"."SOLDETAIL" Where "SolicitudId" = ' +  parmCode  + ' ORDER BY CAST ( "SolicitudItem" AS INTEGER) Asc ';
        }
        
		//strSql = 	'select * from "PUBLIC"."SOLLOG" ';

		try {
			statement = connection.prepareStatement(strSql);
			resultSet = statement.executeQuery();
			var dataDetail;

			while (resultSet.next()) {
				dataDetail = {
					SOLICITUDID: parseInt(resultSet.getString(1)),
					SOLICITUDITEM: resultSet.getString(2),
					ESTADO: resultSet.getString(3),
					MATERIAL: resultSet.getString(4),
					CANTIDAD: resultSet.getString(5),
					__metadata: {
						type: "SolLog",
						uri: "/Solicitudes/SolDetail/SolDetail(" + resultSet.getString(1) + ")"
					}
				};

				arrDetail.push(dataDetail);
			}
		} finally {
			close([resultSet, statement, connection]);

			try {
				var objPersonal = parmCode ? {
					items: arrDetail
				} : {
					items: arrDetail
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