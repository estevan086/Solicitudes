/*global QUnit*/

jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 SolHeader in the list

sap.ui.require([
	"sap/ui/test/Opa5",
	"com/Solicitudes/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"com/Solicitudes/test/integration/pages/App",
	"com/Solicitudes/test/integration/pages/Browser",
	"com/Solicitudes/test/integration/pages/Master",
	"com/Solicitudes/test/integration/pages/Detail",
	"com/Solicitudes/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.Solicitudes.view."
	});

	sap.ui.require([
		"com/Solicitudes/test/integration/MasterJourney",
		"com/Solicitudes/test/integration/NavigationJourney",
		"com/Solicitudes/test/integration/NotFoundJourney",
		"com/Solicitudes/test/integration/BusyJourney"
	], function () {
		QUnit.start();
	});
});