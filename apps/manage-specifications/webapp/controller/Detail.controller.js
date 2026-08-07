sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageToast, MessageBox, Fragment) {
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

    _cascadeSelection: function (sTableId) {
      var oTable = this.getView().byId(sTableId);
      if (!oTable) { return; }
      var oBinding = oTable.getBinding("rows");
      if (!oBinding) { return; }
      var iTotal = oBinding.getLength();

      // Build a snapshot: for each index, get isParent + selected state
      var aRows = [];
      for (var i = 0; i < iTotal; i++) {
        var oCtx = oBinding.getContextByIndex(i);
        var oObj = oCtx ? oCtx.getObject() : null;
        aRows.push({ index: i, isParent: !!(oObj && oObj.isParent), selected: oTable.isIndexSelected(i) });
      }

      // For each parent, cascade selection to its children
      for (var p = 0; p < aRows.length; p++) {
        if (!aRows[p].isParent) { continue; }
        var parentSelected = aRows[p].selected;
        for (var c = p + 1; c < aRows.length; c++) {
          if (aRows[c].isParent) { break; } // next parent — stop
          if (parentSelected) {
            oTable.addSelectionInterval(aRows[c].index, aRows[c].index);
          } else {
            oTable.removeSelectionInterval(aRows[c].index, aRows[c].index);
          }
        }
      }
    },

    _updateUnlinkBtn: function (sTableId, sBtnId) {
      var oTable = this.getView().byId(sTableId);
      var oBtn = this.getView().byId(sBtnId);
      if (!oTable || !oBtn) { return; }
      var aSelected = oTable.getSelectedIndices();
      oBtn.setEnabled(aSelected.length > 0);
    },

    onDocSelectionChange: function (oEvent) {
      var oTable = this.getView().byId("documentsTreeTable");
      this._expandAndCascade(oTable, oEvent, "documentsTreeTable", "unlinkBtn");
    },

    onDocSelectionChange1: function (oEvent) {
      var oTable = this.getView().byId("documentsTreeTable1");
      this._expandAndCascade(oTable, oEvent, "documentsTreeTable1", "unlinkBtn1");
    },

    onDocSelectionChange2: function (oEvent) {
      var oTable = this.getView().byId("documentsTreeTable2");
      this._expandAndCascade(oTable, oEvent, "documentsTreeTable2", "unlinkBtn2");
    },

    onLinkDocSelectionChange: function (oEvent) {
      var oTable = this.getView().byId("linkDocResultTable");
      this._expandAndCascade(oTable, oEvent, null, null);
    },

    _expandAndCascade: function (oTable, oEvent, sTableId, sBtnId) {
      if (!oTable) { return; }
      var oBinding = oTable.getBinding("rows");
      if (!oBinding) { return; }

      var oView = this.getView();
      var iRow = oEvent.getParameter("rowIndex");
      var oCtx = (iRow >= 0) ? oBinding.getContextByIndex(iRow) : null;
      var oObj = oCtx ? oCtx.getObject() : null;
      var isParentRow = !!(oObj && oObj.isParent);
      var isSelected = (iRow >= 0) && oTable.isIndexSelected(iRow);

      // Only expand+cascade when a parent row is clicked
      if (isParentRow && isSelected) {
        try { oBinding.expand(iRow); } catch (e) {}
      }

      setTimeout(function () {
        var iNewTotal = oBinding.getLength();
        oTable.setVisibleRowCount(iNewTotal);

        // Cascade only from the clicked parent row to its immediate children
        if (isParentRow && iRow >= 0) {
          for (var c = iRow + 1; c < iNewTotal; c++) {
            var cCtx = oBinding.getContextByIndex(c);
            var cObj = cCtx ? cCtx.getObject() : null;
            if (!cObj || cObj.isParent) { break; }
            if (isSelected) {
              oTable.addSelectionInterval(c, c);
            } else {
              oTable.removeSelectionInterval(c, c);
            }
          }
        }

        // Update unlink button
        if (sTableId && sBtnId) {
          var oBtn = oView.byId(sBtnId);
          if (!oBtn) { return; }
          var aSelected = oTable.getSelectedIndices();
          oBtn.setEnabled(aSelected.length > 0);
        }
      }, 50);
    },

    onUnlinkDocument: function (oEvent) {
      var oView = this.getView();
      var oSource = oEvent.getSource();
      var sSourceId = oSource.getId();
      var sTableId, sBtnId;
      if (sSourceId.indexOf("unlinkBtn1") !== -1) {
        sTableId = "documentsTreeTable1"; sBtnId = "unlinkBtn1";
      } else if (sSourceId.indexOf("unlinkBtn2") !== -1) {
        sTableId = "documentsTreeTable2"; sBtnId = "unlinkBtn2";
      } else {
        sTableId = "documentsTreeTable"; sBtnId = "unlinkBtn";
      }

      var oTable = oView.byId(sTableId);
      var aSelected = oTable ? oTable.getSelectedIndices() : [];
      var oBinding = oTable && oTable.getBinding("rows");
      var aDocs = oView.getModel("detail") ? (oView.getModel("detail").getProperty("/documents") || []) : [];
      var aDocNumbers = [];
      aSelected.forEach(function (i) {
        var oCtx = oBinding && oBinding.getContextByIndex(i);
        var oDoc = oCtx && oCtx.getObject();
        if (!oDoc) { return; }
        if (oDoc.isParent) {
          if (aDocNumbers.indexOf(oDoc.docNumber) === -1) { aDocNumbers.push(oDoc.docNumber); }
        } else {
          // Child row — find its parent
          aDocs.forEach(function (oParent) {
            if (oParent.children && oParent.children.some(function (c) { return c.docNumber === oDoc.docNumber; })) {
              if (aDocNumbers.indexOf(oParent.docNumber) === -1) { aDocNumbers.push(oParent.docNumber); }
            }
          });
        }
      });
      if (!aDocNumbers.length) { return; }

      var that = this;
      var oDialog = new sap.m.Dialog({
        title: "Unlink",
        type: "Message",
        state: "Warning",
        contentWidth: "auto",
        content: new sap.m.Text({ text: "Unlinking removes the document from your current list, but it will remain saved in the system." }),
        beginButton: new sap.m.Button({
          text: "Unlink",
          type: "Emphasized",
          width: "auto",
          press: function () {
            oDialog.close();
            var oDetailModel = oView.getModel("detail");
            var aDocs = oDetailModel.getProperty("/documents") || [];
            aDocs = aDocs.filter(function (d) { return aDocNumbers.indexOf(d.docNumber) === -1; });
            oDetailModel.setProperty("/documents", aDocs);
            setTimeout(function () {
              ["documentsTreeTable", "documentsTreeTable1", "documentsTreeTable2"].forEach(function (sId) {
                var oT = oView.byId(sId);
                if (!oT) { return; }
                oT.clearSelection();
                var oB = oT.getBinding("rows");
                if (oB) { oT.setVisibleRowCount(oB.getLength()); }
              });
              ["unlinkBtn", "unlinkBtn1", "unlinkBtn2"].forEach(function (sId) {
                var oB = oView.byId(sId);
                if (oB) { oB.setEnabled(false); }
              });
            }, 0);
            MessageToast.show(aDocNumbers.length + " document(s) unlinked");
          }
        }),
        endButton: new sap.m.Button({
          text: "Cancel",
          width: "auto",
          press: function () { oDialog.close(); }
        }),
        afterClose: function () { oDialog.destroy(); }
      });
      oDialog.addStyleClass("sapUiSizeCompact unlinkDialog");
      oView.addDependent(oDialog);
      oDialog.open();
    },

    onLinkExistingDocument: function () {
      var oView = this.getView();
      if (!this._oLinkDocDialog) {
        this._oLinkDocDialog = Fragment.load({
          id: oView.getId(),
          name: "com.sap.demo.managespec.view.LinkDocumentDialog",
          controller: this
        }).then(function (oDialog) {
          oView.addDependent(oDialog);
          var oLinkDocModel = new JSONModel({
            documents: [
              {
                docNumber: "200000001001", description: "Safety-Standards-2026.pdf", docDescription: "Global safety standards for 2026", type: "DFT", part: "Safety", version: "1.0", isParent: true,
                children: [
                  { docNumber: "200000001002", description: "Annex-I.pdf", type: "PDF", part: "Annex", version: "1.0", modifiedOn: "Jul 10, 2026", createdBy: "anna.schmidt@sap.com" },
                  { docNumber: "200000001003", description: "Annex-II.pdf", type: "PDF", part: "Annex", version: "1.1", modifiedOn: "Jul 15, 2026", createdBy: "anna.schmidt@sap.com" }
                ]
              },
              {
                docNumber: "200000001010", description: "Material-Spec-Sheet.xlsx", docDescription: "Material specification sheet", type: "WIN", part: "Material", version: "2.0", isParent: true,
                children: [
                  { docNumber: "200000001011", description: "Raw-Material-A.xlsx", type: "XLSX", part: "Raw", version: "1.0", modifiedOn: "Jun 20, 2026", createdBy: "max.mueller@sap.com" }
                ]
              },
              {
                docNumber: "200000001020", description: "Change-Request-CR042.docx", docDescription: "Change request CR-042 documentation", type: "IMU", part: "CR", version: "3.1", isParent: true,
                children: []
              },
              {
                docNumber: "200000001030", description: "Validation-Protocol-VP7.pdf", docDescription: "Validation protocol VP-7", type: "TES", part: "Validation", version: "1.2", isParent: true,
                children: [
                  { docNumber: "200000001031", description: "Test-Plan-VP7.pdf", type: "PDF", part: "Test", version: "1.0", modifiedOn: "Aug 2, 2026", createdBy: "yue.xi01@sap.com" },
                  { docNumber: "200000001032", description: "Results-VP7.xlsx", type: "XLSX", part: "Results", version: "2.0", modifiedOn: "Aug 4, 2026", createdBy: "yue.xi01@sap.com" }
                ]
              }
            ]
          });
          oDialog.setModel(oLinkDocModel, "linkDoc");
          return oDialog;
        });
      }
      this._oLinkDocDialog.then(function (oDialog) {
        oDialog.open();
      });
    },

    onLinkDocSearch: function () {
      MessageToast.show("Search triggered");
    },

    onLinkDocTreeToggle: function () {
      var oTable = this.getView().byId("linkDocResultTable");
      if (!oTable) { return; }
      setTimeout(function () {
        var oBinding = oTable.getBinding("rows");
        if (oBinding) { oTable.setVisibleRowCount(oBinding.getLength()); }
      }, 0);
    },

    onLinkDocShowFilters: function () {
      MessageToast.show("Show Filters");
    },

    onLinkDocConfirm: function () {
      var oView = this.getView();
      var oTable = oView.byId("linkDocResultTable");
      if (!oTable) {
        this._oLinkDocDialog.then(function (oDialog) { oDialog.close(); });
        return;
      }

      // Get selected indices and find their parent docs with full children intact
      var oBinding = oTable.getBinding("rows");
      var aSelectedIndices = oTable.getSelectedIndices();
      var aNewDocs = [];
      var aSeenNumbers = [];

      aSelectedIndices.forEach(function (iIndex) {
        var oCtx = oBinding.getContextByIndex(iIndex);
        if (!oCtx) { return; }
        var oDoc = oCtx.getObject();
        if (!oDoc) { return; }

        // Walk up to find the parent doc from the linkDoc model
        var oLinkDocModel = oView.byId("linkDocResultTable").getModel("linkDoc");
        var aAllDocs = oLinkDocModel ? oLinkDocModel.getProperty("/documents") : [];

        if (oDoc.isParent) {
          // Directly a parent — add with its children
          if (aSeenNumbers.indexOf(oDoc.docNumber) === -1) {
            aSeenNumbers.push(oDoc.docNumber);
            aNewDocs.push(JSON.parse(JSON.stringify(oDoc)));
          }
        } else {
          // Child row — find its parent and add the whole parent+children
          aAllDocs.forEach(function (oParent) {
            if (oParent.children && oParent.children.some(function (c) { return c.docNumber === oDoc.docNumber; })) {
              if (aSeenNumbers.indexOf(oParent.docNumber) === -1) {
                aSeenNumbers.push(oParent.docNumber);
                aNewDocs.push(JSON.parse(JSON.stringify(oParent)));
              }
            }
          });
        }
      });

      if (aNewDocs.length > 0) {
        var oDetailModel = oView.getModel("detail");
        var aDocs = oDetailModel.getProperty("/documents") || [];
        oDetailModel.setProperty("/documents", aDocs.concat(aNewDocs));

        setTimeout(function () {
          ["documentsTreeTable", "documentsTreeTable1", "documentsTreeTable2"].forEach(function (sId) {
            var oT = oView.byId(sId);
            if (!oT) { return; }
            var oB = oT.getBinding("rows");
            if (oB) { oT.setVisibleRowCount(oB.getLength()); }
          });
        }, 0);

        MessageToast.show(aNewDocs.length + " document(s) linked");
      }

      this._oLinkDocDialog.then(function (oDialog) { oDialog.close(); });
    },

    onLinkDocCancel: function () {
      this._oLinkDocDialog.then(function (oDialog) { oDialog.close(); });
    },

    onDocTreeToggle: function () {
      var oTable = this.getView().byId("documentsTreeTable");
      if (!oTable) { return; }
      setTimeout(function () {
        var oBinding = oTable.getBinding("rows");
        if (oBinding) { oTable.setVisibleRowCount(oBinding.getLength()); }
      }, 0);
    },

    onDocTreeToggle1: function () {
      var oTable = this.getView().byId("documentsTreeTable1");
      if (!oTable) { return; }
      setTimeout(function () {
        var oBinding = oTable.getBinding("rows");
        if (oBinding) { oTable.setVisibleRowCount(oBinding.getLength()); }
      }, 0);
    },

    onDocTreeToggle2: function () {
      var oTable = this.getView().byId("documentsTreeTable2");
      if (!oTable) { return; }
      setTimeout(function () {
        var oBinding = oTable.getBinding("rows");
        if (oBinding) { oTable.setVisibleRowCount(oBinding.getLength()); }
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
              { docNumber: "100000003684", description: "Appendix-A.pdf", type: "PDF", part: "Appendix", version: "1.0", modifiedOn: "Aug 6, 2026", createdBy: "yue.xi01@sap.com" },
              { docNumber: "100000003685", description: "Appendix-B.xlsx", type: "XLSX", part: "Appendix", version: "1.1", modifiedOn: "Jul 12, 2026", createdBy: "yue.xi01@sap.com" }
            ]
          },
          {
            docNumber: "100000003690", description: "Technical-Specification-v2.pdf", docDescription: "Technical specification document version 2", type: "IMU", part: "Spec", version: "2.0", isParent: true,
            children: [
              { docNumber: "100000003691", description: "Drawing-Front.dwg", type: "DWG", part: "Design", version: "1.0", modifiedOn: "Aug 1, 2026", createdBy: "max.mueller@sap.com" },
              { docNumber: "100000003692", description: "Drawing-Side.dwg", type: "DWG", part: "Design", version: "1.2", modifiedOn: "Aug 3, 2026", createdBy: "max.mueller@sap.com" },
              { docNumber: "100000003693", description: "BOM-List.xlsx", type: "XLSX", part: "BOM", version: "3.1", modifiedOn: "Jul 28, 2026", createdBy: "yue.xi01@sap.com" }
            ]
          },
          {
            docNumber: "100000003700", description: "Compliance-Report-2026.docx", docDescription: "Annual compliance report for 2026", type: "TES", part: "Compliance", version: "1.0", isParent: true,
            children: [
              { docNumber: "100000003701", description: "Test-Results.pdf", type: "PDF", part: "Testing", version: "1.0", modifiedOn: "Aug 5, 2026", createdBy: "anna.schmidt@sap.com" }
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
