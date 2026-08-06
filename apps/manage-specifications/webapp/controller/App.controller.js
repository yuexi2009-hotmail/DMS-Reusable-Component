sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (Controller) {
  "use strict";

  return Controller.extend("com.sap.demo.managespec.controller.App", {

    onInit: function () {},

    onNavBack: function () {
      this.getOwnerComponent().getRouter().navTo("main", {}, true);
    }

  });
});
