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
		var parmCode = $.request.parameters.get('Codigo');
		var arrPersonals = [];

		strSql = parmCode ? "select * from S0019120377.Solicitudes.xs::Solicitud.SolHeader where CODIGO = " + parmCode :
			"select * from S0019120377.Solicitudes.xs::Solicitud.SolHeader order by CODIGO";

		try {
			statement = connection.prepareStatement(strSql);
			resultSet = statement.executeQuery();
			var dataPersonal;

			while (resultSet.next()) {
				dataPersonal = {
					CODIGO: resultSet.getInteger(1),
					EMAIL: resultSet.getString(2),
					FIRSTNAME: resultSet.getString(3),
					LASTNAME: resultSet.getString(4),
					AGE: resultSet.getString(5),
					ADDRESS: resultSet.getString(6),
					__metadata: {
						type: "SolHeader",
						uri: "/Solicitudes/SolHeader/SolHeader(" + resultSet.getInteger(1) + ")"
					}
				};

				arrPersonals.push(dataPersonal);
			}
		} finally {
			close([resultSet, statement, connection]);

			try {
				var objPersonal = parmCode ? {
					d: arrPersonals[0] ? arrPersonals[0] : {}
				} : {
					d: arrPersonals
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

		var strInsert = "insert into S0019120377.PERSONAL (EMAIL, FIRSTNAME, LASTNAME, AGE, ADDRESS, CODIGO) values(?,?,?,?,?,?)";
		var strUpdate = "update S0019120377.PERSONAL set EMAIL=?, FIRSTNAME=?, LASTNAME=?, AGE=?, ADDRESS=? where CODIGO=?";

		strSql = $.request.method === $.net.http.POST ? strInsert : strUpdate;

		try {
			statement = connection.prepareStatement(strSql);
			statement.setString(1, sData.EMAIL);
			statement.setString(2, sData.FIRSTNAME);
			statement.setString(3, sData.LASTNAME);
			statement.setString(4, sData.AGE);
			statement.setString(5, sData.ADDRESS);
			statement.setString(6, sData.CODIGO);
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