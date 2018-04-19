/*global location */
sap.ui.define([
		"com/Solicitudes/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"com/Solicitudes/model/formatter",
		"sap/m/MessageToast",
	    "sap/m/UploadCollectionParameter"
	], function (BaseController, JSONModel, formatter, MessageToast, UploadCollectionParameter) {
		"use strict";

		return BaseController.extend("com.Solicitudes.controller.Detail", {

			formatter: formatter,

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			onInit : function () {
				// Model used to manipulate control states. The chosen values make sure,
				// detail page is busy indication immediately so there is no break in
				// between the busy indication for loading the view's meta data
				var oViewModel = new JSONModel({
					busy : false,
					delay : 0
				});

				this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

				this.setModel(oViewModel, "detailView");

				this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
				
				
				// var sPath;

    // 			// set mock data
    // 			sPath = jQuery.sap.getModulePath("sap.m.sample.UploadCollectionVersioning", "/uploadCollection.json");
    // 			this.getView().setModel(new JSONModel(sPath));
    
    // 			// Sets the text to the label
    // 			this.getView().byId("UploadCollection").addEventDelegate({
    // 				onBeforeRendering: function() {
    // 					this.getView().byId("attachmentTitle").setText(this.getAttachmentTitleText());
    // 				}.bind(this)
    // 			});
    
    // 			// Flag to track if the upload of the new version was triggered by the Upload a new version button.
    // 			this.bIsUploadVersion = false;
				
				
				
		    var oModel = new sap.ui.model.json.JSONModel();

			oModel.setData({
				DetalleSol: [
					{
						area: "01",
						material: "Pantalon",
						talla: "XL",
						unidad: "UN"
					},
					{
				    	area: "02",
						material: "Camisa",
						talla: "L",
						unidad: "UN"
					},
					{
						area: "03",
						material: "Casco",
						talla: "M",
						unidad: "UN"
					},
					{
						area: "04",
						material: "Zapatos",
						talla: "40",
						unidad: "PAR"
					}
             ]
			});
          // var TblDetalleSol = sap.ui.getCore().getElementById("TableMisTallas");
			this.getView().setModel(oModel, "items");
				
				
		    var oModelLog = new sap.ui.model.json.JSONModel();

			oModelLog.setData({
				items: [
					{
						fecha: "20180417",
					    hora: "10:01:02",
						usuario: "CARLOSGU",
						estado: "ACT",
						comentario: "Inicio Solicitud"
					},
					{
						fecha: "20180417",
					    hora: "10:01:02",
						usuario: "CARLOSGU",
						estado: "PEN",
						comentario: "Inicio Solicitud"
					},
					{
						fecha: "20180417",
					    hora: "10:01:02",
						usuario: "CARLOSGU",
						estado: "APR",
						comentario: "Inicio Solicitud"
					},
					{
						fecha: "20180417",
					    hora: "10:01:02",
						usuario: "DIEGOC",
						estado: "REC",
						comentario: "Rechazado"
					}
             ]
			});
            //var TblLog = sap.ui.getCore().getElementById("TableLog");
            
            this.getView().setModel(oModelLog, "Log");				
				
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

			/**
			 * Event handler when the share by E-Mail button has been clicked
			 * @public
			 */
			onShareEmailPress : function () {
				var oViewModel = this.getModel("detailView");

				sap.m.URLHelper.triggerEmail(
					null,
					oViewModel.getProperty("/shareSendEmailSubject"),
					oViewModel.getProperty("/shareSendEmailMessage")
				);
			},



			/* =========================================================== */
			/* begin: internal methods                                     */
			/* =========================================================== */

			/**
			 * Binds the view to the object path and expands the aggregated line items.
			 * @function
			 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
			 * @private
			 */
			_onObjectMatched : function (oEvent) {
				var sObjectId =  oEvent.getParameter("arguments").objectId;
				this.getModel().metadataLoaded().then( function() {
					var sObjectPath = this.getModel().createKey("SolHeader", {
						SolicitudId :  sObjectId
					});
					this._bindView("/" + sObjectPath);
				}.bind(this));
			},

			/**
			 * Binds the view to the object path. Makes sure that detail view displays
			 * a busy indicator while data for the corresponding element binding is loaded.
			 * @function
			 * @param {string} sObjectPath path to the object to be bound to the view.
			 * @private
			 */
			_bindView : function (sObjectPath) {
				// Set busy indicator during view binding
				var oViewModel = this.getModel("detailView");

				// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
				oViewModel.setProperty("/busy", false);

				this.getView().bindElement({
					path : sObjectPath,
					events: {
						change : this._onBindingChange.bind(this),
						dataRequested : function () {
							oViewModel.setProperty("/busy", true);
						},
						dataReceived: function () {
							oViewModel.setProperty("/busy", false);
						}
					}
				});
			},

			_onBindingChange : function () {
				var oView = this.getView(),
					oElementBinding = oView.getElementBinding();

				// No data for the binding
				if (!oElementBinding.getBoundContext()) {
					this.getRouter().getTargets().display("detailObjectNotFound");
					// if object could not be found, the selection in the master list
					// does not make sense anymore.
					this.getOwnerComponent().oListSelector.clearMasterListSelection();
					return;
				}

				var sPath = oElementBinding.getPath(),
					oResourceBundle = this.getResourceBundle(),
					oObject = oView.getModel().getObject(sPath),
					sObjectId = oObject.SolicitudId,
					sObjectName = oObject.TipoSol,
					oViewModel = this.getModel("detailView");

				this.getOwnerComponent().oListSelector.selectAListItem(sPath);

				oViewModel.setProperty("/shareSendEmailSubject",
					oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
				oViewModel.setProperty("/shareSendEmailMessage",
					oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
			},

			_onMetadataLoaded : function () {
				// Store original busy indicator delay for the detail view
				var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
					oViewModel = this.getModel("detailView");

				// Make sure busy indicator is displayed immediately when
				// detail view is displayed for the first time
				oViewModel.setProperty("/delay", 0);

				// Binding the view will set it to not busy - so the view is always busy if it is not bound
				oViewModel.setProperty("/busy", true);
				// Restore original busy indicator delay for the detail view
				oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
			}

		});

	}
);