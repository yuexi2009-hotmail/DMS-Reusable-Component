sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/routing/History",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function (Controller, History, JSONModel, MessageToast) {
  "use strict";

  return Controller.extend("com.sap.demo.managespec.controller.App", {

    onInit: function () {
      var oViewModel = new JSONModel({ showNavButton: false, fclLayout: "OneColumn" });
      this.getView().setModel(oViewModel, "appView");

      this.getOwnerComponent().getRouter().attachRouteMatched(function (oEvent) {
        var sRouteName = oEvent.getParameter("name");
        oViewModel.setProperty("/showNavButton", sRouteName !== "main");
        // collapse midColumn when navigating away from detail
        if (sRouteName !== "detail") {
          oViewModel.setProperty("/fclLayout", "OneColumn");
        }
      });
    },

    setFCLLayout: function (sLayout) {
      this.getView().getModel("appView").setProperty("/fclLayout", sLayout);
    },

    onNavBack: function () {
      // if midColumn is open, close it first
      var sLayout = this.getView().getModel("appView").getProperty("/fclLayout");
      if (sLayout !== "OneColumn") {
        this.setFCLLayout("OneColumn");
        return;
      }
      var sPreviousHash = History.getInstance().getPreviousHash();
      if (sPreviousHash !== undefined) {
        window.history.go(-1);
      } else {
        this.getOwnerComponent().getRouter().navTo("main", {}, true);
      }
    },

    onHomePressed: function () {
      this.getOwnerComponent().getRouter().navTo("main", {}, true);
    },

    onAvatarPress: function () {
      MessageToast.show("User profile");
    }

  });
});
