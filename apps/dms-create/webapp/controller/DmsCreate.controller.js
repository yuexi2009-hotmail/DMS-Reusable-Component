sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("com.sap.demo.dmscreate.controller.DmsCreate", {

        onInit: function () {
            var oViewModel = new JSONModel({
                docNumber: "",
                docType: "",
                docPart: "000",
                docDescription: "",
                adminCreatedBy: "",
                adminCreatedOn: "",
                adminChangedBy: "",
                adminChangedOn: "",
                linkedItems: [],
                translations: []
            });
            this.getView().setModel(oViewModel, "view");
        },

        onTypeValueHelp: function () {
            MessageToast.show("Value help for Document Type");
        },

        onCreate: function () {
            var oView = this.getView();
            var oModel = oView.getModel("view");

            var sNumber = oModel.getProperty("/docNumber");
            var sType = oModel.getProperty("/docType");
            var sDescription = oModel.getProperty("/docDescription");

            // Validate required fields
            var bValid = true;
            var oInput;

            oInput = oView.byId("inputNumber");
            if (!sNumber) {
                oInput.setValueState("Error");
                oInput.setValueStateText("Number is required");
                bValid = false;
            } else {
                oInput.setValueState("None");
            }

            oInput = oView.byId("inputType");
            if (!sType) {
                oInput.setValueState("Error");
                oInput.setValueStateText("Type is required");
                bValid = false;
            } else {
                oInput.setValueState("None");
            }

            oInput = oView.byId("inputDescription");
            if (!sDescription) {
                oInput.setValueState("Error");
                oInput.setValueStateText("Description is required");
                bValid = false;
            } else {
                oInput.setValueState("None");
            }

            if (!bValid) {
                return;
            }

            // Notify the opener tab and close
            var oPayload = {
                action: "documentCreated",
                document: {
                    number: sNumber,
                    type: sType,
                    part: oModel.getProperty("/docPart"),
                    description: sDescription
                }
            };

            if (window.opener) {
                window.opener.postMessage(oPayload, "*");
            }

            MessageToast.show("Document created successfully");

            setTimeout(function () {
                window.close();
            }, 1200);
        },

        onDiscardDraft: function () {
            MessageBox.confirm(
                "Discard the draft and close this page?",
                {
                    title: "Discard Draft",
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            window.close();
                        }
                    }
                }
            );
        }
    });
});
