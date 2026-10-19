sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
  "use strict";

  return Controller.extend("com.sap.demo.managespec.controller.Detail", {

    onInit: function () {
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("detail").attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function (oEvent) {
      var sSpecId = oEvent.getParameter("arguments").specId;
      this._loadDetail(sSpecId);
    },

    _loadDetail: function (sSpecId) {
      var oAppModel = this.getOwnerComponent().getModel();
      var aDocuments = oAppModel.getProperty("/documents") || [];
      var oDoc = aDocuments.find(function (d) { return d.number === sSpecId; });

      if (!oDoc) {
        oDoc = { number: sSpecId, description: "–", type: "–", part: "–", documentStatus: "–", version: "–" };
      }

      var aAttachments = [
        {
          typeIcon: "sap-icon://attachment-photo",
          name: "Screenshot 2026-07-21 at 10.59.56.png",
          modifiedOn: "Aug 26, 2026",
          createdBy: "yue.xi01@sap.com",
          modifiedBy: "yue.xi01@sap.com",
          size: "36 KB"
        }
      ];

      var oDetailModel = new JSONModel({
        number: oDoc.number,
        description: oDoc.description,
        type: oDoc.type,
        part: oDoc.part,
        documentStatus: oDoc.documentStatus,
        version: oDoc.version,
        attachments: aAttachments
      });
      this.getView().setModel(oDetailModel, "detail");

      var oRootView = this.getOwnerComponent().getRootControl();
      var oAppView = oRootView.getModel("appView");
      if (oAppView) { oAppView.setProperty("/showNavButton", true); }
    },

    onTabSelect: function () {},

    onEditPress: function () { MessageToast.show("Edit"); },
    onDeletePress: function () { MessageToast.show("Delete"); },
    onChangeStatusPress: function () { MessageToast.show("Change Status"); },
    onNewVersionPress: function () { MessageToast.show("New Version"); },
    onMoreActionsPress: function () { MessageToast.show("More Actions"); },


    onAttachmentSelectionChange: function () {
      var oTable = this.byId("docAttachmentsTable");
      var bHas = oTable && oTable.getSelectedItems().length > 0;
      var oView = this.getView();
      ["attEditLinkBtn", "attDownloadBtn", "attDeleteBtn", "attManageBtn"].forEach(function (sId) {
        var oBtn = oView.byId(sId);
        if (oBtn) { oBtn.setEnabled(bHas); }
      });
    },

    onAttSearch: function () {},
    onAttEditLink: function () { MessageToast.show("Edit Link"); },
    onAttDownload: function () { MessageToast.show("Download"); },
    onAttDelete: function () { MessageToast.show("Delete"); },
    onAttCheckOut: function () { MessageToast.show("Check Out"); },
    onAttCheckIn: function () { MessageToast.show("Check In"); },
    onAttProperties: function () { MessageToast.show("Properties"); },
    onAttRefresh: function () { MessageToast.show("Refreshed"); },
    onAttRowMore: function () { MessageToast.show("More"); }

  });
});
