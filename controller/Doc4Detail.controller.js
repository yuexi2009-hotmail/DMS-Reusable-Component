sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/m/Menu",
  "sap/m/MenuItem"
], function (Controller, MessageToast, Menu, MenuItem) {
  "use strict";

  return Controller.extend("com.sap.demo.managespec.controller.Doc4Detail", {

    onInit: function () {
      // No route needed — this view is embedded statically in FCL midColumnPages
      // doc4 model is set on the component by Detail.controller before FCL expands
    },

    formatAttachmentIcon: function (sFileName) {
      if (!sFileName) { return "sap-icon://document"; }
      var sExt = sFileName.split(".").pop().toLowerCase();
      var mIcons = {
        "pdf":  "sap-icon://pdf-attachment",
        "xlsx": "sap-icon://excel-attachment",
        "xls":  "sap-icon://excel-attachment",
        "docx": "sap-icon://doc-attachment",
        "doc":  "sap-icon://doc-attachment",
        "pptx": "sap-icon://ppt-attachment",
        "ppt":  "sap-icon://ppt-attachment",
        "png":  "sap-icon://attachment-photo",
        "jpg":  "sap-icon://attachment-photo",
        "jpeg": "sap-icon://attachment-photo",
        "dwg":  "sap-icon://document",
        "txt":  "sap-icon://document-text"
      };
      return mIcons[sExt] || "sap-icon://document";
    },

    onClose: function () {
      var oAppController = this.getOwnerComponent().getRootControl().getController();
      if (oAppController && oAppController.setFCLLayout) {
        oAppController.setFCLLayout("OneColumn");
      }
    },

    onAttCreate:   function () { MessageToast.show("Create attachment"); },
    onAttEditLink: function () { MessageToast.show("Edit Link"); },
    onAttDownload: function () { MessageToast.show("Download"); },
    onAttDelete:   function () { MessageToast.show("Delete"); },
    onAttMove:     function () { MessageToast.show("Move"); },
    onAttCopy:     function () { MessageToast.show("Copy"); },

    onRowActionMenuPress: function (oEvent) {
      var oButton = oEvent.getSource();
      var oView = this.getView();

      if (!this._oRowActionMenu) {
        var oMenu = new Menu({
          itemSelected: function (oMenuEvent) {
            MessageToast.show(oMenuEvent.getParameter("item").getText());
          }
        });

        ["Properties", "Rename", "Share", "Preview"].forEach(function (sText) {
          oMenu.addItem(new MenuItem({ text: sText }));
        });

        oView.addDependent(oMenu);
        this._oRowActionMenu = oMenu;
      }

      this._oRowActionMenu.openBy(oButton);
    }

  });
});
