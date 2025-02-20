sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/library",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/Text",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageToast, MessageBox, mobileLibrary, Dialog, Button, Label, Text, Filter, FilterOperator) {
        "use strict";

        return Controller.extend("com.eren.tubeinout.controller.Main", {

            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */

            /**
             * Called when the worklist controller is instantiated.
             * @public
             */
            onInit: function () {
                this._getRouter().getRoute("RouteMain").attachPatternMatched(this._onObjectMatched, this);

            },
            /* =========================================================== */
            /* event handlers                                              */
            /* =========================================================== */

            //Address Control ZEWM_FM_ADRES_KONTROL
            onPressLgpla: async function () {
                let sLgpla = this.getView().getModel("viewModel").getProperty("/Lgpla"),
                    sLgnum = "ER01",
                    that=this,
                    oViewModel = this.getView().getModel("viewModel"),
                    sEntity = "/AddressControl",
                    oModel = this.getView().getModel("commonService"),
                    sMethod = "GET",
                    oURLParameters = {
                        Lgpla: sLgpla,
                        Lgnum: sLgnum
                    };
                oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);
                this._onCallFunction(sEntity, sMethod, oModel, oURLParameters)
                    .then((oData) => {
                        if (oData.Type === "E") {
                            MessageBox.error(oData.Message);
                        } else {
                            oViewModel.setProperty("/EvLgber", oData.EvLgber);
                            oViewModel.setProperty("/EvLgtyp", oData.EvLgtyp);
                            jQuery.sap.delayedCall(100, that, function () {
                                that.getView().byId("idMatnr").focus();
                            });
                        }


                    })
                    .catch(() => { })
                    .finally((oResponse) => {

                    });
            },
            onPressMatnr: async function (oEvent) {
                let sMatnr = this.getView().getModel("viewModel").getProperty("/Matnr"),
                    oViewModel = this.getView().getModel("viewModel"),
                    fnSuccess = (oData) => {
                        sap.ui.core.BusyIndicator.hide();
                        if (oData.EvMaktx) {
                            oViewModel.setProperty("/Maktx", oData.EvMaktx);
                            jQuery.sap.delayedCall(100, this, function () {
                                this.getView().byId("idBarcode").focus();
                            });
                        } else {
                            oViewModel.setProperty("/Matnr", "");
                            oViewModel.setProperty("/Maktx", "");
                        }
                    },
                    fnError = err => {
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.error(JSON.parse(err.responseText).error.message.value);
                        oViewModel.setProperty("/Matnr", "");
                        oViewModel.setProperty("/Maktx", "");
                    },
                    fnFinally = () => {
                        oViewModel.setProperty("/busy", false);
                    };
                await this._getMatnrDetail(sMatnr)
                    .then(fnSuccess)
                    .catch(fnError)
                    .finally(fnFinally);
            },
            onPressBarcode: async function (oEvent) {

                
                let oViewModel = this.getView().getModel("viewModel"),
                    sCharg = this.getView().byId("idBarcode").getValue();

                if(sCharg.trim().length === 0){
                    return;
                }

                sCharg = sCharg.toString().padStart(20, "0");;
                sCharg = sCharg.substr(sCharg.length - 10);
                sCharg = parseInt(sCharg).toString();
 
                let sDurum;
                oViewModel.setProperty("/Charg", sCharg),
                    sDurum = (this.getView().byId("idSwitchInOut").getState() === true) ? (sDurum = "G") : (sDurum = "C");
                let sMatnr = oViewModel.getProperty("/Matnr"),
                    sEntity = "/BarcodeQuery",
                    oModel = this.getView().getModel(),
                    sMethod = "GET",
                    oURLParameters = {
                        Charg: sCharg,
                        Durum: sDurum,
                        Matnr: sMatnr
                    };
                oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);
                this._onCallFunction(sEntity, sMethod, oModel, oURLParameters)
                    .then((oData) => {
                        if (oData.results.length > 0) {
                            MessageBox.error(oData.results[0].Message);
                        }
                        else {
                            this._addNewItem();
                        }

                    })
                    .catch(() => { })
                    .finally((oResponse) => {

                    });
            },
            onChangeSwitchInOut: async function (oEvent) {
                let sDurum;
                sDurum = (this.getView().byId("idSwitchInOut").getState() === true) ? (sDurum = "G") : (sDurum = "C");
                this._getData(sDurum);
                this.onClear(true, "Switch");
                
            },
            //Lgpla Search Help//

            handleValueHelpLgpla: async function (oEvent) {
                let oViewModel = this.getView().getModel("viewModel");

                this.getView()
                    .getModel("commonService")
                    .read("/LgplaSHSet", {
                        success: function (oData) {
                            oViewModel.setProperty("/LgplaList", oData.results);
                        },
                        error: function (oError) { },
                    });

                // create value help dialog
                if (!this._valueHelpDialogLgpla) {
                    this._valueHelpDialogLgpla = sap.ui.xmlfragment(
                        "com.eren.tubeinout.fragment.searchHelp.Lgpla",
                        this
                    );
                    this.getView().addDependent(this._valueHelpDialogLgpla);
                }

                //-------------------------------------------------------------//
                // open value help dialog filtered by the input value
                this._valueHelpDialogLgpla.open();
            },
            handleValueHelpSearchLgpla: function (oEvent) {
                let sValue = oEvent.getParameter("value"),
                    oFilter = new sap.ui.model.Filter({
                        filters: [
                            new sap.ui.model.Filter("Lgpla", sap.ui.model.FilterOperator.Contains, sValue)
                        ],
                        and: false
                    });
                oEvent.getSource().getBinding("items").filter(oFilter);
            },
            handleValueHelpCloseLgpla: function (oEvent) {
                let oViewModel = this.getView().getModel("viewModel");
                let oSelectedItem = oEvent.getParameter("selectedItem");
                if (oSelectedItem) {
                    oViewModel.setProperty("/Lgpla", oSelectedItem.getTitle());
                    jQuery.sap.delayedCall(100, this, function () {
                        this.getView().byId("idMatnr").focus();
                    });
                }
                oEvent.getSource().getBinding("items").filter([]);
            },
            //Lgpla Search Help//

            //Matnr Search Help//
            handleValueHelpMatnr: async function (oEvent) {

                // create value help dialog
                if (!this._valueHelpDialogMatnr) {
                    this._valueHelpDialogMatnr = sap.ui.xmlfragment(
                        "com.eren.tubeinout.fragment.searchHelp.Matnr",
                        this
                    );
                    this.getView().addDependent(this._valueHelpDialogMatnr);
                }

                //-------------------------------------------------------------//
                // open value help dialog filtered by the input value
                this._valueHelpDialogMatnr.open();
            },
            handleValueHelpSearchMatnr: function (oEvent) {
                let sValue = oEvent.getParameter("value"),
                    oFilter = new sap.ui.model.Filter({
                        filters: [
                            new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.Contains, sValue),
                            new sap.ui.model.Filter("Maktx", sap.ui.model.FilterOperator.Contains, sValue),
                        ],
                        and: false
                    });
                oEvent.getSource().getBinding("items").filter(oFilter);
            },
            handleValueHelpCloseMatnr: function (oEvent) {
                let oViewModel = this.getView().getModel("viewModel");
                let oSelectedItem = oEvent.getParameter("selectedItem");
                if (oSelectedItem) {
                    oViewModel.setProperty("/Matnr", oSelectedItem.getTitle());
                    oViewModel.setProperty("/Maktx", oSelectedItem.getDescription());
                    jQuery.sap.delayedCall(100, this, function () {
                        this.getView().byId("idBarcode").focus();
                    });
                }
                oEvent.getSource().getBinding("items").filter([]);
            },
            //Matnr Search Help//

            onPressDeleteItem: async function (oEvent) {

                let DialogType = mobileLibrary.DialogType,
                    ButtonType = mobileLibrary.ButtonType;

                let oSelectedItems = this.getView()
                    .byId("idTable")
                    .getSelectedItems().length;
                if (oSelectedItems !== 1) {
                    MessageBox.error(this._getResourceBundle().getText("errorItem"));
                    return;
                }


                if (!this.oApproveDialog) {
                    this.oApproveDialog = new Dialog({
                        type: DialogType.Message,
                        title: "Mesaj Kutusu",
                        content: new Text({
                            text: this._getResourceBundle().getText("deleteItemQues")
                        }),
                        beginButton: new Button({
                            type: ButtonType.Emphasized,
                            text: "Sil",
                            press: function () {
                                this._confirmDelete();
                                this.oApproveDialog.close();
                            }.bind(this),
                        }),
                        endButton: new Button({
                            text: "Geri",
                            press: function () {
                                this.oApproveDialog.close();
                            }.bind(this),
                        }),
                    });
                }

                this.oApproveDialog.open();

            },
            onSave: async function () {
                let sDurum;
                sDurum = (this.getView().byId("idSwitchInOut").getState() === true) ? (sDurum = "G") : (sDurum = "C");

                let oViewModel = this.getView().getModel("viewModel"),


                    sEntity = "/DataSave",
                    oModel = this.getView().getModel(),
                    sMethod = "POST",
                    oURLParameters = {
                        Durum: sDurum
                    };
                oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);
                this._onCallFunction(sEntity, sMethod, oModel, oURLParameters)
                    .then((oData) => {
                        this._getMaterialList();
                        this.getView().getModel().refresh(true);
                        this.onClear(false);
                    })
                    .catch(() => { })
                    .finally((oResponse) => {
                    });
            },
            onClear: async function (isBool, where) {

     
                let oViewModel = this.getView().getModel("viewModel");
                sap.ui.getCore().getMessageManager().removeAllMessages();

                       if (isBool === true) {
                 oViewModel.setProperty("/Lgpla", "");
                 oViewModel.setProperty("/Matnr", "");
                 oViewModel.setProperty("/Maktx", "");
            }
                
             
                oViewModel.setProperty("/Barcode", "");
               
                oViewModel.setProperty("/Charg", "");
                oViewModel.setProperty("/Charg", "");

                if(where === "Switch"){
                     jQuery.sap.delayedCall(500, this, function () {
                    this.getView().byId("idLgpla").focus();
                });
                }else{
                     jQuery.sap.delayedCall(500, this, function () {
                    this.getView().byId("idBarcode").focus();
                });
                }
                
               

            },

            /* =========================================================== */
            /* internal methods                                            */
            /* =========================================================== */
            _onObjectMatched: async function () {

                let sDurum;
                sDurum = (this.getView().byId("idSwitchInOut").getState() === true) ? (sDurum = "G") : (sDurum = "C");
                this._getMaterialSH();
                this._getData(sDurum);

            },
            _getMatnrDetail: async function (sMatnr) {
                let oModel = this.getView().getModel();
                sap.ui.core.BusyIndicator.show(0);
                return new Promise((fnResolve, fnReject) => {
                    let oParams = {
                        success: fnResolve,
                        error: fnReject
                    },
                        sPath = oModel.createKey("/MaterialSearchSet", {
                            Matnr: sMatnr
                        });
                    oModel.read(sPath, oParams);
                });
            },
            _addressControl: async function (sLgpla, sLgnum) {
                let oModel = this.getModel();
                sap.ui.core.BusyIndicator.show(0);
                return new Promise((fnResolve, fnReject) => {
                    let oParams = {
                        success: fnResolve,
                        error: fnReject
                    },
                        sPath = oModel.createKey("/EanCheckSet", {
                            IvEan: sMatnr
                        });
                    oModel.read(sPath, oParams);
                });
            },
            _getMaterials: async function () {
                let oModel = this.getView().getModel(),
                    sPath = "/MaterialSearchSet";

                return new Promise((fnResolve, fnReject) => {
                    let oParams = {
                        success: fnResolve,
                        error: fnReject
                    };
                    oModel.read(sPath, oParams);
                });
            },
            _addNewItem: async function () {
                let oViewModel = this.getView().getModel("viewModel"),
                    sCharg = oViewModel.getProperty("/Charg"),
                    sBarcode = oViewModel.getProperty("/Barcode"),
                    sLgpla = oViewModel.getProperty("/Lgpla");
                let sDurum;
                sDurum = (this.getView().byId("idSwitchInOut").getState() === true) ? (sDurum = "G") : (sDurum = "C");
                let sMatnr = oViewModel.getProperty("/Matnr"),
                    sEntity = "/TubeMaterialAdd",
                    oModel = this.getView().getModel(),
                    sMethod = "GET",
                    oURLParameters = {
                        Charg: sCharg,
                        Durum: sDurum,
                        Lgpla: sLgpla,
                        Matnr: sMatnr,
                        Barcode: sBarcode
                    };
                if (sMatnr) {
                    oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);
                    this._onCallFunction(sEntity, sMethod, oModel, oURLParameters)
                        .then((oData) => {
                            this.onClear(false);
                            if (oData.Type === "E") {
                                MessageBox.error(oData.Message);
                            }
                            else {
                                this._getMaterialList();
                            }
                        })
                        .catch(() => { })
                        .finally((oResponse) => {

                        });
                }
            },

            _getMaterialList: async function () {
                let oViewModel = this.getView().getModel("viewModel"),
                    fnSuccess = (oData) => {
                        sap.ui.core.BusyIndicator.hide();
                        if (oData.results.length > 0) {
                            oViewModel.setProperty("/Items", oData.results);
                        }
                        this.getView().getModel().refresh(true);
                    },
                    fnError = err => { },
                    fnFinally = () => { };

                await this._getMaterialListData()
                    .then(fnSuccess)
                    .catch(fnError)
                    .finally(fnFinally);
            },
            _getMaterialListData: async function () {
                let oModel = this.getView().getModel(),
                    sPath = "/MaterialsSet",
                    aFilters = [];
                let sDurum;
                sDurum = (this.getView().byId("idSwitchInOut").getState() === true) ? (sDurum = "G") : (sDurum = "C");
                aFilters.push(new sap.ui.model.Filter("Durum", sap.ui.model.FilterOperator.EQ, sDurum));

                return new Promise((fnResolve, fnReject) => {
                    let oParams = {
                        filters: aFilters,
                        success: fnResolve,
                        error: fnReject
                    };
                    oModel.read(sPath, oParams);
                });
            },
            _getMaterialSH: async function () {
                let oModel = this.getView().getModel();

                oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);

                let oViewModel = this.getView().getModel("viewModel"),
                    fnSuccess = (oData) => {
                        sap.ui.core.BusyIndicator.hide();
                        if (oData.results.length > 0) {
                            oViewModel.setProperty("/Materials", oData.results);
                        }
                    },
                    fnError = err => { },
                    fnFinally = () => { };

                await this._getMaterials()
                    .then(fnSuccess)
                    .catch(fnError)
                    .finally(fnFinally);
            },
            _confirmDelete: function () {

                let oModel = this.getView().getModel(),
                    oViewModel = this.getView().getModel("viewModel"),
                    sPath = this.getView()
                        .byId("idTable")
                        .getSelectedItem()
                        .getBindingContext().sPath;

                oModel.remove(sPath);
                this.getView().byId("idTable").removeSelections();
                oViewModel.setProperty("/DeleteEnabled", true);
                this.getView().getModel().refresh(true);
            },
            _getData: function (sStatus) {
                const aFilters = [
                    new Filter("Durum", FilterOperator.Contains, sStatus)
                ];
                this.byId("idTable").getBinding("items").filter(aFilters);
                jQuery.sap.delayedCall(500, this, function () {
                    this.getView().byId("idLgpla").focus();
                });
            },
            _onCallFunction: function (sEntity, sMethod, oModel, oURLParameters) {
                return new Promise((fnResolve, fnReject) => {
                    const mParameters = {
                        method: sMethod,
                        urlParameters: oURLParameters,
                        success: fnResolve,
                        error: fnReject
                    };

                    oModel.callFunction(sEntity, mParameters);
                });
            },
            _getResourceBundle: function () {
                return this.getOwnerComponent().getModel("i18n").getResourceBundle();
            },
            _getRouter: function () {
                return sap.ui.core.UIComponent.getRouterFor(this);
            }

        });
    });
