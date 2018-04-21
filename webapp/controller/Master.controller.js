/*global history */
sap.ui.define([
		"com/Solicitudes/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/m/GroupHeaderListItem",
		"sap/ui/Device",
		"com/Solicitudes/model/formatter",
		"sap/m/MessageBox",
		"sap/m/MessageToast"
	], function(BaseController, JSONModel, Filter, FilterOperator, GroupHeaderListItem, Device, formatter, MessageBox, MessageToast) {
	"use strict";

	return BaseController.extend("com.Solicitudes.controller.Master", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
		 * @public
		 */
		onInit: function() {

			// Control state model
			var oList = this.byId("list"),
				oViewModel = this._createViewModel(),
				// Put down master list's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the master list is
				// taken care of by the master list itself.
				iOriginalBusyDelay = oList.getBusyIndicatorDelay();

			this._oList = oList;
			// keeps the filter and search state
			this._oListFilterState = {
				aFilter: [],
				aSearch: []
			};

			this.setModel(oViewModel, "masterView");
			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oList.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for the list
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});

			this.getView().addEventDelegate({
				onBeforeFirstShow: function() {
					this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
				}.bind(this)
			});

			this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().attachBypassed(this.onBypassed, this);

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		onBeforeRendering: function() {

			//Valida Rol del usuario y Obtiene datos de las Solicitudes según el Rol 
			var that = this;
			$.get("/Solicitudes/xs/SolHeader.xsjs", function(result) {
				var resultJSON = result;
				var oModel = new sap.ui.model.json.JSONModel();
				oModel.setData(resultJSON);
				that.getView().setModel(oModel);

				that._updateListItemCount(Object.keys(resultJSON.SolHeader).length);

			});

			//Obtener Roles del Usuario Logueado
			this.getView().setModel(new sap.ui.model.json.JSONModel(), "gblRoleData");
			var that2 = this;
			$.get("/Solicitudes/xs/UserRoles.xsjs", function(result) {
				var resultJSON = JSON.parse(result);
				that2.getView().getModel("gblRoleData").setData({
					UserName: resultJSON.UserName,
					UserRole: resultJSON.UserRole
				});
			});

		},

		/**
		 * After list data is available, this handler method updates the
		 * master list counter and hides the pull to refresh control, if
		 * necessary.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function(oEvent) {
			//Se realiza seleccion del Nuevo Detail ya que ha sido modificado en el cargue inicial
			// 			var oList = this.getView().byId("list");

			// 			oList.getBinding("items").filter(null);

			// 			var aItems = oList.getItems();
			// 			if (aItems.length) {
			// 				var result = aItems.filter(function(obj) {
			// 					if (obj.mProperties.selected === true) {
			// 						return obj;
			// 					}
			// 				});
			// 				this._showDetailNew(PrimerSolicitudId);
			// 			}

			// 			var oItemSelected = oList.getSelectedItem();
			// 			if (oItemSelected) {
			// 				var oItemDomRef = oItemSelected.getDomRef();

			// 				//var oItemDomRef = oList.getSelectedItem().getDomRef();
			// 				if (!oItemDomRef) {
			// 					this.getView().byId("list").addEventDelegate({
			// 						onAfterRendering: function() {
			// 							this._scrollToListItem();
			// 						}.bind(this)
			// 					});
			// 				} else {
			// 					oItemDomRef.focus();
			// 				}
			// 			}

			// 			// update the master list object counter after new data is loaded
			// 			this._updateListItemCount(oEvent.getParameter("total"));
			// 			// hide pull to refresh if necessary
			// 			this.byId("pullToRefresh").hide();
		},

		/**
		 * Event handler for the master search field. Applies current
		 * filter value and triggers a new search. If the search field's
		 * 'refresh' button has been pressed, no new search is triggered
		 * and the list binding is refresh instead.
		 * @param {sap.ui.base.Event} oEvent the search event
		 * @public
		 */
		onSearch: function(oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
				return;
			}

			var sQuery = oEvent.getParameter("query");

			if (sQuery) {
				this._oListFilterState.aSearch = [new Filter("TipoSol", FilterOperator.Contains, sQuery)];
			} else {
				this._oListFilterState.aSearch = [];
			}
			this._applyFilterSearch();

		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function() {
			this._oList.getBinding("items").refresh();
		},

		/**
		 * Event handler for the list selection event
		 * @param {sap.ui.base.Event} oEvent the list selectionChange event
		 * @public
		 */
		onSelectionChange: function(oEvent) {
			var oList = oEvent.getSource(),
				bSelected = oEvent.getParameter("selected");

			// skip navigation when deselecting an item in multi selection mode
			if (!(oList.getMode() === "MultiSelect" && !bSelected)) {
				// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
				this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
			}
		},

		/**
		 * Event handler for the bypassed event, which is fired when no routing pattern matched.
		 * If there was an object selected in the master list, that selection is removed.
		 * @public
		 */
		onBypassed: function() {
			this._oList.removeSelections(true);
		},

		/**
		 * Used to create GroupHeaders with non-capitalized caption.
		 * These headers are inserted into the master list to
		 * group the master list's items.
		 * @param {Object} oGroup group whose text is to be displayed
		 * @public
		 * @returns {sap.m.GroupHeaderListItem} group header with non-capitalized caption.
		 */
		createGroupHeader: function(oGroup) {
			return new GroupHeaderListItem({
				title: oGroup.text,
				upperCase: false
			});
		},

		/**
		 * Event handler for navigating back.
		 * We navigate back in the browser historz
		 * @public
		 */
		onNavBack: function() {
			history.go(-1);
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		_createViewModel: function() {
			return new JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "",
				delay: 0,
				title: this.getResourceBundle().getText("masterTitleCount", [0]),
				noDataText: this.getResourceBundle().getText("masterListNoDataText"),
				//sortBy: "TipoSol",
				groupBy: "None"
			});
		},

		/**
		 * If the master route was hit (empty hash) we have to set
		 * the hash to to the first item in the list as soon as the
		 * listLoading is done and the first item in the list is known
		 * @private
		 */
		_onMasterMatched: function() {
			this.getOwnerComponent().oListSelector.oWhenListLoadingIsDone.then(
				function(mParams) {
					if (mParams.list.getMode() === "None") {
						return;
					}
					var sObjectId = mParams.firstListitem.getBindingContext().getProperty("SolicitudId");
					this.getRouter().navTo("object", {
						objectId: sObjectId
					}, true);
				}.bind(this),
				function(mParams) {
					if (mParams.error) {
						return;
					}
					this.getRouter().getTargets().display("detailNoObjectsAvailable");
				}.bind(this)
			);
		},

		/**
		 * Shows the selected item on the detail page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showDetail: function(oItem) {
			var bReplace = !Device.system.phone;
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("SOLICITUDID")
			}, bReplace);
		},

		_showDetailNew: function(pSolicitudId) {
			var bReplace = !Device.system.phone;

			if (pSolicitudId) {

				this.getRouter().navTo("object", {
					objectId: pSolicitudId
				}, bReplace);

			}
		},
		/**
		 * Sets the item count on the master list header
		 * @param {integer} iTotalItems the total number of items in the list
		 * @private
		 */
		_updateListItemCount: function(iTotalItems) {
			var sTitle;
			// only update the counter if the length is final
			if (this._oList.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
				this.getModel("masterView").setProperty("/title", sTitle);
			}
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @private
		 */
		_applyFilterSearch: function() {
			var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
				oViewModel = this.getModel("masterView");
			this._oList.getBinding("items").filter(aFilters, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aFilters.length !== 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
			} else if (this._oListFilterState.aSearch.length > 0) {
				// only reset the no data text to default when no new search was triggered
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			}
		},

		/**
		 * Internal helper method to apply both group and sort state together on the list binding
		 * @param {sap.ui.model.Sorter[]} aSorters an array of sorters
		 * @private
		 */
		_applyGroupSort: function(aSorters) {
			this._oList.getBinding("items").sort(aSorters);
		},

		/**
		 * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
		 * @param {string} sFilterBarText the selected filter value
		 * @private
		 */
		_updateFilterBar: function(sFilterBarText) {
			var oViewModel = this.getModel("masterView");
			oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
			oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
		},

		onTallasPress: function() {

			this._CreateDialog = sap.ui.xmlfragment("com.Solicitudes.view.fragments.Tallas", this);
			this._CreateDialog.open();

			var oModel = new sap.ui.model.json.JSONModel();

			oModel.setData({
				items: [
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
			var TblTallas = sap.ui.getCore().getElementById("TableMisTallas");

			TblTallas.setModel(oModel, "Tallas");
			//this.getView().setModel(oModel, "Tallas");

		},

		onActualizarTallasPress: function() {
			var oStData = {
				CODIGO: sap.ui.getCore().byId("frmCode").getValue(),
				EMAIL: sap.ui.getCore().byId("frmMail").getValue(),
				FIRSTNAME: sap.ui.getCore().byId("frmFName").getValue(),
				LASTNAME: sap.ui.getCore().byId("frmLName").getValue(),
				AGE: sap.ui.getCore().byId("frmAge").getValue(),
				ADDRESS: sap.ui.getCore().byId("frmAddress").getValue()
			};

			this.getView().getModel().create("/Personal", oStData, {
				success: jQuery.proxy(function(mResponse) {
					this._CreateDialog.close();
					this._CreateDialog.destroy();
				}, this),
				error: jQuery.proxy(function() {
					console.log("error");
				}, this)
			});
		},

		onAbrirVentanaCrearPress: function() {
			this._CreateDialog = sap.ui.xmlfragment("com.Solicitudes.view.fragments.CreacionSolicitud", this);
			this._CreateDialog.open();

			var oModel = new sap.ui.model.json.JSONModel();

			oModel.setData({
				items: [
					{
						key: "01",
						text: "Materno"
					},
					{
						key: "02",
						text: "Devolución"
					},
					{
						key: "03",
						text: "Adicionales de Dotación"
					}
             ]
			});
			//var CbTiposSol = sap.ui.getCore().getElementById("CbTiposSol");
			//CbTiposSol.setModel(oModel);

			var SlTiposSol = sap.ui.getCore().getElementById("SlTiposSol");
			SlTiposSol.setModel(oModel, "TiposSol");

			var oModelMateriales = new sap.ui.model.json.JSONModel();

			oModelMateriales.setData({
				items: [
					{
						material: "001",
						descripcion: "Pantalon",
						talla: "XL",
						unidad: "UN",
						cantidad: "2"
					},
					{
						material: "002",
						descripcion: "Camisa",
						talla: "L",
						unidad: "UN",
						cantidad: "4"
					},
					{
						material: "003",
						descripcion: "Casco",
						talla: "M",
						unidad: "UN",
						cantidad: "1"
					},
					{
						material: "004",
						descripcion: "Zapatos",
						talla: "40",
						unidad: "PAR",
						cantidad: "1"
					}
             ]
			});
			var TblMateriales = sap.ui.getCore().getElementById("TableMisMateriales");

			TblMateriales.setModel(oModelMateriales, "Materiales");

		},

		fnHandleTipoSolicitud: function(oEvent) {

			if (oEvent.oSource.getSelectedKey()) {
				//var vTipoSol = oEvent.mParameters.selectedItem.mProperties.key;
				//var vTipoSol2 = sap.ui.getCore().getElementById("SlTiposSol").getSelectedKey();
				var vTipoSol = oEvent.oSource.getSelectedKey();
			} else {
				return;
			}

			//var bt = oEvent.getSource();
			var LblFechaParto = sap.ui.getCore().getElementById("LblFechaParto");
			var DPFechaParto = sap.ui.getCore().getElementById("DPFechaParto");
			var LblFileEmbarazo = sap.ui.getCore().getElementById("Lblfile");
			var FileEmbarazo = sap.ui.getCore().getElementById("fileUploader");

			if (vTipoSol !== "01") {
				LblFechaParto.setVisible(false);
				DPFechaParto.setVisible(false);
				LblFileEmbarazo.setVisible(false);
				FileEmbarazo.setVisible(false);
				//bt.setText("Show");
			} else {
				LblFechaParto.setVisible(true);
				DPFechaParto.setVisible(true);
				LblFileEmbarazo.setVisible(true);
				FileEmbarazo.setVisible(true);
				//bt.setText("Hide");
			}
			//var text = select.getSelectedItem().getText();
		},

		onCreatePress: function(oEvent) {

			var iRowIndex = 0; //For First row in the table
			var oTable = sap.ui.getCore().byId("TableMisMateriales"),
				oModelMateriales = oTable.getModel("Materiales").oData.items;
			// aItems = oTable.getItems();

			// if(iRowIndex < aItems.length){
			//   oModel.getProperty("ColA",aItems[iRowIndex].getBindingContext());
			// }

			//Obtiene Archivo Subido si el Tipo de Solicitud es Materno
			var oFileUploader = sap.ui.getCore().byId("fileUploader");
			if (!oFileUploader.getValue()) {
				MessageToast.show("Choose a file first");
				return;
			}
			
			//oFileUploader.upload();

			var file = jQuery.sap.domById(oFileUploader.getId() + "-fu").files[0];
			var filename = oFileUploader.getValue();

			var BASE64_MARKER = 'data:' + file.type + ';base64,';

			var reader = new FileReader();

			var resultBinary;

			var that = this;
			reader.onload = function(evn) {
				that.resultBinary = evn.target.result; //string in PDF
			};

            reader.readAsDataURL(file);
			// reader.readAsArrayBuffer(file);
			// reader.readAsBinaryString(file);
			// reader.readAsText(file);  

			var oStData = {
				TIPOSOL: sap.ui.getCore().getElementById("SlTiposSol").getSelectedKey(),
				DESCRIPCION: sap.ui.getCore().byId("frmDescripcion").getValue(),
				FECHAPARTO: sap.ui.getCore().byId("DPFechaParto").getValue(),
				DESCUENTO: sap.ui.getCore().byId("CbDscto").getSelected(),
				ARCHIVODATA: that.resultBinary,
				MATERIALES: oModelMateriales
			};

			var sParameters = ' ';

			var that = this;
			$.post("/Solicitudes/xs/SolHeader.xsjs", JSON.stringify(oStData), function(result) {
				var resultJSON = result;

				//var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				MessageBox.information(
					"Se ha creado la Solicitud: " + resultJSON
				);
				that._CreateDialog.close();
				that._CreateDialog.destroy();

				//Valida Rol del usuario y Obtiene datos de las Solicitudes según el Rol 
				var that2 = that;
				$.get("/Solicitudes/xs/SolHeader.xsjs", function(resultQRy) {
					var resultJSONQry = resultQRy;
					var oModel = new sap.ui.model.json.JSONModel();
					oModel.setData(resultJSONQry);
					that2.getView().setModel(oModel);

					that2._updateListItemCount(Object.keys(resultJSONQry.SolHeader).length);

				});
			});

			//GOOD
			// 			var that = this;
			// 			jQuery.ajax({
			//                       url: "/Solicitudes/xs/SolHeader.xsjs",
			//                       async :false,
			//                       TYPE: 'POST' ,
			//                       data: oStData,
			//                       dataType: 'text',
			//                       success: function(mResponse) {
			//                           alert("Bueno");
			//                           console.log(mResponse);
			//                           that._CreateDialog.close();
			//                 		  that._CreateDialog.destroy();
			//                       }
			//               });

			// 			this.getView().getModel().create("/Solicitudes/xs/SolHeader", oStData, {
			// 				success: jQuery.proxy(function(mResponse) {
			// 					this._CreateDialog.close();
			// 					this._CreateDialog.destroy();
			// 				}, this),
			// 				error: jQuery.proxy(function() {
			// 					console.log("error");
			// 				}, this)
			// 			});
		},

		onCancelPress: function() {
			this._CreateDialog.close();
			this._CreateDialog.destroy();
		},

		/**
		 * After list data is available, this handler method updates the
		 * master list counter and hides the pull to refresh control, if
		 * necessary.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */

		handleUploadComplete: function(oEvent) {
			var sResponse = oEvent.getParameter("response");
			if (sResponse) {
				var sMsg = "";
				// var m = /^\[(\d\d\d)\]:(.*)$/.exec(sResponse);
				// if (m[1] == "200") {
				// 	sMsg = "Return Code: " + m[1] + "\n" + m[2] + "(Upload Success)";
				// 	oEvent.getSource().setValue("");
				// } else {
				// 	sMsg = "Return Code: " + m[1] + "\n" + m[2] + "(Upload Error)";
				// }

				// MessageToast.show(sMsg);
			}
		},

		handleUploadPress: function(oEvent) {
			var oFileUploader = this.getView().byId("fileUploader");
			if (!oFileUploader.getValue()) {
				MessageToast.show("Choose a file first");
				return;
			}
			oFileUploader.upload();
		},

		handleTypeMissmatch: function(oEvent) {
			var aFileTypes = oEvent.getSource().getFileType();
			jQuery.each(aFileTypes, function(key, value) {
				aFileTypes[key] = "*." + value;
			});
			var sSupportedFileTypes = aFileTypes.join(", ");
			MessageToast.show("The file type *." + oEvent.getParameter("fileType") +
				" is not supported. Choose one of the following types: " +
				sSupportedFileTypes);
		},

		handleValueChange: function(oEvent) {
			MessageToast.show("Press 'Upload File' to upload file '" +
				oEvent.getParameter("newValue") + "'");
		}
	});

});