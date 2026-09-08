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
      if (sKey === "documents8") {
        setTimeout(this.onDoc8SetupDragDrop.bind(this), 100);
      }
      if (sKey === "documentsEmptyState") {
        setTimeout(this._setupDoc9DropZone.bind(this), 100);
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
      if (this._oLinkDocDialogInst) {
        this._oLinkDocDialogInst.destroy();
        this._oLinkDocDialogInst = null;
      }
      this._iLinkDocFragIdx = (this._iLinkDocFragIdx || 0) + 1;
      Fragment.load({
        id: "linkDocFrag" + this._iLinkDocFragIdx,
        name: "com.sap.demo.managespec.view.LinkDocumentDialog",
        controller: this
      }).then(function (oDialog) {
        this._oLinkDocDialogInst = oDialog;
        oView.addDependent(oDialog);
        var oLinkDocModel = new JSONModel({
            documents: [
              { description: "Car-Body-Design",         docNumber: "100000000913", type: "DFT", part: "000", version: "00", status: "New" },
              { description: "Body-Material-Spec",      docNumber: "100000000199", type: "DFT", part: "000", version: "00", status: "In Work" },
              { description: "Car-Wheel-Design",        docNumber: "100000000189", type: "DRW", part: "000", version: "00", status: "New" },
              { description: "Engine-Design-v2",        docNumber: "100000000195", type: "DFT", part: "000", version: "00", status: "In Work" },
              { description: "Engine-Block-Spec",       docNumber: "100000000197", type: "DFT", part: "000", version: "00", status: "In Work" },
              { description: "Cylinder-Head-Drawing",   docNumber: "100000000198", type: "DFT", part: "000", version: "00", status: "New" },
              { description: "Chassis-Design",          docNumber: "100000000200", type: "TST", part: "000", version: "00", status: "New" },
              { description: "Frame-Material-Spec",     docNumber: "100000000202", type: "TST", part: "000", version: "00", status: "New" },
              { description: "Suspension-Assembly",     docNumber: "100000000203", type: "DRW", part: "001", version: "01", status: "Released" },
              { description: "Brake-System-Spec",       docNumber: "100000000204", type: "DFT", part: "000", version: "02", status: "In Work" },
              { description: "Gearbox-Design",          docNumber: "100000000205", type: "DRW", part: "000", version: "01", status: "New" },
              { description: "Exhaust-Pipe-Drawing",    docNumber: "100000000206", type: "DRW", part: "000", version: "01", status: "Released" },
              { description: "Cooling-System-Spec",     docNumber: "100000000207", type: "TST", part: "000", version: "03", status: "In Work" },
              { description: "Fuel-Injection-System",   docNumber: "100000000208", type: "DFT", part: "002", version: "01", status: "New" },
              { description: "Electrical-Wiring-Plan",  docNumber: "100000000209", type: "DFT", part: "000", version: "02", status: "Released" }
            ]
        });
        oDialog.setModel(oLinkDocModel, "linkDoc");
        oDialog.open();
      }.bind(this));
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

    onLinkExistingDoc9: function () {
      this._doc3LinkCaller = "doc9";
      this.onLinkExistingDoc3();
    },

    onLinkExistingDoc3: function () {
      this._doc3LinkCaller = this._doc3LinkCaller || "doc7";
      var oView = this.getView();
      var oDetailModel = oView.getModel("detail");
      var sPrefix = this._doc3LinkCaller === "doc9" ? "doc9" : "doc7";
      var aLeftRows = oDetailModel.getProperty("/" + sPrefix + "LeftRows") || [];
      var oLinkedSet = {};
      aLeftRows.forEach(function (r) { oLinkedSet[r.docId] = true; });

      var aDocuments = [
        { description: "Valve-Assembly-2026",     docNumber: "200000002001", type: "DFT", part: "000", version: "01", status: "New" },
        { description: "Surface-Treatment-Spec",  docNumber: "200000002010", type: "TST", part: "000", version: "02", status: "In Work" },
        { description: "Gearbox-Housing-Design",  docNumber: "200000002020", type: "DRW", part: "001", version: "03", status: "Released" },
        { description: "Frame-Welding-Procedure", docNumber: "200000002030", type: "IMU", part: "000", version: "01", status: "In Work" },
        { description: "Fastener-Torque-Spec",    docNumber: "200000002040", type: "TST", part: "000", version: "01", status: "New" },
        { description: "Final-Assembly-Guide",    docNumber: "200000002050", type: "DFT", part: "000", version: "02", status: "Released" },
        { description: "Cooling-System-Layout",   docNumber: "200000002060", type: "DRW", part: "000", version: "01", status: "New" },
        { description: "Hydraulic-Line-Spec",     docNumber: "200000002070", type: "DFT", part: "002", version: "01", status: "In Work" },
        { description: "Pump-Assembly-Drawing",   docNumber: "200000002080", type: "DRW", part: "000", version: "04", status: "Released" },
        { description: "Seal-Replacement-Guide",  docNumber: "200000002090", type: "IMU", part: "000", version: "02", status: "New" },
        { description: "Motor-Mount-Design",      docNumber: "200000002100", type: "DRW", part: "001", version: "01", status: "In Work" },
        { description: "Electrical-Wiring-Spec",  docNumber: "200000002110", type: "DFT", part: "000", version: "03", status: "Released" },
        { description: "Cable-Routing-Diagram",   docNumber: "200000002120", type: "DRW", part: "000", version: "01", status: "New" },
        { description: "Sensor-Calibration-Proc", docNumber: "200000002130", type: "TST", part: "000", version: "02", status: "In Work" },
        { description: "Control-Panel-Layout",    docNumber: "200000002140", type: "DFT", part: "000", version: "01", status: "Released" },
        { description: "Empty-Doc-No-Files",      docNumber: "200000002150", type: "DFT", part: "000", version: "01", status: "New" }
      ].map(function (d) {
        return Object.assign({}, d, { alreadyLinked: !!oLinkedSet[d.docNumber] });
      });

      this._oLinkDoc3AllDocs = aDocuments;

      var oModel = new JSONModel({ documents: aDocuments });

      var that = this;
      if (this._oLinkDoc3Dialog) {
        this._oLinkDoc3Dialog.setModel(oModel, "linkDoc3");
        this._oLinkDoc3Dialog.open();
        return;
      }

      Fragment.load({
        id: oView.getId(),
        name: "com.sap.demo.managespec.view.LinkDoc3Dialog",
        controller: this
      }).then(function (oDialog) {
        oView.addDependent(oDialog);
        oDialog.setModel(oModel, "linkDoc3");
        that._oLinkDoc3Dialog = oDialog;
        oDialog.open();
      });
    },

    onLinkDoc3RowSelectionChange: function (oEvent) {
      var oTable = oEvent.getSource();
      var aIndices = oTable.getSelectedIndices();
      aIndices.forEach(function (iIndex) {
        var oCtx = oTable.getContextByIndex(iIndex);
        if (oCtx && oCtx.getProperty("alreadyLinked")) {
          oTable.removeSelectionInterval(iIndex, iIndex);
        }
      });
    },

    onLinkDoc3GoSearch: function () {
      this._applyLinkDoc3Filters();
    },

    onLinkDoc3Filter: function () {
      this._applyLinkDoc3Filters();
    },

    onLinkDoc3Search: function (oEvent) {
      this._applyLinkDoc3Filters(oEvent.getParameter("query") || oEvent.getParameter("newValue") || "");
    },

    onLinkDoc3ToggleFilters: function () {
      var oView = this.getView();
      var oPanel = Fragment.byId(oView.getId(), "linkDoc3FilterPanel");
      if (oPanel) {
        var bVisible = oPanel.getVisible();
        oPanel.setVisible(!bVisible);
        var oBtn = Fragment.byId(oView.getId(), "linkDoc3ShowFiltersBtn");
        if (oBtn) { oBtn.setText(bVisible ? "Show Filters" : "Hide Filters"); }
      }
    },

    _applyLinkDoc3Filters: function (sQuery) {
      var oView = this.getView();
      var oTable = Fragment.byId(oView.getId(), "linkDoc3ResultTable");
      if (!oTable) { return; }
      var oBinding = oTable.getBinding("rows");
      if (!oBinding) { return; }
      if (sQuery === undefined) {
        var oSearchField = Fragment.byId(oView.getId(), "linkDoc3SearchField");
        sQuery = oSearchField ? (oSearchField.getValue() || "") : "";
      }

      var aFilters = [];
      if (sQuery) {
        aFilters.push(new Filter([
          new Filter("description", FilterOperator.Contains, sQuery),
          new Filter("docNumber",   FilterOperator.Contains, sQuery)
        ], false));
      }
      oBinding.filter(aFilters.length ? [new Filter(aFilters, true)] : []);
    },

    onLinkDoc3Confirm: function () {
      var oView = this.getView();
      var oTable = Fragment.byId(oView.getId(), "linkDoc3ResultTable");
      if (oTable) {
        var aIndices = oTable.getSelectedIndices();
        if (aIndices.length > 0) {
          var oDetailModel = this.getView().getModel("detail");
          var sCallerPrefix = this._doc3LinkCaller === "doc9" ? "doc9" : "doc7";
          var aLeftRows = oDetailModel.getProperty("/" + sCallerPrefix + "LeftRows") || [];

          var oFilesMap = {
            "200000002001": [
              { name: "Valve-Assembly-Rev01.pdf",    size: "543 KB", modifiedOn: "Aug 1, 2026",  createdBy: "yue.xi01@sap.com", docNumber: "1000000091" },
              { name: "Valve-Assembly-3D.stp",       size: "1.2 MB", modifiedOn: "Aug 3, 2026",  createdBy: "yue.xi01@sap.com", docNumber: "1000000092" }
            ],
            "200000002010": [
              { name: "Surface-Treatment-Spec.pdf",  size: "211 KB", modifiedOn: "Jul 28, 2026", createdBy: "yue.xi01@sap.com", docNumber: "1000000093" }
            ],
            "200000002020": [
              { name: "Gearbox-Housing-Drawing.dwg", size: "892 KB", modifiedOn: "Aug 5, 2026",  createdBy: "yue.xi01@sap.com", docNumber: "1000000094" },
              { name: "Gearbox-Housing-BOM.xlsx",    size: "78 KB",  modifiedOn: "Aug 5, 2026",  createdBy: "yue.xi01@sap.com", docNumber: "1000000095" },
              { name: "Gearbox-Housing-Photo.jpg",   size: "3.4 MB", modifiedOn: "Aug 6, 2026",  createdBy: "yue.xi01@sap.com", docNumber: "1000000096" }
            ],
            "200000002030": [
              { name: "Frame-Welding-Procedure.pdf", size: "320 KB", modifiedOn: "Jul 20, 2026", createdBy: "yue.xi01@sap.com", docNumber: "1000000097" }
            ],
            "200000002040": [
              { name: "Fastener-Torque-Table.pdf",   size: "95 KB",  modifiedOn: "Aug 2, 2026",  createdBy: "yue.xi01@sap.com", docNumber: "1000000098" },
              { name: "Fastener-Torque-Test.xlsx",   size: "143 KB", modifiedOn: "Aug 4, 2026",  createdBy: "yue.xi01@sap.com", docNumber: "1000000099" }
            ],
            "200000002050": [
              { name: "Final-Assembly-Guide-v2.pdf", size: "1.8 MB", modifiedOn: "Aug 7, 2026",  createdBy: "yue.xi01@sap.com", docNumber: "1000000100" }
            ],
            "200000002060": [
              { name: "Cooling-System-Layout.pdf",   size: "456 KB", modifiedOn: "Jul 30, 2026", createdBy: "yue.xi01@sap.com", docNumber: "1000000101" }
            ],
            "200000002070": [
              { name: "Hydraulic-Line-Spec.pdf",     size: "234 KB", modifiedOn: "Aug 1, 2026",  createdBy: "yue.xi01@sap.com", docNumber: "1000000102" },
              { name: "Hydraulic-Diagram.vsd",       size: "678 KB", modifiedOn: "Aug 2, 2026",  createdBy: "yue.xi01@sap.com", docNumber: "1000000103" }
            ],
            "200000002080": [
              { name: "Pump-Assembly-Drawing-v4.dwg",size: "1.1 MB", modifiedOn: "Aug 3, 2026",  createdBy: "yue.xi01@sap.com", docNumber: "1000000104" }
            ],
            "200000002090": [
              { name: "Seal-Replacement-Guide.pdf",  size: "187 KB", modifiedOn: "Jul 25, 2026", createdBy: "yue.xi01@sap.com", docNumber: "1000000105" }
            ],
            "200000002100": [
              { name: "Motor-Mount-Design.stp",      size: "2.3 MB", modifiedOn: "Aug 6, 2026",  createdBy: "yue.xi01@sap.com", docNumber: "1000000106" },
              { name: "Motor-Mount-Drawing.dwg",     size: "945 KB", modifiedOn: "Aug 6, 2026",  createdBy: "yue.xi01@sap.com", docNumber: "1000000107" }
            ],
            "200000002110": [
              { name: "Electrical-Wiring-Spec-v3.pdf", size: "412 KB", modifiedOn: "Aug 4, 2026", createdBy: "yue.xi01@sap.com", docNumber: "1000000108" }
            ],
            "200000002120": [
              { name: "Cable-Routing-Diagram.pdf",   size: "328 KB", modifiedOn: "Aug 1, 2026",  createdBy: "yue.xi01@sap.com", docNumber: "1000000109" }
            ],
            "200000002130": [
              { name: "Sensor-Calibration-Proc.pdf", size: "267 KB", modifiedOn: "Jul 29, 2026", createdBy: "yue.xi01@sap.com", docNumber: "1000000110" }
            ],
            "200000002140": [
              { name: "Control-Panel-Layout.pdf",    size: "389 KB", modifiedOn: "Aug 5, 2026",  createdBy: "yue.xi01@sap.com", docNumber: "1000000111" }
            ]
          };

          aIndices.forEach(function (iIndex) {
            var oCtx = oTable.getContextByIndex(iIndex);
            var oDoc = oCtx ? oCtx.getObject() : null;
            if (oDoc && !aLeftRows.some(function (d) { return d.docNumber === oDoc.docNumber; })) {
              var aFiles = (oFilesMap[oDoc.docNumber] || []).map(function (f) {
                return Object.assign({}, f, {
                  typeIcon: f.name.endsWith(".pdf") ? "sap-icon://pdf-attachment" : "sap-icon://document",
                  modifiedBy: f.createdBy
                });
              });
              aLeftRows.push({
                docId: oDoc.docNumber,
                docNumber: oDoc.docNumber,
                type: oDoc.type,
                part: oDoc.part,
                version: oDoc.version,
                status: oDoc.status,
                isLinked: true,
                category: "Technical",
                description: oDoc.description || "",
                createdBy: "yue.xi01@sap.com",
                changedBy: "yue.xi01@sap.com",
                changedOn: "Aug 26, 2026",
                lab: "LAB01",
                changeNumber: "ECN-" + oDoc.docNumber.slice(-4),
                files: aFiles
              });
            }
          });

          oDetailModel.setProperty("/" + sCallerPrefix + "LeftRows", aLeftRows);
          oDetailModel.setProperty("/" + sCallerPrefix + "HasData", true);
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
        if (this._oLinkDocDialogInst) { this._oLinkDocDialogInst.close(); };
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

      if (this._oLinkDocDialogInst) { this._oLinkDocDialogInst.close(); };
    },

    onLinkDocCancel: function () {
      if (this._oLinkDocDialogInst) { this._oLinkDocDialogInst.close(); };
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
    onDocIdLinkPress: function (oEvent) {
      var oLink = oEvent.getSource();
      var sDocId = oLink.getText();
      sap.m.MessageToast.show("Open document: " + sDocId);
    },

    onDoc7DocSelect: function (oEvent) {
      var oCtx = oEvent.getParameter("bindingContext") ||
                 (oEvent.getParameter("listItem") && oEvent.getParameter("listItem").getBindingContext("detail"));
      if (!oCtx) { return; }
      var oDoc = oCtx.getObject();
      var oDetailModel = this.getView().getModel("detail");

      if (oDoc.isLinked) {
        oDetailModel.setProperty("/doc7ShowSwitchType", true);
        oDetailModel.setProperty("/doc7ActionBtnText", "Sync");
      } else if (oDoc.type === "ATT") {
        oDetailModel.setProperty("/doc7ShowSwitchType", true);
        oDetailModel.setProperty("/doc7ActionBtnText", "Change Type");
      } else {
        oDetailModel.setProperty("/doc7ShowSwitchType", true);
        oDetailModel.setProperty("/doc7ActionBtnText", "Sync");
      }

      oDetailModel.setProperty("/doc7Uuid", "09a212e0-65fa-4464-907d-d52c1b844027");
      oDetailModel.setProperty("/doc7StripVisible", true);
      oDetailModel.setProperty("/doc7SelectedDocId", oDoc.docId || null);
      oDetailModel.setProperty("/doc7SelectedDocType", oDoc.type || null);

      var bEverLoaded = oDetailModel.getProperty("/doc7EverLoaded");
      this.onDoc7LoadFiles(oDoc.docId);

      var oView = this.getView();
      var bIsATT = oDoc.type === "ATT";
      var oUnlinkBtn = oView.byId("unlinkBtn7");
      if (oUnlinkBtn) { oUnlinkBtn.setEnabled(!bIsATT || !!oDoc.isLinked); }
      var oCreateBtn = oView.byId("doc7CreateBtn");
      if (oCreateBtn) {
        oCreateBtn.setEnabled(bIsATT);
        this._fixMenuBtnWidth(oCreateBtn);
      }
      ["doc7EditBtn", "doc7DownBtn", "doc7DeleteBtn", "doc7MoveBtn", "doc7CopyBtn", "doc7ManageBtn"].forEach(function (sId) {
        var oBtn = oView.byId(sId);
        if (oBtn) { oBtn.setEnabled(false); }
      });
      var oAttTable = oView.byId("doc7AttTable");
      if (oAttTable) {
        if (bIsATT) {
          oAttTable.setMode("MultiSelect");
          oAttTable.getItems().forEach(function (oItem) { oItem.setType("Active"); oItem.setEnabled(true); });
        } else {
          oAttTable.setMode("MultiSelect");
          oAttTable.getItems().forEach(function (oItem) { oItem.setEnabled(false); });
        }
      }
    },

    onDoc7ActionBtn: function (oEvent) {
      var oDetailModel = this.getView().getModel("detail");
      var sText = oDetailModel.getProperty("/doc7ActionBtnText");
      if (sText === "Change Type") {
        this._openSwitchTypeDialog(oEvent);
      } else {
        MessageToast.show("Sync");
      }
    },

    _openSwitchTypeDialog: function (oEvent, sCaller) {
      var oView = this.getView();
      var that = this;

      this._switchTypeCaller = sCaller || "doc7";

      // get current type of selected left-table row
      var sTableId = this._switchTypeCaller === "doc9" ? "doc9DocTable" : "doc7DocTable";
      var oTable = oView.byId(sTableId);
      var aSelCtx = oTable && oTable.getSelectedContexts ? oTable.getSelectedContexts() : [];
      var sCurrentType = aSelCtx.length ? (aSelCtx[0].getProperty("type") || "DFT") : "DFT";

      var aTypes = ["DFT", "DRW", "TST", "IMU"];
      var iSelected = Math.max(aTypes.indexOf(sCurrentType), 0);

      if (!this._oSwitchTypeDialog) {
        Fragment.load({
          id: oView.getId(),
          name: "com.sap.demo.managespec.view.SwitchTypeDialog",
          controller: this
        }).then(function (oDialog) {
          oView.addDependent(oDialog);
          that._oSwitchTypeDialog = oDialog;
          var oSelect = Fragment.byId(oView.getId(), "switchTypeSelect");
          if (oSelect) { oSelect.setSelectedItem(oSelect.getItems()[iSelected]); }
          oDialog.open();
        }).catch(function (oErr) {
          MessageToast.show("Error: " + oErr.message);
        });
      } else {
        var oSelect = Fragment.byId(oView.getId(), "switchTypeSelect");
        if (oSelect) { oSelect.setSelectedItem(oSelect.getItems()[iSelected]); }
        this._oSwitchTypeDialog.open();
      }
    },

    onSwitchTypeConfirm: function () {
      var oView = this.getView();
      var oSelect = Fragment.byId(oView.getId(), "switchTypeSelect");
      if (oSelect) {
        var sNewType = oSelect.getSelectedKey() || "DFT";
        var sCaller = this._switchTypeCaller || "doc7";
        var sTableId = sCaller === "doc9" ? "doc9DocTable" : "doc7DocTable";
        var sBtnTextKey = sCaller === "doc9" ? "/doc9ActionBtnText" : "/doc7ActionBtnText";

        var oTable = oView.byId(sTableId);
        var aSelCtx = oTable && oTable.getSelectedContexts ? oTable.getSelectedContexts() : [];
        if (aSelCtx.length) {
          var oCtx = aSelCtx[0];
          var oDetailModel = oView.getModel("detail");
          oDetailModel.setProperty(oCtx.getPath() + "/type", sNewType);
          oDetailModel.setProperty(sBtnTextKey, "Sync");

          if (sCaller === "doc9") {
            // Disable all right-side toolbar actions — files become read-only
            ["doc9CreateBtn", "doc9EditBtn", "doc9DownBtn", "doc9DeleteBtn",
             "doc9MoveBtn", "doc9CopyBtn", "doc9ManageBtn"].forEach(function (sId) {
              var oBtn = oView.byId(sId);
              if (oBtn) { oBtn.setEnabled(false); }
            });
            // Show files if any, otherwise show empty state with Navigate to DMS
            var aFiles = oDetailModel.getProperty("/doc9Attachments") || [];
            oDetailModel.setProperty("/doc9RightState", aFiles.length > 0 ? "upload" : "noFiles");
          } else {
            // doc7: disable all right-side toolbar actions, enable Unlink
            ["doc7CreateBtn", "doc7EditBtn", "doc7DownBtn", "doc7DeleteBtn",
             "doc7MoveBtn", "doc7CopyBtn", "doc7ManageBtn"].forEach(function (sId) {
              var oBtn = oView.byId(sId);
              if (oBtn) { oBtn.setEnabled(false); }
            });
            var oUnlinkBtn = oView.byId("unlinkBtn7");
            if (oUnlinkBtn) { oUnlinkBtn.setEnabled(true); }

            // Show "Create Local Document" if no ATT rows remain in the left table
            var aRows = oDetailModel.getProperty("/doc7LeftRows") || [];
            var bHasAtt = aRows.some(function (r) { return r.type === "ATT"; });
            oDetailModel.setProperty("/doc7ShowCreateLocal", !bHasAtt);
          }
        }
      }
      if (this._oSwitchTypeDialog) { this._oSwitchTypeDialog.close(); }
    },

    onSwitchTypeCancel: function () {
      if (this._oSwitchTypeDialog) { this._oSwitchTypeDialog.close(); }
    },

    onDoc7CreateLocalDocument: function () {
      MessageToast.show("Create Local Document");
    },

    onDoc7LinkedDocPress: function () {
      MessageToast.show("Open Document");
    },

    onDoc7LoadFiles: function (sDocId) {
      var oView = this.getView();
      var oDetailModel = oView.getModel("detail");
      var oLeftTable = oView.byId("doc7DocTable");

      // if called from button (no arg), get docId from selected item
      if (!sDocId) {
        var aSelCtx = oLeftTable && oLeftTable.getSelectedContexts ? oLeftTable.getSelectedContexts() : [];
        sDocId = aSelCtx.length ? aSelCtx[0].getProperty("docId") : null;
      }

      var mFiles = {
        "100000000913": [
          { typeIcon: "sap-icon://pdf-attachment", name: "ATT-Technical-Spec.pdf",         docNumber: "100000000181", modifiedOn: "Aug 6, 2026",  createdBy: "yue.xi01@sap.com", modifiedBy: "yue.xi01@sap.com", size: "96 KB"  },
          { typeIcon: "sap-icon://document",        name: "ATT-Assembly-Guide.docx",        docNumber: "100000000182", modifiedOn: "Aug 5, 2026",  createdBy: "yue.xi01@sap.com", modifiedBy: "yue.xi01@sap.com", size: "43 KB"  },
          { typeIcon: "sap-icon://document",        name: "ATT-Test-Report.xlsx",           docNumber: "100000000183", modifiedOn: "Aug 4, 2026",  createdBy: "yue.xi01@sap.com", modifiedBy: "yue.xi01@sap.com", size: "18 KB"  }
        ],
        "200000002010": [
          { typeIcon: "sap-icon://pdf-attachment", name: "Surface-Treatment-Spec.pdf",    docNumber: "100000000191", modifiedOn: "Aug 6, 2026",  createdBy: "yue.xi01@sap.com", modifiedBy: "yue.xi01@sap.com", size: "96 KB"  },
          { typeIcon: "sap-icon://document",        name: "Coating-Process-Guide.docx",    docNumber: "100000000192", modifiedOn: "Aug 5, 2026",  createdBy: "yue.xi01@sap.com", modifiedBy: "yue.xi01@sap.com", size: "43 KB"  },
          { typeIcon: "sap-icon://document",        name: "Test-Result-Aug2026.xlsx",      docNumber: "100000000193", modifiedOn: "Aug 4, 2026",  createdBy: "yue.xi01@sap.com", modifiedBy: "yue.xi01@sap.com", size: "18 KB"  }
        ],
        "200000002020": [
          { typeIcon: "sap-icon://document",        name: "Gearbox-Housing-Drawing.dwg",   docNumber: "100000000201", modifiedOn: "Aug 10, 2026", createdBy: "yue.xi01@sap.com", modifiedBy: "yue.xi01@sap.com", size: "205 KB" },
          { typeIcon: "sap-icon://pdf-attachment",  name: "Assembly-Instruction-v3.pdf",   docNumber: "100000000202", modifiedOn: "Aug 9, 2026",  createdBy: "yue.xi01@sap.com", modifiedBy: "yue.xi01@sap.com", size: "124 KB" },
          { typeIcon: "sap-icon://document",        name: "Tolerance-Table.xlsx",          docNumber: "100000000203", modifiedOn: "Aug 8, 2026",  createdBy: "yue.xi01@sap.com", modifiedBy: "yue.xi01@sap.com", size: "32 KB"  },
          { typeIcon: "sap-icon://pdf-attachment",  name: "Change-Notice-CN-0051.pdf",     docNumber: "100000000204", modifiedOn: "Aug 7, 2026",  createdBy: "yue.xi01@sap.com", modifiedBy: "yue.xi01@sap.com", size: "18 KB"  }
        ],
        "200000002030": []
      };

      // fallback to first doc's files if no row selected
      var aAtts = mFiles[sDocId] || mFiles["200000002010"];
      oDetailModel.setProperty("/doc7Attachments", aAtts);
      oDetailModel.setProperty("/doc7AttLoaded", true);
      oDetailModel.setProperty("/doc7HasData", true);
      // Highlight first row and trigger its select logic
      if (!oDetailModel.getProperty("/doc7EverLoaded")) {
        setTimeout(function () {
          var oBinding = oLeftTable && oLeftTable.getRowBinding && oLeftTable.getRowBinding();
          var aContexts = oBinding ? (oBinding.getCurrentContexts ? oBinding.getCurrentContexts() : []) : [];
          if (aContexts.length > 0) {
            var sFirstDocId = aContexts[0].getProperty("docId");
            oDetailModel.setProperty("/doc7SelectedDocId", sFirstDocId);
            this.onDoc7LoadFiles(sFirstDocId);
          }
        }.bind(this), 0);
      }
      oDetailModel.setProperty("/doc7EverLoaded", true);
      // All action buttons stay disabled — type is not ATT
      ["doc7CreateBtn", "doc7EditBtn", "doc7DownBtn", "doc7DeleteBtn", "doc7MoveBtn", "doc7CopyBtn", "doc7ManageBtn"].forEach(function (sId) {
        var oBtn = oView.byId(sId);
        if (oBtn) { oBtn.setEnabled(false); }
      });
    },

    onDoc7Unlink: function () {
      var oView = this.getView();
      var oLeftTable = oView.byId("doc7DocTable");
      var aSelCtx = oLeftTable && oLeftTable.getSelectedContexts ? oLeftTable.getSelectedContexts() : [];
      if (!aSelCtx.length) { return; }
      var oDoc = aSelCtx[0].getObject();
      if (!oDoc || !oDoc.isLinked) { return; }

      this._sDoc7UnlinkDocNumber = oDoc.docNumber;
      var that = this;

      if (!this._oUnlinkDialog) {
        Fragment.load({ id: oView.getId(), name: "com.sap.demo.managespec.view.UnlinkDialog", controller: this })
          .then(function (oDialog) {
            that._oUnlinkDialog = oDialog;
            oView.addDependent(oDialog);
            oDialog.open();
          });
      } else {
        this._oUnlinkDialog.open();
      }
    },

    onDoc7UnlinkConfirm: function () {
      var oView = this.getView();
      var oDetailModel = oView.getModel("detail");
      var sDocNumber = this._sDoc7UnlinkDocNumber;
      var aLeftRows = oDetailModel.getProperty("/doc7LeftRows") || [];
      aLeftRows = aLeftRows.filter(function (r) { return r.docNumber !== sDocNumber; });
      oDetailModel.setProperty("/doc7LeftRows", aLeftRows);
      oDetailModel.setProperty("/doc7Attachments", []);
      oDetailModel.setProperty("/doc7ShowSwitchType", false);
      var oUnlinkBtn = oView.byId("unlinkBtn7");
      if (oUnlinkBtn) { oUnlinkBtn.setEnabled(false); }
      this._oUnlinkDialog.close();
      MessageToast.show("Document unlinked");
    },

    onDoc7UnlinkCancel: function () {
      if (this._oUnlinkDialog) { this._oUnlinkDialog.close(); }
    },

    onDoc7AttSelect: function () {
      var oTable = this.getView().byId("doc7AttTable");
      var bHas = oTable && oTable.getSelectedItems().length > 0;
      var oView = this.getView();

      // Only enable action buttons when selected doc in left table is ATT type
      var oDetailModel = oView.getModel("detail");
      var sType = oDetailModel.getProperty("/doc7SelectedDocType");
      var bIsATT = sType === "ATT";

      ["doc7EditBtn", "doc7DownBtn", "doc7DeleteBtn", "doc7MoveBtn", "doc7CopyBtn"].forEach(function (sId) {
        var oBtn = oView.byId(sId);
        if (oBtn) { oBtn.setEnabled(bHas && bIsATT); }
      });
      var oManageBtn = oView.byId("doc7ManageBtn");
      if (oManageBtn) { oManageBtn.setEnabled(bHas && bIsATT); }
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
      // Disable rows if selected doc is not ATT
      var oDetailModel = this.getView().getModel("detail");
      var aLeftRows = oDetailModel.getProperty("/doc7LeftRows") || [];
      var sSelectedDocId = oDetailModel.getProperty("/doc7SelectedDocId");
      var oSelectedDoc = aLeftRows.filter(function (r) { return r.docId === sSelectedDocId; })[0];
      var sType = oSelectedDoc ? oSelectedDoc.type : null;
      if (sType !== "ATT") {
        oTable.getItems().forEach(function (oItem) { if (oItem.setEnabled) { oItem.setEnabled(false); } });
      } else {
        oTable.getItems().forEach(function (oItem) { if (oItem.setEnabled) { oItem.setEnabled(true); } });
      }
      // Fix Add button text/arrow overlap by setting explicit min-width on inner button
      var oBtn = this.byId("doc7CreateBtn");
      this._fixMenuBtnWidth(oBtn);
    },

    _fixMenuBtnWidth: function (oMenuBtn) {
      if (!oMenuBtn) { return; }
      setTimeout(function () {
        var oDom = oMenuBtn.getDomRef();
        if (!oDom) { return; }
        var oBtnInner = oDom.querySelector("button");
        if (oBtnInner) {
          oBtnInner.style.setProperty("width", "auto", "important");
          oBtnInner.style.removeProperty("min-width");
        }
      }, 0);
    },

    onDoc7Create:         function () { MessageToast.show("Create attachment"); },
    onDoc7CreateDefault:  function () {},
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
      oModel.setProperty("/doc7ShowSwitchType", true);
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
      oModel.setProperty("/doc7ShowSwitchType", true);
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

    // ---- Documents 9 (Document Empty state — duplicate of Doc7) ----
    onDoc9DocSelect: function (oEvent) {
      var oCtx = oEvent.getParameter("bindingContext") ||
                 (oEvent.getParameter("listItem") && oEvent.getParameter("listItem").getBindingContext("detail"));
      if (!oCtx) { return; }
      var oDoc = oCtx.getObject();
      var oDetailModel = this.getView().getModel("detail");

      if (oDoc.isLinked) {
        oDetailModel.setProperty("/doc9ShowSwitchType", true);
        oDetailModel.setProperty("/doc9ActionBtnText", "Sync");
      } else if (oDoc.type === "ATT") {
        oDetailModel.setProperty("/doc9ShowSwitchType", true);
        oDetailModel.setProperty("/doc9ActionBtnText", "Change Type");
      } else {
        oDetailModel.setProperty("/doc9ShowSwitchType", true);
        oDetailModel.setProperty("/doc9ActionBtnText", "Sync");
      }

      oDetailModel.setProperty("/doc9SelectedDocId", oDoc.docId || null);

      this.onDoc9LoadFiles(oDoc.docId);

      var oView = this.getView();
      var bIsATT = oDoc.type === "ATT";
      var oUnlinkBtn = oView.byId("unlinkBtn9");
      if (oUnlinkBtn) { oUnlinkBtn.setEnabled(!bIsATT || !!oDoc.isLinked); }
      var oCreateBtn = oView.byId("doc9CreateBtn");
      if (oCreateBtn) { oCreateBtn.setEnabled(bIsATT); this._fixMenuBtnWidth(oCreateBtn); }
      ["doc9EditBtn", "doc9DownBtn", "doc9DeleteBtn", "doc9MoveBtn", "doc9CopyBtn", "doc9ManageBtn"].forEach(function (sId) {
        var oBtn = oView.byId(sId);
        if (oBtn) { oBtn.setEnabled(false); }
      });
      var oAttTable = oView.byId("doc9AttTable");
      if (oAttTable) {
        if (bIsATT) {
          oAttTable.setMode("MultiSelect");
          oAttTable.getItems().forEach(function (oItem) { oItem.setType("Active"); oItem.setEnabled(true); });
        } else {
          oAttTable.setMode("MultiSelect");
          oAttTable.getItems().forEach(function (oItem) { oItem.setEnabled(false); });
        }
      }
    },

    onDoc9LoadFiles: function (sDocId) {
      var oView = this.getView();
      var oDetailModel = oView.getModel("detail");
      var oLeftTable = oView.byId("doc9DocTable");

      // Populate left table rows on first load
      if (!oDetailModel.getProperty("/doc9EverLoaded")) {
        oDetailModel.setProperty("/doc9LeftRows", [
          { docId: "100000000913", type: "ATT", part: "000", version: "-", status: "-", isLinked: false, category: "Technical", description: "ATT-Document", createdBy: "yue.xi01@sap.com", changedBy: "yue.xi01@sap.com", changedOn: "Aug 6, 2026", lab: "LAB01", changeNumber: "" }
        ]);
      }

      oDetailModel.setProperty("/doc9EverLoaded", true);
      oDetailModel.setProperty("/doc9HasData", true);

      // Called from button (no docId, or event object passed) → upload/drag-drop state, select first row
      if (typeof sDocId !== "string") {
        oDetailModel.setProperty("/doc9Attachments", []);
        oDetailModel.setProperty("/doc9RightState", "upload");
        setTimeout(function () {
          var oBinding = oLeftTable && oLeftTable.getRowBinding && oLeftTable.getRowBinding();
          var aContexts = oBinding ? (oBinding.getCurrentContexts ? oBinding.getCurrentContexts() : []) : [];
          if (aContexts.length > 0) {
            var oDoc = aContexts[0].getObject();
            oDetailModel.setProperty("/doc9ShowSwitchType", true);
            oDetailModel.setProperty("/doc9ActionBtnText", oDoc.isLinked ? "Sync" : oDoc.type === "ATT" ? "Change Type" : "Sync");
          }
          this._setupDoc9DropZone();
        }.bind(this), 0);
        var oCreateBtn = oView.byId("doc9CreateBtn");
        if (oCreateBtn) { oCreateBtn.setEnabled(true); this._fixMenuBtnWidth(oCreateBtn); }
        return;
      }

      // Called from row click → linked doc or non-ATT shows files; ATT non-linked shows upload state
      var aLeftRows = oDetailModel.getProperty("/doc9LeftRows") || [];
      var oSelectedDoc = aLeftRows.filter(function (r) { return r.docId === sDocId; })[0];
      var bShowFiles = oSelectedDoc && (oSelectedDoc.isLinked || oSelectedDoc.type !== "ATT");

      if (bShowFiles) {
        var aAtts = (oSelectedDoc.files || []).map(function (f) {
          return Object.assign({ typeIcon: f.name && f.name.endsWith(".pdf") ? "sap-icon://pdf-attachment" : "sap-icon://document" }, f);
        });
        oDetailModel.setProperty("/doc9Attachments", aAtts);
        oDetailModel.setProperty("/doc9RightState", aAtts.length > 0 ? "upload" : "noFiles");
      } else {
        // ATT non-linked → upload/drag-drop state
        oDetailModel.setProperty("/doc9Attachments", []);
        oDetailModel.setProperty("/doc9RightState", "upload");
        setTimeout(this._setupDoc9DropZone.bind(this), 0);
      }

      var oUnlinkBtn = oView.byId("unlinkBtn9");
      if (oUnlinkBtn) { oUnlinkBtn.setEnabled(false); }
      var oCreateBtn = oView.byId("doc9CreateBtn");
      if (oCreateBtn) { oCreateBtn.setEnabled(true); this._fixMenuBtnWidth(oCreateBtn); }
      ["doc9EditBtn", "doc9DownBtn", "doc9DeleteBtn", "doc9MoveBtn", "doc9CopyBtn", "doc9ManageBtn"].forEach(function (sId) {
        var oBtn = oView.byId(sId);
        if (oBtn) { oBtn.setEnabled(false); }
      });
      setTimeout(this._setupDoc9DropZone.bind(this), 0);
    },

    onDoc9Unlink: function () {
      var oView = this.getView();
      var oLeftTable = oView.byId("doc9DocTable");
      var aSelCtx = oLeftTable && oLeftTable.getSelectedContexts ? oLeftTable.getSelectedContexts() : [];
      if (!aSelCtx.length) { return; }
      var oDoc = aSelCtx[0].getObject();
      if (!oDoc || !oDoc.isLinked) { return; }
      MessageToast.show("Unlink: " + oDoc.docId);
    },

    onDoc9NavigateToDMS: function () { MessageToast.show("Navigate to Document Management System"); },

    onDoc9ActionBtn: function (oEvent) {
      var oDetailModel = this.getView().getModel("detail");
      var sText = oDetailModel.getProperty("/doc9ActionBtnText");
      if (sText === "Change Type") {
        this._openSwitchTypeDialog(oEvent, "doc9");
      } else {
        MessageToast.show("Sync");
      }
    },

    onDoc9AttTableUpdated: function () {
      var oTable = this.byId("doc9AttTable");
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
      var oDetailModel = this.getView().getModel("detail");
      var aLeftRows = oDetailModel.getProperty("/doc9LeftRows") || [];
      var sSelectedDocId = oDetailModel.getProperty("/doc9SelectedDocId");
      var oSelectedDoc = aLeftRows.filter(function (r) { return r.docId === sSelectedDocId; })[0];
      var sType = oSelectedDoc ? oSelectedDoc.type : null;
      if (sType !== "ATT") {
        oTable.getItems().forEach(function (oItem) { if (oItem.setEnabled) { oItem.setEnabled(false); } });
      } else {
        oTable.getItems().forEach(function (oItem) { if (oItem.setEnabled) { oItem.setEnabled(true); } });
      }
      this._setupDoc9DropZone();
    },

    onDoc9LinkedDocPress: function () {},
    onDoc9Create:         function () { MessageToast.show("Create attachment"); },
    onDoc9CreateFolder:   function () {},
    onDoc9Upload:         function () {},

    _setupDoc9DropZone: function () {
      if (this._doc9DropBound) { return; }
      var oView = this.getView();
      var oModel = oView.getModel("detail");

      // Use the splitter DOM — covers both toolbar and noData area
      var oSplitter = oView.byId("doc9Splitter");
      var oDom = oSplitter ? oSplitter.getDomRef() : null;
      if (!oDom) { return; }

      this._doc9DropBound = true;

      var aIconMap = { "pdf": "sap-icon://pdf-attachment", "dwg": "sap-icon://document", "xlsx": "sap-icon://excel-attachment", "doc": "sap-icon://doc-attachment", "docx": "sap-icon://doc-attachment" };

      this._doc9DragOver = function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      };
      this._doc9Drop = function (e) {
        e.preventDefault();
        var aFiles = Array.from(e.dataTransfer.files);
        if (!aFiles.length) { return; }
        var aExisting = oModel.getProperty("/doc9Attachments") || [];
        var aNew = aFiles.map(function (oFile) {
          var sExt = oFile.name.split(".").pop().toLowerCase();
          var sSizeKB = Math.round(oFile.size / 1024) || 1;
          return {
            typeIcon:   aIconMap[sExt] || "sap-icon://document",
            name:       oFile.name,
            modifiedOn: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            createdBy:  "yue.xi01@sap.com",
            modifiedBy: "yue.xi01@sap.com",
            size:       sSizeKB + " KB"
          };
        });
        oModel.setProperty("/doc9Attachments", aExisting.concat(aNew));
        MessageToast.show(aNew.length + " file(s) uploaded");
      };

      oDom.addEventListener("dragover", this._doc9DragOver);
      oDom.addEventListener("drop", this._doc9Drop);
    },
    onDoc9CreateLink:     function () {},
    onDoc9EditLink:       function () { MessageToast.show("Edit Link"); },
    onDoc9Download:       function () { MessageToast.show("Download"); },
    onDoc9Delete:         function () { MessageToast.show("Delete"); },
    onDoc9Move:           function () { MessageToast.show("Move"); },
    onDoc9Copy:           function () {},
    onDoc9CheckOut:       function () {},
    onDoc9CheckIn:        function () {},
    onDoc9Properties:     function () {},
    onDoc9NavUp:          function () {},
    onDoc9Refresh:        function () { MessageToast.show("Refreshed"); },
    onDoc9Sort:           function () {},
    onDoc9Settings:       function () {},
    onDoc9Search:         function () {},
    onDoc9RowMore:        function () {},

    onDoc9UploadNew: function () {
      var oModel = this.getView().getModel("detail");
      var aFiles = ["Body-material-steel.pdf", "Body-color-arctic-white.pdf", "Body-structure-frame.dwg"];
      var aIconMap = { "pdf": "sap-icon://pdf-attachment", "dwg": "sap-icon://document" };
      var aSizes = ["18 KB", "43 KB", "96 KB"];
      var aAtts = aFiles.map(function (sFile, i) {
        var sExt = sFile.split(".").pop().toLowerCase();
        return { typeIcon: aIconMap[sExt] || "sap-icon://document", name: sFile, modifiedOn: "Aug 6, 2026", createdBy: "yue.xi01@sap.com", modifiedBy: "yue.xi01@sap.com", size: aSizes[i % aSizes.length] };
      });
      oModel.setProperty("/doc9Attachments", aAtts);
      oModel.setProperty("/doc9HasData", true);
      MessageToast.show("File uploaded successfully");
    },

    // ---- Documents 8 (mirrors Doc7) ----
    onDoc8DocSelect:      function () {},
    onDoc8AttTableUpdated: function () {
      var oTable = this.byId("doc8AttTable");
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
    },
    onDoc8UploadNew: function () {
      var oModel = this.getView().getModel("detail");
      var aIconMap = { "pdf": "sap-icon://pdf-attachment", "dwg": "sap-icon://document", "doc": "sap-icon://doc-attachment", "xlsx": "sap-icon://excel-attachment" };
      var aSizes = ["18 KB", "43 KB", "96 KB"];
      var aFiles = ["Body-material-steel.pdf", "Body-color-arctic-white.pdf", "Body-structure-frame.dwg"];
      var aAtts = aFiles.map(function (sFile, i) {
        var sExt = sFile.split(".").pop().toLowerCase();
        return { typeIcon: aIconMap[sExt] || "sap-icon://document", name: sFile, modifiedOn: "Aug 26, 2026", createdBy: "yue.xi01@sap.com", modifiedBy: "yue.xi01@sap.com", size: aSizes[i % aSizes.length] };
      });
      oModel.setProperty("/doc8Attachments", aAtts);
      oModel.setProperty("/doc8HasData", true);
      oModel.setProperty("/doc8LeftRows", [{ docId: "100000000913", type: "ATT", part: "000", version: "00", status: "-" }]);
      var oDocTable = this.getView().byId("doc8DocTable");
      if (oDocTable && oDocTable.getItems().length > 0) { oDocTable.setSelectedItem(oDocTable.getItems()[0], true); }
      MessageToast.show("File uploaded successfully");
    },
    _onDoc8DragOver: function (oEvent) {
      oEvent.preventDefault(); oEvent.stopPropagation();
      var oDom = this.getView().byId("doc8DropZone");
      if (oDom) { oDom.getDomRef().classList.add("doc7DropActive"); }
    },
    _onDoc8DragLeave: function (oEvent) {
      var oDom = this.getView().byId("doc8DropZone");
      if (oDom) { oDom.getDomRef().classList.remove("doc7DropActive"); }
    },
    _onDoc8Drop: function (oEvent) {
      oEvent.preventDefault(); oEvent.stopPropagation();
      var oDom = this.getView().byId("doc8DropZone");
      if (oDom) { oDom.getDomRef().classList.remove("doc7DropActive"); }
      var aFiles = oEvent.dataTransfer && oEvent.dataTransfer.files ? Array.from(oEvent.dataTransfer.files) : [];
      if (aFiles.length === 0) { return; }
      var aIconMap = { "pdf": "sap-icon://pdf-attachment", "doc": "sap-icon://doc-attachment", "docx": "sap-icon://doc-attachment", "xls": "sap-icon://excel-attachment", "xlsx": "sap-icon://excel-attachment", "png": "sap-icon://attachment-photo", "jpg": "sap-icon://attachment-photo", "zip": "sap-icon://attachment-zip-file", "dwg": "sap-icon://document", "txt": "sap-icon://document-text" };
      var aAtts = aFiles.map(function (oFile) {
        var sExt = oFile.name.split(".").pop().toLowerCase();
        var fKB = oFile.size / 1024;
        var sSize = fKB < 1024 ? Math.round(fKB) + " KB" : (fKB / 1024).toFixed(2) + " MB";
        var now = new Date();
        return { typeIcon: aIconMap[sExt] || "sap-icon://document", name: oFile.name, modifiedOn: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), createdBy: "yue.xi01@sap.com", modifiedBy: "yue.xi01@sap.com", size: sSize };
      });
      var oModel = this.getView().getModel("detail");
      oModel.setProperty("/doc8Attachments", aAtts);
      oModel.setProperty("/doc8HasData", true);
      oModel.setProperty("/doc8LeftRows", [{ docId: "100000000913", type: "ATT", part: "000", version: "00", status: "-" }]);
      MessageToast.show(aFiles.length + " file(s) uploaded");
    },
    onDoc8SetupDragDrop: function () {
      var oDropZone = this.getView().byId("doc8DropZone");
      if (!oDropZone || !oDropZone.getDomRef()) { return; }
      var oDom = oDropZone.getDomRef();
      if (oDom._doc8DdBound) { return; }
      oDom._doc8DdBound = true;
      oDom.addEventListener("dragover",  this._onDoc8DragOver.bind(this));
      oDom.addEventListener("dragleave", this._onDoc8DragLeave.bind(this));
      oDom.addEventListener("drop",      this._onDoc8Drop.bind(this));
    },
    onDoc8CreateFolder: function () {}, onDoc8Upload: function () {}, onDoc8CreateLink: function () {},
    onDoc8EditLink: function () {}, onDoc8Download: function () {}, onDoc8Delete: function () {},
    onDoc8Move: function () {}, onDoc8Copy: function () {}, onDoc8CheckOut: function () {},
    onDoc8CheckIn: function () {}, onDoc8Properties: function () {}, onDoc8NavUp: function () {},
    onDoc8Refresh: function () { MessageToast.show("Refreshed"); },
    onDoc8Sort: function () {}, onDoc8Settings: function () {}, onDoc8Search: function () {}, onDoc8RowMore: function () {},

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
        doc7HasData: true,
        doc7EverLoaded: false,
        doc7ShowSwitchType: false,
        doc7ActionBtnText: "Change Type",
        doc7ShowCreateLocal: false,
        doc7AttLoaded: false,
        doc7SelectedDocId: null,
        doc7LeftRows: [
          { docId: "100000000913", type: "ATT", part: "000", version: "00", status: "-",        isLinked: false, category: "Technical", description: "ATT-Document",              createdBy: "yue.xi01@sap.com", changedBy: "yue.xi01@sap.com", changedOn: "Aug 6, 2026",  lab: "LAB01", changeNumber: "" },
          { docId: "200000002010", type: "TST", part: "000", version: "02", status: "In Work",  isLinked: false, category: "Technical", description: "Surface-Treatment-Spec",  createdBy: "yue.xi01@sap.com", changedBy: "yue.xi01@sap.com", changedOn: "Aug 6, 2026",  lab: "LAB01", changeNumber: "" },
          { docId: "200000002020", type: "DRW", part: "001", version: "03", status: "Released", isLinked: false, category: "Technical", description: "Gearbox-Housing-Design",  createdBy: "yue.xi01@sap.com", changedBy: "yue.xi01@sap.com", changedOn: "Aug 5, 2026",  lab: "LAB01", changeNumber: "" },
          { docId: "200000002030", type: "IMU", part: "000", version: "01", status: "In Work",  isLinked: false, category: "Technical", description: "Frame-Welding-Procedure", createdBy: "yue.xi01@sap.com", changedBy: "yue.xi01@sap.com", changedOn: "Aug 4, 2026",  lab: "LAB01", changeNumber: "" }
        ],
        doc7StripVisible: false,
        doc7Uuid: "",
        doc9Attachments: [],
        doc9HasData: false,
        doc9EverLoaded: false,
        doc9RightState: "initial",
        doc9ShowSwitchType: false,
        doc9ActionBtnText: "Change Type",
        doc9AttLoaded: false,
        doc9SelectedDocId: null,
        doc9LeftRows: [],
        doc8Attachments: [],
        doc8HasData: false,
        doc8LeftRows: [{ docId: "100000000913", type: "ATT", part: "000", version: "00", status: "-" }]
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

        // doc7: auto-select first row and load files on init
        var oDoc7Table = oView.byId("doc7DocTable");
        if (oDoc7Table) {
          var oBinding = oDoc7Table.getRowBinding && oDoc7Table.getRowBinding();
          var aContexts = oBinding ? (oBinding.getCurrentContexts ? oBinding.getCurrentContexts() : []) : [];
          if (aContexts.length > 0) {
            var oCtx = aContexts[0];
            if (oCtx) {
              var sDocId = oCtx.getProperty("docId");
              this.onDoc7LoadFiles(sDocId);
            }
          }
        }
      }.bind(this), 100);

      var oRootView = this.getOwnerComponent().getRootControl();
      var oShellBar = oRootView.byId("appShellBar");
      if (oShellBar) { oShellBar.setTitle("Manage Specifications"); }

      var oAppView = oRootView.getModel("appView");
      if (oAppView) { oAppView.setProperty("/showNavButton", true); }
    }

  });
});
