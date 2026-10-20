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

      var aExternalLinks = [
        {
          name: "SAP Help Portal",
          description: "Document Management Service guide",
          createdOn: "Sep 12, 2026",
          createdBy: "yue.xi01@sap.com",
          changedOn: "Sep 15, 2026"
        },
        {
          name: "ECR #4521",
          description: "Engineering Change Request for part revision",
          createdOn: "Oct 1, 2026",
          createdBy: "admin@sap.com",
          changedOn: "Oct 3, 2026"
        }
      ];

      var oDetailModel = new JSONModel({
        number: oDoc.number,
        description: oDoc.description,
        type: oDoc.type,
        part: oDoc.part,
        documentStatus: oDoc.documentStatus,
        version: oDoc.version,
        s4Number: oDoc.s4Number || "–",
        s4Type: oDoc.s4Type || "–",
        owner: oDoc.owner || "IPD",
        s4SyncText: oDoc.s4SyncText || "Not Synced",
        s4SyncState: oDoc.s4SyncState || "None",
        s4SyncIcon: "",
        attachments: aAttachments,
        externalLinks: aExternalLinks,
        attHasSelection: false
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
    onSyncWithS4Press: function () {
      var oModel = this.getView().getModel("detail");
      var sStatus = oModel.getProperty("/documentStatus");

      if (sStatus !== "Released") {
        MessageBox.error(
          "Only Released documents can be synced with S4.\nThe current document has status \"" + sStatus + "\".",
          { title: "Cannot Sync with S4" }
        );
        return;
      }

      // Alternate: first call success, second call failure
      this._syncAttempt = (this._syncAttempt || 0) + 1;
      var bSuccess = (this._syncAttempt % 2 === 1);

      oModel.setProperty("/s4SyncState", "Warning");
      oModel.setProperty("/s4SyncText", "Syncing in progress...");
      oModel.setProperty("/s4SyncIcon", "sap-icon://synchronize");

      setTimeout(function () {
        var oDate = new Date();
        var sTimestamp = oDate.toLocaleString("en-US", {
          month: "short", day: "numeric", year: "numeric",
          hour: "numeric", minute: "2-digit", hour12: true
        });
        if (bSuccess) {
          oModel.setProperty("/s4SyncState", "Success");
          oModel.setProperty("/s4SyncText", "Synced on " + sTimestamp);
          oModel.setProperty("/s4SyncIcon", "");
        } else {
          oModel.setProperty("/s4SyncState", "Error");
          oModel.setProperty("/s4SyncText", "Sync failed on " + sTimestamp + ", please retry");
          oModel.setProperty("/s4SyncIcon", "");
        }
      }, 2000);
    },
    onMoreActionsPress: function () { MessageToast.show("More Actions"); },


    onAttachmentSelectionChange: function () {
      var oTable = this.byId("docAttachmentsTable");
      var bHas = oTable && oTable.getSelectedItems().length > 0;
      this.getView().getModel("detail").setProperty("/attHasSelection", bHas);
    },

    onAttSearch: function () {},
    onAttEditLink: function () { MessageToast.show("Edit Link"); },
    onAttDownload: function () { MessageToast.show("Download"); },
    onAttDelete: function () { MessageToast.show("Delete"); },
    onAttCheckOut: function () { MessageToast.show("Check Out"); },
    onAttCheckIn: function () { MessageToast.show("Check In"); },
    onAttProperties: function () { MessageToast.show("Properties"); },
    onAttRefresh: function () { MessageToast.show("Refreshed"); },
    onAttRowMore: function () { MessageToast.show("More"); },

    onExtLinkAdd: function () { MessageToast.show("Add External Link"); },
    onExtLinkDelete: function () { MessageToast.show("Delete"); },
    onExtLinkRefresh: function () { MessageToast.show("Refreshed"); }

  });
});
