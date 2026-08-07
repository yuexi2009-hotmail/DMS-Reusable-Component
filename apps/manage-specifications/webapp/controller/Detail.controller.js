sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
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

    onDocumentNavigate: function () {
      MessageToast.show("Navigate to document");
    },

    onDocTreeToggle: function () {
      var oTable = this.getView().byId("documentsTreeTable");
      if (!oTable) { return; }
      setTimeout(function () {
        var oBinding = oTable.getBinding("rows");
        if (oBinding) {
          oTable.setVisibleRowCount(oBinding.getLength());
        }
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
          {
            docNumber: "100000003683", description: "ObjectLinks-Overview-April2026.pptx", docDescription: "Overview of object links for April 2026 release", type: "NEW", part: "Main", version: "1.0", isParent: true,
            children: [
              { docNumber: "100000003684", description: "Appendix-A.pdf", type: "PDF", part: "Appendix", version: "1.0" },
              { docNumber: "100000003685", description: "Appendix-B.xlsx", type: "XLSX", part: "Appendix", version: "1.1" }
            ]
          },
          {
            docNumber: "100000003690", description: "Technical-Specification-v2.pdf", docDescription: "Technical specification document version 2", type: "IMU", part: "Spec", version: "2.0", isParent: true,
            children: [
              { docNumber: "100000003691", description: "Drawing-Front.dwg", type: "DWG", part: "Design", version: "1.0" },
              { docNumber: "100000003692", description: "Drawing-Side.dwg", type: "DWG", part: "Design", version: "1.2" },
              { docNumber: "100000003693", description: "BOM-List.xlsx", type: "XLSX", part: "BOM", version: "3.1" }
            ]
          },
          {
            docNumber: "100000003700", description: "Compliance-Report-2026.docx", docDescription: "Annual compliance report for 2026", type: "TES", part: "Compliance", version: "1.0", isParent: true,
            children: [
              { docNumber: "100000003701", description: "Test-Results.pdf", type: "PDF", part: "Testing", version: "1.0" }
            ]
          },
          {
            docNumber: "100000003710", description: "User-Manual-EN.pdf", docDescription: "English user manual for end users", type: "DRW", part: "Manual", version: "4.2", isParent: true,
            children: []
          }
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
