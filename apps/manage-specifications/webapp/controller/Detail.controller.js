sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/ui/core/Fragment",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/Sorter"
], function (Controller, JSONModel, MessageToast, MessageBox, Fragment, Filter, FilterOperator, Sorter) {
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

      function applyDialogStyles(node) {
        // Only add FacetFilter class for actual FacetFilter dialogs (not TreeTable dialogs)
        if (node.querySelector(".sapMFFLI, .sapMFFPFLI")) {
          node.classList.add("docFacetFilterDialog");
        }
        // p13n dialog buttons: force compact size
        var oConfirm = node.querySelector("button[id$='-confirmBtn']");
        var oCancel = node.querySelector("button[id$='-cancelBtn']");
        if (oConfirm || oCancel) {
          [oConfirm, oCancel].forEach(function (btn) {
            if (!btn) { return; }
            btn.style.height = "2rem";
            btn.style.minHeight = "2rem";
            btn.style.padding = "0.1875rem 0";
            btn.style.marginLeft = "0";
            var inner = btn.querySelector(".sapMBtnInner");
            if (inner) {
              inner.style.height = "1.625rem";
              inner.style.minHeight = "1.625rem";
              inner.style.lineHeight = "1.5rem";
              inner.style.padding = "0 0.5rem";
            }
          });
          if (oCancel) {
            oCancel.style.marginLeft = "8px";
            var oCancelInner = oCancel.querySelector(".sapMBtnInner");
            if (oCancelInner) { oCancelInner.style.marginLeft = "8px"; }
          }
        }
        // Dialog footer: add 12px gap before the Cancel/end button
        var oEndBtn = node.querySelector("button.sapMDialogEndButton");
        if (oEndBtn) {
          oEndBtn.style.setProperty("margin-left", "8px", "important");
        }
        // Link Documents dialog: 8px gap between Go and Show Filters
        var oShowFilters = node.querySelector("[id$='linkDoc3ShowFiltersBtn']");
        if (oShowFilters) {
          oShowFilters.style.setProperty("margin-left", "8px", "important");
        }
        // Link Documents dialog: search row 16px padding and margin
        var oSearchRow = node.querySelector("[id$='linkDoc3SearchRow']");
        if (oSearchRow) {
          oSearchRow.style.setProperty("padding", "16px", "important");
          oSearchRow.style.setProperty("margin-top", "16px", "important");
          oSearchRow.style.setProperty("margin-bottom", "16px", "important");
        }
      }

      var oObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          m.addedNodes.forEach(function (node) {
            if (node.nodeType !== 1) { return; }
            if (node.classList && (node.classList.contains("sapMDialog") || node.classList.contains("sapMPopup-CTX"))) {
              // Run immediately and at 100ms/300ms to catch async-rendered buttons
              setTimeout(function () { applyDialogStyles(node); }, 0);
              setTimeout(function () { applyDialogStyles(node); }, 100);
              setTimeout(function () { applyDialogStyles(node); }, 300);
            }
          });
        });
      });
      oObserver.observe(oStatic, { childList: true });
    },

    onTabSelect: function (oEvent) {
      var sKey = oEvent && oEvent.getParameter && oEvent.getParameter("key");
      setTimeout(function () {
        var aContents = document.querySelectorAll(".detailPage .sapMITBContent, .detailPage .sapMITBContainerContent");
        aContents.forEach(function (el) {
          el.style.background = "var(--sapBackgroundColor, #ffffff)";
          el.style.padding = "0";
        });
      }, 0);
      if (sKey === "documents4") {
        this._doc4AutoSelect();
      }
      if (sKey === "documents7") {
        setTimeout(this.onDoc7SetupDragDrop.bind(this), 100);
      }
    },

    _doc4AutoSelect: function () {
      var oTable = this.getView().byId("documentsTable4");
      if (!oTable) { return; }
      var aItems = oTable.getItems();
      if (!aItems.length) { return; }
      var oFirst = aItems[0];
      oTable.setSelectedItem(oFirst, true);
      var oCtx = oFirst.getBindingContext("detail");
      if (oCtx) {
        var aFlat = this.getView().getModel("detail").getProperty("/documentsFlat") || [];
        this._doc4ShowRow(oCtx.getObject(), aFlat.indexOf(oCtx.getObject()));
      }
    },

    onDocumentNavigate: function () {
      MessageToast.show("Navigate to document");
    },

    onDoc5ViewSettings: function () {
      var oView = this.getView();
      if (!this._oDoc5VSD) {
        sap.ui.require([
          "sap/m/ViewSettingsDialog",
          "sap/m/ViewSettingsItem"
        ], function (ViewSettingsDialog, ViewSettingsItem) {
          this._oDoc5VSD = new ViewSettingsDialog({
            sortItems: [
              new ViewSettingsItem({ key: "fileName", text: "Attachment", selected: true }),
              new ViewSettingsItem({ key: "docName",  text: "Document" }),
              new ViewSettingsItem({ key: "type",     text: "Type" }),
              new ViewSettingsItem({ key: "version",  text: "Version" }),
              new ViewSettingsItem({ key: "status",   text: "Status" })
            ],
            groupItems: [
              new ViewSettingsItem({ key: "type",   text: "Type" }),
              new ViewSettingsItem({ key: "status", text: "Status" }),
              new ViewSettingsItem({ key: "docName",text: "Document" })
            ],
            confirm: this._onDoc5VSDConfirm.bind(this),
            reset:   this._onDoc5VSDReset.bind(this)
          });
          oView.addDependent(this._oDoc5VSD);
          this._oDoc5VSD.open();
        }.bind(this));
      } else {
        this._oDoc5VSD.open();
      }
    },

    _onDoc5VSDConfirm: function (oEvent) {
      var mParams   = oEvent.getParameters();
      var oTable    = this.getView().byId("documentsTable5");
      if (!oTable) { return; }
      var oBinding  = oTable.getBinding("items");
      if (!oBinding) { return; }

      var aSorters  = [];
      if (mParams.sortItem) {
        var sSortPath = mParams.sortItem.getKey();
        aSorters.push(new Sorter(sSortPath, mParams.sortDescending));
      }
      oBinding.sort(aSorters);
    },

    _onDoc5VSDReset: function () {
      var oTable   = this.getView().byId("documentsTable5");
      if (!oTable) { return; }
      var oBinding = oTable.getBinding("items");
      if (oBinding) { oBinding.sort([]); }
    },

    onDoc5Link:   function () { MessageToast.show("Link document"); },
    onDoc5Unlink: function () { MessageToast.show("Unlink document"); },
    onDoc5Search: function () {},

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
              { fileName: "Body-material-steel.pdf",      fileIcon: "sap-icon://pdf-attachment",   docName: "Car-Body-Design",      docNumber: "100000000913", type: "DFT", part: "000", version: "00", status: "New" },
              { fileName: "Body-color-arctic-white.pdf",  fileIcon: "sap-icon://pdf-attachment",   docName: "Car-Body-Design",      docNumber: "100000000913", type: "DFT", part: "000", version: "00", status: "New" },
              { fileName: "Body-structure-frame.dwg",     fileIcon: "sap-icon://document",         docName: "Car-Body-Design",      docNumber: "100000000913", type: "DFT", part: "000", version: "00", status: "New" },
              { fileName: "Raw-material-A.xlsx",          fileIcon: "sap-icon://excel-attachment",  docName: "Body-Material-Spec",   docNumber: "100000000199", type: "DFT", part: "000", version: "00", status: "In Work" },
              { fileName: "Raw-material-B.xlsx",          fileIcon: "sap-icon://excel-attachment",  docName: "Body-Material-Spec",   docNumber: "100000000199", type: "DFT", part: "000", version: "00", status: "In Work" },
              { fileName: "Supplier-cert.pdf",            fileIcon: "sap-icon://pdf-attachment",   docName: "Body-Material-Spec",   docNumber: "100000000199", type: "DFT", part: "000", version: "00", status: "In Work" },
              { fileName: "Test-report.pdf",              fileIcon: "sap-icon://pdf-attachment",   docName: "Body-Material-Spec",   docNumber: "100000000199", type: "DFT", part: "000", version: "00", status: "In Work" },
              { fileName: "Composition-table.xlsx",       fileIcon: "sap-icon://excel-attachment",  docName: "Body-Material-Spec",   docNumber: "100000000199", type: "DFT", part: "000", version: "00", status: "In Work" },
              { fileName: "Wheel-geometry.pdf",           fileIcon: "sap-icon://pdf-attachment",   docName: "Car-Wheel-Design",     docNumber: "100000000189", type: "DRW", part: "000", version: "00", status: "New" },
              { fileName: "Wheel-material-spec.xlsx",     fileIcon: "sap-icon://excel-attachment",  docName: "Car-Wheel-Design",     docNumber: "100000000189", type: "DRW", part: "000", version: "00", status: "New" },
              { fileName: "Engine-assembly.pdf",          fileIcon: "sap-icon://pdf-attachment",   docName: "Engine-Design-v2",     docNumber: "100000000195", type: "DFT", part: "000", version: "00", status: "In Work" },
              { fileName: "Engine-block-spec.xlsx",       fileIcon: "sap-icon://excel-attachment",  docName: "Engine-Block-Spec",    docNumber: "100000000197", type: "DFT", part: "000", version: "00", status: "In Work" },
              { fileName: "Cylinder-head-drawing.dwg",    fileIcon: "sap-icon://document",         docName: "Cylinder-Head-Drawing",docNumber: "100000000198", type: "DFT", part: "000", version: "00", status: "New" },
              { fileName: "Chassis-design.pdf",           fileIcon: "sap-icon://pdf-attachment",   docName: "Chassis-Design",       docNumber: "100000000200", type: "TST", part: "000", version: "00", status: "New" },
              { fileName: "Frame-material-spec.xlsx",     fileIcon: "sap-icon://excel-attachment",  docName: "Frame-Material-Spec",  docNumber: "100000000202", type: "TST", part: "000", version: "00", status: "New" }
            ]
          });
          oDialog.setModel(oLinkDocModel, "linkDoc");
          return oDialog;
        });
      }
      var oView = this.getView();
      this._oLinkDocDialog.then(function (oDialog) {
        oDialog.open();
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
        "dwg":  "sap-icon://document",
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

    _doc4ShowRow: function (oDoc, iIndex) {
      var aSizes = ["18 KB", "43 KB", "96 KB", "124 KB", "205 KB", "512 KB", "1.2 MB"];
      var aAttachments = (oDoc.attachments || []).map(function (sFile, i) {
        return {
          fileName: sFile,
          modifiedOn: "Aug 6, 2026",
          createdBy: "yue.xi01@sap.com",
          modifiedBy: "yue.xi01@sap.com",
          size: aSizes[i % aSizes.length]
        };
      });
      // Store data in component-level model so Doc4Detail view can read it
      var oComp = this.getOwnerComponent();
      var oDoc4Model = oComp.getModel("doc4");
      if (!oDoc4Model) {
        oDoc4Model = new JSONModel();
        oComp.setModel(oDoc4Model, "doc4");
      }
      oDoc4Model.setData({ docName: oDoc.docName || "Attachments", attachments: aAttachments });

      // Switch FCL to TwoColumnsBeginExpanded — midColumn already embedded statically
      var oAppCtrl = oComp.getRootControl().getController();
      if (oAppCtrl && oAppCtrl.setFCLLayout) {
        oAppCtrl.setFCLLayout("TwoColumnsBeginExpanded");
      }
    },

    onDoc4RowSelect: function (oEvent) {
      var oItem = oEvent.getSource();
      if (oItem.isA("sap.m.Table")) {
        oItem = oEvent.getParameter("listItem");
      }
      if (!oItem) { return; }
      var oCtx = oItem.getBindingContext("detail");
      if (!oCtx) { return; }
      var aFlat = this.getView().getModel("detail").getProperty("/documentsFlat") || [];
      var iIndex = aFlat.indexOf(oCtx.getObject());
      this._doc4ShowRow(oCtx.getObject(), iIndex);

      var oTable = this.getView().byId("documentsTable4");
      var oBtn = this.getView().byId("unlinkBtn4");
      if (oBtn && oTable) { oBtn.setEnabled(oTable.getSelectedItems().length > 0); }
    },

    onDoc4CloseDetail: function () {
      var oAppCtrl = this.getOwnerComponent().getRootControl().getController();
      if (oAppCtrl && oAppCtrl.setFCLLayout) {
        oAppCtrl.setFCLLayout("OneColumn");
      }
      var oTable = this.getView().byId("documentsTable4");
      if (oTable) { oTable.removeSelections(true); }
    },

    onDoc4AttCreate:    function () { MessageToast.show("Create attachment"); },
    onDoc4AttEditLink:  function () { MessageToast.show("Edit Link"); },
    onDoc4AttDownload:  function () { MessageToast.show("Download"); },
    onDoc4AttDelete:    function () { MessageToast.show("Delete"); },
    onDoc4AttMove:      function () { MessageToast.show("Move"); },
    onDoc4AttCopy:      function () { MessageToast.show("Copy"); },

    onLinkExistingDoc3: function () {
      var oView = this.getView();
      var aDocuments = [
        { fileName: "Safety-valve-drawing.pdf",      fileIcon: "sap-icon://pdf-attachment",   docName: "Valve-Assembly-2026",      docNumber: "200000002001", type: "DFT", part: "000", version: "01", status: "New" },
        { fileName: "Pressure-test-report.pdf",      fileIcon: "sap-icon://pdf-attachment",   docName: "Valve-Assembly-2026",      docNumber: "200000002001", type: "DFT", part: "000", version: "01", status: "New" },
        { fileName: "Material-datasheet.xlsx",       fileIcon: "sap-icon://excel-attachment", docName: "Valve-Assembly-2026",      docNumber: "200000002001", type: "DFT", part: "000", version: "01", status: "New" },
        { fileName: "Coating-specification.pdf",     fileIcon: "sap-icon://pdf-attachment",   docName: "Surface-Treatment-Spec",   docNumber: "200000002010", type: "TST", part: "000", version: "02", status: "In Work" },
        { fileName: "Chemical-resistance.xlsx",      fileIcon: "sap-icon://excel-attachment", docName: "Surface-Treatment-Spec",   docNumber: "200000002010", type: "TST", part: "000", version: "02", status: "In Work" },
        { fileName: "Adhesion-test-results.pdf",     fileIcon: "sap-icon://pdf-attachment",   docName: "Surface-Treatment-Spec",   docNumber: "200000002010", type: "TST", part: "000", version: "02", status: "In Work" },
        { fileName: "Tolerance-analysis.xlsx",       fileIcon: "sap-icon://excel-attachment", docName: "Gearbox-Housing-Design",   docNumber: "200000002020", type: "DRW", part: "001", version: "03", status: "Released" },
        { fileName: "Gearbox-assembly-drawing.dwg",  fileIcon: "sap-icon://document",         docName: "Gearbox-Housing-Design",   docNumber: "200000002020", type: "DRW", part: "001", version: "03", status: "Released" },
        { fileName: "Inspection-checklist.pdf",      fileIcon: "sap-icon://pdf-attachment",   docName: "Gearbox-Housing-Design",   docNumber: "200000002020", type: "DRW", part: "001", version: "03", status: "Released" },
        { fileName: "Weld-procedure-spec.pdf",       fileIcon: "sap-icon://pdf-attachment",   docName: "Frame-Welding-Procedure",  docNumber: "200000002030", type: "IMU", part: "000", version: "01", status: "In Work" },
        { fileName: "Weld-inspection-record.xlsx",   fileIcon: "sap-icon://excel-attachment", docName: "Frame-Welding-Procedure",  docNumber: "200000002030", type: "IMU", part: "000", version: "01", status: "In Work" },
        { fileName: "NDT-report.pdf",                fileIcon: "sap-icon://pdf-attachment",   docName: "Frame-Welding-Procedure",  docNumber: "200000002030", type: "IMU", part: "000", version: "01", status: "In Work" },
        { fileName: "Torque-spec-table.xlsx",        fileIcon: "sap-icon://excel-attachment", docName: "Fastener-Torque-Spec",     docNumber: "200000002040", type: "TST", part: "000", version: "01", status: "New" },
        { fileName: "Bolt-pattern-drawing.dwg",      fileIcon: "sap-icon://document",         docName: "Fastener-Torque-Spec",     docNumber: "200000002040", type: "TST", part: "000", version: "01", status: "New" },
        { fileName: "Assembly-sequence.pdf",         fileIcon: "sap-icon://pdf-attachment",   docName: "Final-Assembly-Guide",     docNumber: "200000002050", type: "DFT", part: "000", version: "02", status: "Released" }
      ];

      if (!this._oLinkDoc3Dialog) {
        Fragment.load({
          id: "linkDoc3Fragment",
          name: "com.sap.demo.managespec.view.LinkDoc3Dialog",
          controller: this
        }).then(function (oDialog) {
          this._oLinkDoc3Dialog = oDialog;
          this._oLinkDoc3AllDocs = aDocuments;
          oView.addDependent(oDialog);
          oDialog.setModel(new JSONModel({ documents: aDocuments }), "linkDoc3");
          oDialog.open();
        }.bind(this));
      } else {
        this._oLinkDoc3Dialog.open();
      }
    },

    onLinkDoc3GoSearch: function () {
      var oSearch = Fragment.byId("linkDoc3Fragment", "linkDoc3SearchField");
      this._applyLinkDoc3Filters(oSearch ? oSearch.getValue() : "");
    },

    onLinkDoc3Filter: function () {
      this._applyLinkDoc3Filters();
    },

    onLinkDoc3Search: function (oEvent) {
      this._applyLinkDoc3Filters(oEvent.getParameter("query") || oEvent.getParameter("newValue") || "");
    },

    onLinkDoc3ToggleFilters: function () {
      var oPanel = Fragment.byId("linkDoc3Fragment", "linkDoc3FilterPanel");
      var oBtn   = Fragment.byId("linkDoc3Fragment", "linkDoc3ShowFiltersBtn");
      if (!oPanel || !oBtn) { return; }
      var bVisible = oPanel.getVisible();
      oPanel.setVisible(!bVisible);
      oBtn.setText(bVisible ? "Show Filters" : "Hide Filters");
      // Re-apply 8px gap after setText triggers DOM re-render
      setTimeout(function () {
        var oDomBtn = oBtn.getDomRef ? oBtn.getDomRef() : document.querySelector("[id$='linkDoc3ShowFiltersBtn']");
        if (oDomBtn) { oDomBtn.style.setProperty("margin-left", "8px", "important"); }
      }, 0);
    },

    _applyLinkDoc3Filters: function (sQuery) {
      var oTable = Fragment.byId("linkDoc3Fragment", "linkDoc3ResultTable");
      if (!oTable) { return; }
      var oBinding = oTable.getBinding("rows");
      if (!oBinding) { return; }

      var oTypeSelect   = Fragment.byId("linkDoc3Fragment", "linkDoc3TypeFilter");
      var oStatusSelect = Fragment.byId("linkDoc3Fragment", "linkDoc3StatusFilter");
      var sType   = oTypeSelect   ? oTypeSelect.getSelectedKey()   : "";
      var sStatus = oStatusSelect ? oStatusSelect.getSelectedKey() : "";
      if (sQuery === undefined) {
        var oSearch = Fragment.byId("linkDoc3Fragment", "linkDoc3SearchField");
        sQuery = oSearch ? oSearch.getValue() : "";
      }

      var aFilters = [];
      if (sType)   { aFilters.push(new Filter("type",   FilterOperator.EQ, sType)); }
      if (sStatus) { aFilters.push(new Filter("status", FilterOperator.EQ, sStatus)); }
      if (sQuery)  {
        aFilters.push(new Filter([
          new Filter("fileName",  FilterOperator.Contains, sQuery),
          new Filter("docName",   FilterOperator.Contains, sQuery),
          new Filter("docNumber", FilterOperator.Contains, sQuery)
        ], false));
      }
      oBinding.filter(aFilters.length ? [new Filter(aFilters, true)] : []);
    },

    onLinkDoc3Confirm: function () {
      var oTable = Fragment.byId("linkDoc3Fragment", "linkDoc3ResultTable");
      if (oTable) {
        var aIndices = oTable.getSelectedIndices();
        if (aIndices.length > 0) {
          var oDetailModel = this.getView().getModel("detail");
          var aFlat = oDetailModel.getProperty("/documentsFlat") || [];
          aIndices.forEach(function (iIndex) {
            var oCtx = oTable.getContextByIndex(iIndex);
            var oDoc = oCtx ? oCtx.getObject() : null;
            if (oDoc && !aFlat.some(function (d) { return d.fileName === oDoc.fileName; })) {
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

        // ---- Documents 7 ----
    onDoc7DocSelect: function (oEvent) {
      var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
      if (!oItem || oItem.isA("sap.m.Table")) { return; }
      var oCtx = oItem.getBindingContext("detail");
      if (!oCtx) { return; }
      var oDoc = oCtx.getObject();
      var aIconMap = { "pdf": "sap-icon://pdf-attachment", "dwg": "sap-icon://document", "default": "sap-icon://document" };
      var aSizes = ["18 KB", "43 KB", "96 KB", "124 KB", "205 KB", "512 KB", "1.21 MB"];
      var aAtts = (oDoc.attachments || []).map(function (sFile, i) {
        var sExt = sFile.split(".").pop().toLowerCase();
        return {
          typeIcon:   aIconMap[sExt] || aIconMap["default"],
          name:       sFile,
          docNumber:  "10000000" + (191 + i),
          modifiedOn: "Aug 6, 2026",
          createdBy:  "yue.xi01@sap.com",
          modifiedBy: "yue.xi01@sap.com",
          size:       aSizes[i % aSizes.length]
        };
      });
      var oDetailModel = this.getView().getModel("detail");
      oDetailModel.setProperty("/doc7Attachments", aAtts);
      oDetailModel.setProperty("/doc7Uuid", "09a212e0-65fa-4464-907d-d52c1b844027");
      oDetailModel.setProperty("/doc7StripVisible", true);
      var oView = this.getView();
      ["doc7EditBtn", "doc7DownBtn", "doc7DeleteBtn", "doc7MoveBtn", "doc7CopyBtn"].forEach(function (sId) {
        var oBtn = oView.byId(sId);
        if (oBtn) { oBtn.setEnabled(false); }
      });
    },

    onDoc7AttSelect: function () {
      var oTable = this.getView().byId("doc7AttTable");
      var bHas = oTable && oTable.getSelectedItems().length > 0;
      var oView = this.getView();
      ["doc7EditBtn", "doc7DownBtn", "doc7DeleteBtn", "doc7MoveBtn", "doc7CopyBtn"].forEach(function (sId) {
        var oBtn = oView.byId(sId);
        if (oBtn) { oBtn.setEnabled(bHas); }
      });
    },

    onDoc7AttTableUpdated: function () {
      var oTable = this.byId("doc7AttTable");
      if (!oTable) { return; }
      oTable.$().find(".docAttTypeIcon").each(function () {
        this.style.setProperty("color", "#506D84", "important");
        this.style.setProperty("font-size", "1.25rem", "important");
        this.style.setProperty("width", "2.5rem", "important");
        this.style.setProperty("height", "2.5rem", "important");
        this.style.setProperty("line-height", "2.5rem", "important");
        this.style.setProperty("border", "1px solid rgba(80,109,132,0.4)", "important");
        this.style.setProperty("border-radius", "0.5rem", "important");
        this.style.setProperty("background", "#fff", "important");
        this.style.setProperty("box-sizing", "border-box", "important");
        this.style.setProperty("display", "inline-flex", "important");
        this.style.setProperty("align-items", "center", "important");
        this.style.setProperty("justify-content", "center", "important");
      });
      // Fix Add button text/arrow overlap by setting explicit min-width on inner button
      var oBtn = this.byId("doc7CreateBtn");
      if (oBtn && oBtn.getDomRef()) {
        var oBtnInner = oBtn.getDomRef().querySelector("button");
        if (oBtnInner) {
          oBtnInner.style.removeProperty("min-width");
          oBtnInner.style.removeProperty("padding-right");
        }
      }
    },

    onDoc7Create:         function () { MessageToast.show("Create attachment"); },
    onDoc7CreateFolder:   function () {},
    onDoc7Upload:         function () {},
    onDoc7CreateLink:     function () {},
    onDoc7EditLink:       function () { MessageToast.show("Edit Link"); },
    onDoc7Download:       function () { MessageToast.show("Download"); },
    onDoc7Delete:         function () { MessageToast.show("Delete"); },
    onDoc7Move:           function () { MessageToast.show("Move"); },
    onDoc7Copy:           function () {},
    onDoc7CheckOut:       function () {},
    onDoc7CheckIn:        function () {},
    onDoc7Properties:     function () {},
    onDoc7NavUp:          function () {},

    onDoc7UploadNew: function () {
      var oModel = this.getView().getModel("detail");
      var oView  = this.getView();

      // Mock: simulate file picker → pick first document from left table and populate attachments
      var aFlat = oModel.getProperty("/documentsFlat") || [];
      var oFirstDoc = aFlat[0];
      if (!oFirstDoc) {
        MessageToast.show("No documents available");
        return;
      }

      // Build mock attachments for the first document
      var aIconMap = { "pdf": "sap-icon://pdf-attachment", "dwg": "sap-icon://document" };
      var aSizes = ["18 KB", "43 KB", "96 KB"];
      var aFiles = (oFirstDoc.attachments && oFirstDoc.attachments.length)
        ? oFirstDoc.attachments
        : ["Body-material-steel.pdf", "Body-color-arctic-white.pdf", "Body-structure-frame.dwg"];

      var aAtts = aFiles.map(function (sFile, i) {
        var sExt = sFile.split(".").pop().toLowerCase();
        return {
          typeIcon:   aIconMap[sExt] || "sap-icon://document",
          name:       sFile,
          modifiedOn: "Aug 6, 2026",
          createdBy:  "yue.xi01@sap.com",
          modifiedBy: "yue.xi01@sap.com",
          size:       aSizes[i % aSizes.length]
        };
      });

      oModel.setProperty("/doc7Attachments", aAtts);
      oModel.setProperty("/doc7HasData", true);

      // Select first row in left table
      var oDocTable = oView.byId("doc7DocTable");
      if (oDocTable) {
        oDocTable.setSelectedItem(oDocTable.getItems()[0], true);
      }

      MessageToast.show("File uploaded successfully");
    },
    onDoc7Refresh:        function () { MessageToast.show("Refreshed"); },
    onDoc7Sort:           function () {},
    onDoc7Settings:       function () {},
    onDoc7Search:         function () {},
    onDoc7DocNumberPress: function () {},
    onDoc7RowMore:        function () {},

    _onDoc7DragOver: function (oEvent) {
      oEvent.preventDefault();
      oEvent.stopPropagation();
      var oDom = this.getView().byId("doc7DropZone");
      if (oDom) { oDom.getDomRef().classList.add("doc7DropActive"); }
    },

    _onDoc7DragLeave: function (oEvent) {
      var oDom = this.getView().byId("doc7DropZone");
      if (oDom) { oDom.getDomRef().classList.remove("doc7DropActive"); }
    },

    _onDoc7Drop: function (oEvent) {
      oEvent.preventDefault();
      oEvent.stopPropagation();
      var oDom = this.getView().byId("doc7DropZone");
      if (oDom) { oDom.getDomRef().classList.remove("doc7DropActive"); }

      var aFiles = oEvent.dataTransfer && oEvent.dataTransfer.files
        ? Array.from(oEvent.dataTransfer.files)
        : [];

      if (aFiles.length === 0) { return; }

      var aIconMap = {
        "pdf":  "sap-icon://pdf-attachment",
        "doc":  "sap-icon://doc-attachment",
        "docx": "sap-icon://doc-attachment",
        "xls":  "sap-icon://excel-attachment",
        "xlsx": "sap-icon://excel-attachment",
        "ppt":  "sap-icon://ppt-attachment",
        "pptx": "sap-icon://ppt-attachment",
        "jpg":  "sap-icon://attachment-photo",
        "jpeg": "sap-icon://attachment-photo",
        "png":  "sap-icon://attachment-photo",
        "zip":  "sap-icon://attachment-zip-file",
        "dwg":  "sap-icon://document",
        "txt":  "sap-icon://document-text"
      };

      var aAtts = aFiles.map(function (oFile) {
        var sExt = oFile.name.split(".").pop().toLowerCase();
        var fKB = oFile.size / 1024;
        var sSize = fKB < 1024
          ? Math.round(fKB) + " KB"
          : (fKB / 1024).toFixed(2) + " MB";
        var now = new Date();
        var sDate = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        return {
          typeIcon:   aIconMap[sExt] || "sap-icon://document",
          name:       oFile.name,
          modifiedOn: sDate,
          createdBy:  "yue.xi01@sap.com",
          modifiedBy: "yue.xi01@sap.com",
          size:       sSize
        };
      });

      var oModel = this.getView().getModel("detail");
      oModel.setProperty("/doc7Attachments", aAtts);
      oModel.setProperty("/doc7HasData", true);
      oModel.setProperty("/doc7LeftRows", [{ docId: "100000000913", type: "ATT", part: "000", version: "00", status: "-" }]);

      var oDocTable = this.getView().byId("doc7DocTable");
      if (oDocTable && oDocTable.getItems().length > 0) {
        oDocTable.setSelectedItem(oDocTable.getItems()[0], true);
      }
      MessageToast.show(aFiles.length + " file(s) uploaded");
    },

    onDoc7SetupDragDrop: function () {
      var oView = this.getView();
      var oDropZone = oView.byId("doc7DropZone");
      if (!oDropZone || !oDropZone.getDomRef()) { return; }
      var oDom = oDropZone.getDomRef();
      if (oDom._doc7DdBound) { return; }
      oDom._doc7DdBound = true;
      oDom.addEventListener("dragover",  this._onDoc7DragOver.bind(this));
      oDom.addEventListener("dragleave", this._onDoc7DragLeave.bind(this));
      oDom.addEventListener("drop",      this._onDoc7Drop.bind(this));
    },

    _onRouteMatched: function (oEvent) {
      var sSpecId = oEvent.getParameter("arguments").specId;
      this._sCurrentSpecId = sSpecId;
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

      var aDocumentsFlat = [
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
      ];

      var aDocumentsAttFlat = [];
      aDocumentsFlat.forEach(function (oDoc) {
        (oDoc.attachments || []).forEach(function (sFile) {
          aDocumentsAttFlat.push({
            fileName: sFile,
            docName: oDoc.docName,
            docNumber: oDoc.docNumber,
            type: oDoc.type,
            part: oDoc.part,
            version: oDoc.version,
            status: oDoc.status
          });
        });
      });

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
        documentsFlat: aDocumentsFlat,
        documentsAttFlat: aDocumentsAttFlat,
        doc7Attachments: [],
        doc7HasData: false,
        doc7LeftRows: [{ docId: "100000000913", type: "ATT", part: "000", version: "00", status: "-" }],
        doc7StripVisible: false,
        doc7Uuid: ""
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
