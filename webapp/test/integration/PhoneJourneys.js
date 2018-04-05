/*global QUnit*/

jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

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
		"com/Solicitudes/test/integration/NavigationJourneyPhone",
		"com/Solicitudes/test/integration/NotFoundJourneyPhone",
		"com/Solicitudes/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});