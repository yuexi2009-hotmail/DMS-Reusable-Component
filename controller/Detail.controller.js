sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/m/MessagePopover",
  "sap/m/MessageItem",
  "sap/m/ActionSheet",
  "sap/m/Button"
], function (Controller, JSONModel, MessageToast, MessageBox, MessagePopover, MessageItem, ActionSheet, Button) {
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
          name: "100000002805",
          description: "Engineering Drawing Rev B",
          type: "DRW",
          part: "001",
          documentStatus: "Released",
          version: "02"
        }
      ];

      var oDetailModel = new JSONModel({
        number: oDoc.number,
        description: oDoc.description,
        type: oDoc.type,
        part: oDoc.part,
        documentStatus: oDoc.documentStatus,
        version: oDoc.version,
        s4Number: oDoc.documentStatus === "Released" ? (oDoc.s4Number || "") : "",
        s4Type:   oDoc.documentStatus === "Released" ? (oDoc.s4Type   || "") : "",
        s4Part:   oDoc.documentStatus === "Released" ? (oDoc.s4Part   || "") : "",
        owner: oDoc.owner || "IPD",
        s4SyncText: oDoc.s4SyncText || "Not Synced",
        s4SyncState: oDoc.s4SyncState || "None",
        s4SyncIcon: "",
        s4SyncErrorMsg: oDoc.s4SyncErrorMsg || "",
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
      oModel.setProperty("/s4SyncIcon", "");

      setTimeout(function () {
        var oDate = new Date();
        var sTimestamp = oDate.toLocaleString("en-US", {
          month: "short", day: "numeric", year: "numeric",
          hour: "numeric", minute: "2-digit", hour12: true
        });
        if (bSuccess) {
          oModel.setProperty("/s4SyncState", "Success");
          oModel.setProperty("/s4SyncText", "Synced successfully");
          oModel.setProperty("/s4SyncIcon", "");
        } else {
          oModel.setProperty("/s4SyncState", "Error");
          oModel.setProperty("/s4SyncText", "Sync failed");
          oModel.setProperty("/s4SyncIcon", "");
          oModel.setProperty("/s4SyncErrorMsg", "Connection to S4 timed out on " + sTimestamp + ". Please check your network and retry.");
        }
      }, 2000);
    },
    onMoreActionsPress: function () { MessageToast.show("More Actions"); },

    onSyncErrorInfoPress: function (oEvent) {
      var oModel = this.getView().getModel("detail");
      var sMsg = oModel.getProperty("/s4SyncErrorMsg") || "Sync failed. Please retry.";

      if (!this._oSyncErrorPopover) {
        this._oSyncErrorPopover = new MessagePopover({
          items: new MessageItem({ type: "Error", title: "Sync Failed", description: sMsg })
        });
        this.getView().addDependent(this._oSyncErrorPopover);
      } else {
        this._oSyncErrorPopover.destroyItems();
        this._oSyncErrorPopover.addItem(new MessageItem({ type: "Error", title: "Sync Failed", description: sMsg }));
      }

      this._oSyncErrorPopover.openBy(oEvent.getSource());
    },


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
    onAttRowMore: function (oEvent) {
      var oButton = oEvent.getSource();
      var oModel = this.getView().getModel("detail");
      var bIsS4 = oModel.getProperty("/owner") === "S4";

      if (this._oAttRowActionSheet) {
        this._oAttRowActionSheet.destroy();
        this._oAttRowActionSheet = null;
      }

      this._oAttRowActionSheet = new ActionSheet({
        buttons: [
          new Button({ text: "Properties", enabled: !bIsS4, press: function () { MessageToast.show("Properties"); } }),
          new Button({ text: "Rename",     enabled: !bIsS4, press: function () { MessageToast.show("Rename"); } }),
          new Button({ text: "Preview",    enabled: true,   press: function () { MessageToast.show("Preview"); } })
        ]
      });
      this.getView().addDependent(this._oAttRowActionSheet);
      this._oAttRowActionSheet.openBy(oButton);
    },

    onExtLinkAdd: function () { MessageToast.show("Add External Link"); },
    onExtLinkDelete: function () { MessageToast.show("Delete"); },
    onExtLinkRefresh: function () { MessageToast.show("Refreshed"); }

  });
});
