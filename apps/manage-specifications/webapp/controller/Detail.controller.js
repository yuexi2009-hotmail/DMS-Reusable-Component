sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
  "use strict";

  return Controller.extend("com.sap.demo.managespec.controller.Detail", {

    onInit: function () {
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("detail").attachPatternMatched(this._onRouteMatched, this);
    },

    onTabSelect: function () {
      setTimeout(function () {
        var aContents = document.querySelectorAll(".detailPage .sapMITBContent, .detailPage .sapMITBContainerContent");
        aContents.forEach(function (el) {
          el.style.background = "var(--sapBackgroundColor, #ffffff)";
          el.style.padding = "0";
        });
      }, 0);
    },

    _onRouteMatched: function (oEvent) {
      var sSpecId = oEvent.getParameter("arguments").specId;
      this._loadDetail(sSpecId);
      this._fixObjectPageScroll();
    },

    _fixObjectPageScroll: function () {
      var oOPL = this.getView().byId("generalObjectPage");
      if (!oOPL) { return; }

      // Patch _adjustHeaderHeights to always report 0 header height
      // so ObjectPage never sets a non-zero padding-top on the scroll container
      if (!oOPL.__headerHeightPatched) {
        var fnOrig = oOPL._adjustHeaderHeights && oOPL._adjustHeaderHeights.bind(oOPL);
        if (fnOrig) {
          oOPL._adjustHeaderHeights = function () {
            fnOrig();
            var oDom = oOPL.getDomRef();
            if (oDom) {
              var oScroll = oDom.querySelector(".sapUxAPObjectPageScroll");
              if (oScroll) { oScroll.style.paddingTop = "0px"; }
            }
          };
        }
        oOPL.__headerHeightPatched = true;
      }
    },

    _loadDetail: function (sSpecId) {
      var oAppModel = this.getOwnerComponent().getModel();
      var aSpecs = oAppModel.getProperty("/specifications");
      var oSpec = aSpecs.find(function (s) { return s.id === sSpecId; });
      if (!oSpec) { return; }

      var oDetailModel = new JSONModel({
        id: oSpec.id,
        name: oSpec.name,
        technicalName: oSpec.technicalName,
        version: oSpec.version,
        statusText: oSpec.statusText,
        statusState: oSpec.statusState,
        statusIcon: oSpec.statusIcon,
        specType: oSpec.specType,
        productCategory: oSpec.productCategory || "–",
        otherVersions: [],
        collaborations: [],
        documents: [
          { name: "ObjectLinks-Overview-April2026.pptx", modifiedOn: "Aug 6, 2026", createdBy: "yue.xi01@sap.com", modifiedBy: "yue.xi01@sap.com", size: "1.21 MB" }
        ]
      });
      this.getView().setModel(oDetailModel, "detail");

      var oRootView = this.getOwnerComponent().getRootControl();
      var oShellBar = oRootView.byId("appShellBar");
      if (oShellBar) { oShellBar.setTitle("Manage Specifications"); }

      var oAppView = oRootView.getModel("appView");
      if (oAppView) { oAppView.setProperty("/showNavButton", true); }
    }

  });
});
