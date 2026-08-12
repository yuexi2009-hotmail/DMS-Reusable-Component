sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/ui/core/Fragment",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (Controller, JSONModel, MessageToast, MessageBox, Fragment, Filter, FilterOperator) {
  "use strict";

  return Controller.extend("com.sap.demo.managespec.controller.Detail", {

    onInit: function () {
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("detail").attachPatternMatched(this._onRouteMatched, this);
      this._observeFacetFilterDialogs();
    },

    _observeFacetFilterDialogs: function () {
      var oStatic = document.getElementById("sap-ui-static");
      if (!oStatic) { return; }
      var oObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          m.addedNodes.forEach(function (node) {
            if (node.nodeType !== 1) { return; }
            // FacetFilter dialogs contain sapMFFLI items or sapMFFDialog-inner
            if (node.classList && (node.classList.contains("sapMDialog") || node.classList.contains("sapMPopup-CTX"))) {
              // small delay to let SAP finish rendering
              setTimeout(function () {
                if (node.querySelector(".sapMFFLI, .sapMFFPFLI, .sapMListTbl")) {
                  node.classList.add("docFacetFilterDialog");
                }
              }, 0);
            }
          });
        });
      });
      oObserver.observe(oStatic, { childList: true });
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
                docNumber: "200000001001", description: "Safety-Standards-2026.pdf", docDescription: "Global safety standards for 2026", type: "DFT", part: "000", version: "01", status: "New", isParent: true,
                children: [
                  { docNumber: "200000001002", description: "Annex-I.pdf", type: "PDF", part: "000", version: "01", modifiedOn: "Jul 10, 2026", createdBy: "anna.schmidt@sap.com" },
                  { docNumber: "200000001003", description: "Annex-II.pdf", type: "PDF", part: "000", version: "02", modifiedOn: "Jul 15, 2026", createdBy: "anna.schmidt@sap.com" }
                ]
              },
              {
                docNumber: "200000001010", description: "Material-Spec-Sheet.xlsx", docDescription: "Material specification sheet", type: "WIN", part: "000", version: "02", status: "Created", isParent: true,
                children: [
                  { docNumber: "200000001011", description: "Raw-Material-A.xlsx", type: "XLSX", part: "000", version: "01", modifiedOn: "Jun 20, 2026", createdBy: "max.mueller@sap.com" }
                ]
              },
              {
                docNumber: "200000001020", description: "Change-Request-CR042.docx", docDescription: "Change request CR-042 documentation", type: "IMU", part: "000", version: "03", status: "Update", isParent: true,
                children: []
              },
              {
                docNumber: "200000001030", description: "Validation-Protocol-VP7.pdf", docDescription: "Validation protocol VP-7", type: "TES", part: "000", version: "01", status: "In Work", isParent: true,
                children: [
                  { docNumber: "200000001031", description: "Test-Plan-VP7.pdf", type: "PDF", part: "000", version: "01", modifiedOn: "Aug 2, 2026", createdBy: "yue.xi01@sap.com" },
                  { docNumber: "200000001032", description: "Results-VP7.xlsx", type: "XLSX", part: "000", version: "02", modifiedOn: "Aug 4, 2026", createdBy: "yue.xi01@sap.com" }
                ]
              }
            ]
          });
          oDialog.setModel(oLinkDocModel, "linkDoc");
          return oDialog;
        });
      }
      var oView = this.getView();
      this._oLinkDocDialog.then(function (oDialog) {
        oDialog.open();
        setTimeout(function () {
          var oTable = oView.byId("linkDocResultTable");
          if (!oTable) { return; }
          oTable.expandToLevel(1);
          var oBinding = oTable.getBinding("rows");
          if (oBinding) { oTable.setVisibleRowCount(oBinding.getLength()); }
        }, 100);
      });
    },

    onDocFilterDialogConfirm: function (oEvent) {
      var oFacetFilter = oEvent.getSource();
      var oDetailModel = this.getView().getModel("detail");
      if (!oDetailModel.getProperty("/documentsAll")) {
        oDetailModel.setProperty("/documentsAll", (oDetailModel.getProperty("/documents") || []).slice());
      }
      var oFilters = {};
      oFacetFilter.getLists().forEach(function (oList) {
        var aSelected = oList.getSelectedItems();
        if (aSelected.length > 0) {
          oFilters[oList.getKey()] = aSelected.map(function (i) { return i.getKey(); });
        }
      });
      var aSource = oDetailModel.getProperty("/documentsAll");
      var aFiltered = aSource.filter(function (oDoc) {
        if (!oDoc.isParent) { return true; }
        var typeMatch = !oFilters.type || oFilters.type.indexOf(oDoc.type) !== -1;
        var statusMatch = !oFilters.status || oFilters.status.indexOf(oDoc.status) !== -1;
        return typeMatch && statusMatch;
      });
      oDetailModel.setProperty("/documents", aFiltered);
    },

    onDocFilterDialogReset: function () {
      var oDetailModel = this.getView().getModel("detail");
      var aAll = oDetailModel.getProperty("/documentsAll");
      if (aAll) {
        oDetailModel.setProperty("/documents", aAll.slice());
        oDetailModel.setProperty("/documentsAll", null);
      }
    },

    onDoc3SelectionChange: function (oEvent) {
      var oTable = this.getView().byId("documentsTable3");
      var bHasSelection = oTable && oTable.getSelectedItems().length > 0;
      var oBtn = this.getView().byId("unlinkBtn3");
      if (oBtn) { oBtn.setEnabled(bHasSelection); }
    },

    formatShowAllVisible: function (bShowAll, aAttachments) {
      return Array.isArray(aAttachments) && aAttachments.length > 10;
    },

    formatShowAllText: function (bShowAll) {
      return bShowAll ? "Show less" : "Show all";
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
        "dwg":  "sap-icon://drawing",
        "txt":  "sap-icon://document-text"
      };
      return mIcons[sExt] || "sap-icon://document";
    },

    onDoc3ShowAll: function (oEvent) {
      var oLink = oEvent.getSource();
      var oCtx = oLink.getBindingContext("detail");
      if (!oCtx) { return; }
      var bCurrentlyExpanded = oCtx.getProperty("showAll");
      oCtx.getModel().setProperty(oCtx.getPath() + "/showAll", !bCurrentlyExpanded);
      // Walk up: Link → VBox (doc3AttBox) → find List sibling
      var oVBox = oLink.getParent();
      var oList = null;
      oVBox.getItems().forEach(function (oItem) {
        if (oItem.isA("sap.m.List")) { oList = oItem; }
      });
      if (oList) {
        if (!bCurrentlyExpanded) {
          oList.addStyleClass("doc3AttListExpanded");
        } else {
          oList.removeStyleClass("doc3AttListExpanded");
        }
      }
    },

    onLinkExistingDoc3: function () {
      var oView = this.getView();
      if (!this._oLinkDoc3Dialog) {
        Fragment.load({
          id: "linkDoc3Fragment",
          name: "com.sap.demo.managespec.view.LinkDoc3Dialog",
          controller: this
        }).then(function (oDialog) {
          this._oLinkDoc3Dialog = oDialog;
          oView.addDependent(oDialog);
          var oModel = new JSONModel({
            documents: [
              { fileName: "Car-Body-Design.pdf",       docNumber: "100000000181", type: "TST", version: "00", part: "000" },
              { fileName: "Body-Material-Spec.xlsx",    docNumber: "100000000184", type: "TST", version: "00", part: "000" },
              { fileName: "Body-Color-Spec.pdf",        docNumber: "100000000185", type: "TST", version: "00", part: "000" },
              { fileName: "Body-Structure-Drawing.dwg", docNumber: "100000000187", type: "TST", version: "00", part: "000" },
              { fileName: "Car-Wheel-Design.pdf",       docNumber: "100000000189", type: "DRW", version: "00", part: "000" },
              { fileName: "Wheel-Material-Spec.xlsx",   docNumber: "100000000192", type: "DRW", version: "00", part: "000" },
              { fileName: "Wheel-Color-Spec.pdf",       docNumber: "100000000193", type: "TST", version: "00", part: "000" },
              { fileName: "Engine-Design-v2.pdf",       docNumber: "100000000195", type: "DFT", version: "00", part: "000" },
              { fileName: "Engine-Block-Spec.xlsx",     docNumber: "100000000197", type: "DFT", version: "00", part: "000" },
              { fileName: "Cylinder-Head-Drawing.dwg",  docNumber: "100000000198", type: "DFT", version: "00", part: "000" },
              { fileName: "Chassis-Design.pdf",         docNumber: "100000000200", type: "TST", version: "00", part: "000" },
              { fileName: "Frame-Material-Spec.xlsx",   docNumber: "100000000202", type: "TST", version: "00", part: "000" },
              { fileName: "Suspension-Geometry.pdf",    docNumber: "100000000204", type: "TST", version: "00", part: "000" },
              { fileName: "Brake-Disc-Spec.pdf",        docNumber: "100000000205", type: "TST", version: "00", part: "000" },
              { fileName: "Wiring-Harness-Diagram.pdf", docNumber: "100000000207", type: "TST", version: "00", part: "000" }
            ]
          });
          oDialog.setModel(oModel, "linkDoc3");
          oDialog.open();
        }.bind(this));
      } else {
        this._oLinkDoc3Dialog.open();
      }
    },

    onLinkDoc3Search: function (oEvent) {
      var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue") || "";
      var oTable = Fragment.byId("linkDoc3Fragment", "linkDoc3ResultTable");
      if (!oTable) { return; }
      var oBinding = oTable.getBinding("items");
      if (!oBinding) { return; }
      if (sQuery) {
        var oFilter = new Filter([
          new Filter("fileName", FilterOperator.Contains, sQuery),
          new Filter("docNumber", FilterOperator.Contains, sQuery)
        ], false);
        oBinding.filter([oFilter]);
      } else {
        oBinding.filter([]);
      }
    },

    onLinkDoc3Confirm: function () {
      var oTable = Fragment.byId("linkDoc3Fragment", "linkDoc3ResultTable");
      if (oTable) {
        var aSelected = oTable.getSelectedItems();
        if (aSelected.length > 0) {
          var oDetailModel = this.getView().getModel("detail");
          var aFlat = oDetailModel.getProperty("/documentsFlat") || [];
          aSelected.forEach(function (oItem) {
            var oCtx = oItem.getBindingContext("linkDoc3");
            var oDoc = oCtx.getObject();
            if (!aFlat.some(function (d) { return d.docNumber === oDoc.docNumber; })) {
              aFlat.push(Object.assign({}, oDoc, { status: "New", showAll: false, attachments: [] }));
            }
          });
          oDetailModel.setProperty("/documentsFlat", aFlat);
        }
      }
      if (this._oLinkDoc3Dialog) { this._oLinkDoc3Dialog.close(); }
    },

    onLinkDoc3Cancel: function () {
      if (this._oLinkDoc3Dialog) { this._oLinkDoc3Dialog.close(); }
    },

    onLinkDocSearch: function () {
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
            docNumber: "100000003683", description: "ObjectLinks-Overview-April2026.pptx", docDescription: "Overview of object links for April 2026 release", type: "NEW", part: "000", version: "01", status: "New", isParent: true,
            children: [
              { docNumber: "100000003684", description: "Appendix-A.pdf", type: "PDF", part: "000", version: "01", modifiedOn: "Aug 6, 2026", createdBy: "yue.xi01@sap.com" },
              { docNumber: "100000003685", description: "Appendix-B.xlsx", type: "XLSX", part: "000", version: "02", modifiedOn: "Jul 12, 2026", createdBy: "yue.xi01@sap.com" }
            ]
          },
          {
            docNumber: "100000003690", description: "Technical-Specification-v2.pdf", docDescription: "Technical specification document version 2", type: "IMU", part: "000", version: "02", status: "In Work", isParent: true,
            children: [
              { docNumber: "100000003691", description: "Drawing-Front.dwg", type: "DWG", part: "000", version: "01", modifiedOn: "Aug 1, 2026", createdBy: "max.mueller@sap.com" },
              { docNumber: "100000003692", description: "Drawing-Side.dwg", type: "DWG", part: "000", version: "02", modifiedOn: "Aug 3, 2026", createdBy: "max.mueller@sap.com" },
              { docNumber: "100000003693", description: "BOM-List.xlsx", type: "XLSX", part: "000", version: "03", modifiedOn: "Jul 28, 2026", createdBy: "yue.xi01@sap.com" }
            ]
          },
          {
            docNumber: "100000003700", description: "Compliance-Report-2026.docx", docDescription: "Annual compliance report for 2026", type: "TES", part: "000", version: "01", status: "Locked", isParent: true,
            children: [
              { docNumber: "100000003701", description: "Test-Results.pdf", type: "PDF", part: "000", version: "01", modifiedOn: "Aug 5, 2026", createdBy: "anna.schmidt@sap.com" }
            ]
          },
          {
            docNumber: "100000003710", description: "User-Manual-EN.pdf", docDescription: "English user manual for end users", type: "DRW", part: "000", version: "04", status: "Created", isParent: true,
            children: []
          }
        ],
        documentsFlat: [
          { fileName: "Car-Body-Design.pdf",        docName: "Car-Body-Design",        docNumber: "100000000913", type: "DFT", part: "000", version: "00", status: "New",
            attachments: ["Body-material-steel.pdf", "Body-color-arctic-white.pdf", "Body-structure-frame.dwg"], showAll: false },
          { fileName: "Body-Material-Spec.xlsx",     docName: "Body-Material-Spec",     docNumber: "100000000199", type: "DFT", part: "000", version: "00", status: "In Work",
            attachments: ["Raw-material-A.xlsx", "Raw-material-B.xlsx", "Supplier-cert.pdf", "Test-report.pdf", "Composition-table.xlsx", "REACH-compliance.pdf", "Thickness-spec.pdf", "Surface-treatment.pdf", "Grade-classification.xlsx", "Approval-letter.pdf", "Revision-notes.txt"], showAll: false },
          { fileName: "Body-Color-Spec.pdf",         docName: "Body-Color-Spec",        docNumber: "100000000206", type: "TST", part: "000", version: "00", status: "In Work",
            attachments: ["Color-chart-RAL.pdf", "Paint-sample-A.png", "Paint-sample-B.png"], showAll: false },
          { fileName: "Body-Structure-Drawing.dwg",  docName: "Body-Structure-Drawing",  docNumber: "100000000201", type: "DRW", part: "000", version: "00", status: "Locked",
            attachments: ["Frame-assembly.dwg", "Welding-specs.pdf"], showAll: false },
          { fileName: "Car-Wheel-Design.pdf",        docName: "Car-Wheel-Design",        docNumber: "100000000196", type: "DFT", part: "000", version: "00", status: "New",
            attachments: ["Wheel-geometry.pdf", "Rim-material.xlsx", "Hub-design.dwg", "Bearing-spec.pdf"], showAll: false },
          { fileName: "Wheel-Material-Spec.xlsx",    docName: "Wheel-Material-Spec",    docNumber: "100000000203", type: "TST", part: "000", version: "00", status: "In Work",
            attachments: ["Alloy-composition.xlsx"], showAll: false },
          { fileName: "Wheel-Color-Spec.pdf",        docName: "Wheel-Color-Spec",        docNumber: "100000000191", type: "DFT", part: "000", version: "00", status: "New",
            attachments: ["Finish-gloss.pdf", "Finish-matte.pdf", "Color-sample.png"], showAll: false },
          { fileName: "Engine-Design-v2.pdf",        docName: "Engine-Design-v2",        docNumber: "100000000847", type: "DRW", part: "000", version: "00", status: "Created",
            attachments: ["Engine-block.dwg", "Cylinder-head.dwg", "Fuel-system.pdf", "Cooling-circuit.pdf", "Exhaust-manifold.dwg"], showAll: false }
        ]
      });
      this.getView().setModel(oDetailModel, "detail");

      var oView = this.getView();
      setTimeout(function () {
        ["documentsTreeTable", "documentsTreeTable1", "documentsTreeTable2"].forEach(function (sId) {
          var oTable = oView.byId(sId);
          if (!oTable) { return; }
          oTable.expandToLevel(1);
          var oBinding = oTable.getBinding("rows");
          if (oBinding) { oTable.setVisibleRowCount(oBinding.getLength()); }
        });
      }, 100);

      var oRootView = this.getOwnerComponent().getRootControl();
      var oShellBar = oRootView.byId("appShellBar");
      if (oShellBar) { oShellBar.setTitle("Manage Specifications"); }

      var oAppView = oRootView.getModel("appView");
      if (oAppView) { oAppView.setProperty("/showNavButton", true); }
    }

  });
});
