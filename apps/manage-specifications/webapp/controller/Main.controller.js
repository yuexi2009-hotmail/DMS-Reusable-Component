sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, JSONModel, Filter, FilterOperator, MessageToast, MessageBox) {
  "use strict";

  return Controller.extend("com.sap.demo.managespec.controller.Main", {

    onInit: function () {
      var oModel = this.getOwnerComponent().getModel();
      this.getView().setModel(oModel);

      var oViewModel = new JSONModel({ selectedCount: 0 });
      this.getView().setModel(oViewModel, "viewModel");

      // Set blue title color via DOM after rendering
      this.getView().addEventDelegate({
        onAfterRendering: function () {
          var oTitle = this.byId("mainPage");
          if (oTitle) {
            var aTitles = oTitle.$().find(".manageSpecTitle .sapMTitle");
            aTitles.css("color", "var(--sapLinkColor)");
          }
        }.bind(this)
      });
    },

    onSearch: function (oEvent) {
      this._applyFilters();
    },

    onFilterChange: function () {
      /* filters applied on Go press; live change for search only */
    },

    onGoPress: function () {
      this._applyFilters();
    },

    _applyFilters: function () {
      var oTable = this.byId("specificationsTable");
      var oBinding = oTable.getBinding("items");
      var aFilters = [];

      var sSearch = this.byId("searchField").getValue();
      if (sSearch) {
        aFilters.push(new Filter({
          filters: [
            new Filter("name", FilterOperator.Contains, sSearch),
            new Filter("technicalName", FilterOperator.Contains, sSearch),
            new Filter("specType", FilterOperator.Contains, sSearch)
          ],
          and: false
        }));
      }

      var sEditingStatus = this.byId("editingStatusFilter").getSelectedKey();
      if (sEditingStatus) {
        aFilters.push(new Filter("editingStatus", FilterOperator.Contains, sEditingStatus));
      }

      var sStatus = this.byId("statusFilter").getSelectedKey();
      if (sStatus) {
        aFilters.push(new Filter("statusKey", FilterOperator.EQ, sStatus));
      }

      var sSpecType = this.byId("specTypeFilter").getSelectedKey();
      if (sSpecType) {
        aFilters.push(new Filter("specTypeKey", FilterOperator.EQ, sSpecType));
      }

      oBinding.filter(aFilters);

      var iCount = oBinding.getLength();
      this.byId("tableTitle").setText("Specifications (" + (iCount || "2,766") + ")");
    },

    onSelectionChange: function (oEvent) {
      var aSelected = this.byId("specificationsTable").getSelectedItems();
      var iCount = aSelected.length;

      this.byId("deleteBtn").setEnabled(iCount > 0);
      this.byId("syncWithS4Btn").setEnabled(iCount === 1);
    },

    onItemPress: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext();
      var sId = oCtx.getProperty("number") || oCtx.getProperty("id");
      this.getOwnerComponent().getRouter().navTo("detail", { specId: sId });
    },

    onSpecNamePress: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext();
      var sId = oCtx.getProperty("number") || oCtx.getProperty("id");
      this.getOwnerComponent().getRouter().navTo("detail", { specId: sId });
    },

    onNavigatePress: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext();
      var sId = oCtx.getProperty("number") || oCtx.getProperty("id");
      this.getOwnerComponent().getRouter().navTo("detail", { specId: sId });
    },

    onSyncWithS4Press: function () {
      var oTable = this.byId("specificationsTable");
      var aSelected = oTable.getSelectedItems();

      if (aSelected.length !== 1) {
        return;
      }

      var oCtx = aSelected[0].getBindingContext();
      var sStatus = oCtx.getProperty("documentStatus");

      if (sStatus !== "Released") {
        MessageBox.error(
          "Only Released documents can be synced with S4. The selected document has status \"" + sStatus + "\".",
          { title: "Cannot Sync" }
        );
        return;
      }

      var sPath = oCtx.getPath();
      var oModel = this.getView().getModel();
      oModel.setProperty(sPath + "/s4SyncText", "Syncing");
      oModel.setProperty(sPath + "/s4SyncState", "Warning");

      // Simulate async sync — success 70% of the time
      setTimeout(function () {
        var bSuccess = Math.random() > 0.3;
        if (bSuccess) {
          oModel.setProperty(sPath + "/s4SyncText", "Synced");
          oModel.setProperty(sPath + "/s4SyncState", "Success");
        } else {
          oModel.setProperty(sPath + "/s4SyncText", "Sync Failed please retry");
          oModel.setProperty(sPath + "/s4SyncState", "Error");
        }
      }, 2000);
    },

    onPullFromS4Press: function () {
      var oView = this.getView();

      // Mock S4 data
      var oS4Model = new JSONModel({
        documents: [
          { number: "200000001001", description: "S4 Drawing Rev A", type: "DRW", part: "000", version: "01", documentStatus: "Released" },
          { number: "200000001002", description: "S4 IMU Document",  type: "IMU", part: "000", version: "00", documentStatus: "Released" },
          { number: "200000001003", description: "S4 Test Report",   type: "TST", part: "000", version: "02", documentStatus: "Released" },
          { number: "200000001004", description: "S4 Draft Drawing", type: "DRW", part: "001", version: "00", documentStatus: "In Work" },
          { number: "200000001005", description: "S4 Material Form", type: "IMU", part: "000", version: "00", documentStatus: "New" }
        ]
      });
      oView.setModel(oS4Model, "pullFromS4");

      if (!this._oPullFromS4Dialog) {
        this._oPullFromS4Dialog = sap.ui.xmlfragment(
          oView.getId(),
          "com.sap.demo.managespec.view.PullFromS4Dialog",
          this
        );
        oView.addDependent(this._oPullFromS4Dialog);
      }

      // Reset state
      this.byId("pullFromS4ConfirmBtn").setEnabled(false);
      var oFilterPanel = this.byId("pullFromS4FilterPanel");
      if (oFilterPanel) { oFilterPanel.setVisible(false); }
      var oShowFiltersBtn = this.byId("pullFromS4ShowFiltersBtn");
      if (oShowFiltersBtn) { oShowFiltersBtn.setText("Show Filters"); }

      this._oPullFromS4Dialog.open();
    },

    onPullFromS4Search: function (oEvent) {
      this._applyPullFromS4Filters();
    },

    onPullFromS4GoSearch: function () {
      this._applyPullFromS4Filters();
    },

    onPullFromS4ToggleFilters: function () {
      var oPanel = this.byId("pullFromS4FilterPanel");
      var oBtn = this.byId("pullFromS4ShowFiltersBtn");
      var bVisible = !oPanel.getVisible();
      oPanel.setVisible(bVisible);
      oBtn.setText(bVisible ? "Hide Filters" : "Show Filters");
    },

    onPullFromS4Filter: function () {
      this._applyPullFromS4Filters();
    },

    _applyPullFromS4Filters: function () {
      var oTable = this.byId("pullFromS4ResultTable");
      var oBinding = oTable.getBinding("rows");
      var aFilters = [];

      var sSearch = this.byId("pullFromS4SearchField").getValue();
      if (sSearch) {
        aFilters.push(new Filter({
          filters: [
            new Filter("number", FilterOperator.Contains, sSearch),
            new Filter("description", FilterOperator.Contains, sSearch)
          ],
          and: false
        }));
      }

      var sType = this.byId("pullFromS4TypeFilter").getSelectedKey();
      if (sType) { aFilters.push(new Filter("type", FilterOperator.EQ, sType)); }

      var sStatus = this.byId("pullFromS4StatusFilter").getSelectedKey();
      if (sStatus) { aFilters.push(new Filter("documentStatus", FilterOperator.EQ, sStatus)); }

      oBinding.filter(aFilters);
    },

    onPullFromS4RowSelectionChange: function () {
      var oTable = this.byId("pullFromS4ResultTable");
      var bSelected = oTable.getSelectedIndices().length > 0;
      this.byId("pullFromS4ConfirmBtn").setEnabled(bSelected);
    },

    onPullFromS4Confirm: function () {
      var oTable = this.byId("pullFromS4ResultTable");
      var aIndices = oTable.getSelectedIndices();
      if (aIndices.length === 0) { return; }

      var oCtx = oTable.getContextByIndex(aIndices[0]);
      var oData = oCtx.getObject();

      // Add pulled document to main table
      var oModel = this.getView().getModel();
      var aDocuments = oModel.getProperty("/documents");
      aDocuments.unshift({
        number: oData.number,
        description: oData.description,
        type: oData.type,
        part: oData.part,
        documentStatus: oData.documentStatus,
        version: oData.version,
        s4SyncText: "Synced",
        s4SyncState: "Success",
        s4SyncIcon: "sap-icon://accept"
      });
      oModel.setProperty("/documents", aDocuments);

      this._oPullFromS4Dialog.close();
      MessageToast.show("Document " + oData.number + " pulled from S4 successfully.");
    },

    onPullFromS4Cancel: function () {
      this._oPullFromS4Dialog.close();
    },

    onCreatePress: function () {
      MessageToast.show("Create new specification");
    },

    onCreateOptionsPress: function () {
      MessageToast.show("Create options");
    },

    onCopyPress: function () {
      var aSelected = this.byId("specificationsTable").getSelectedItems();
      MessageToast.show("Copying " + aSelected.length + " specification(s)");
    },

    onDeletePress: function () {
      var aSelected = this.byId("specificationsTable").getSelectedItems();
      MessageBox.confirm(
        "Delete " + aSelected.length + " specification(s)?",
        {
          title: "Delete",
          onClose: function (sAction) {
            if (sAction === MessageBox.Action.OK) {
              MessageToast.show("Deleted successfully");
            }
          }
        }
      );
    },

    onComparePress: function () {
      MessageToast.show("Compare selected specifications");
    },

    onMassChangePress: function () {
      MessageToast.show("Mass change");
    },

    onChangeStatus: function () {
      MessageToast.show("Change status for selected items");
    },

    onChangeType: function () {
      MessageToast.show("Change type for selected items");
    },

    onAdaptFiltersPress: function () {
      MessageToast.show("Adapt filters");
    },

    onSettingsPress: function () {
      MessageToast.show("Settings");
    },

    onFullScreenPress: function () {
      MessageToast.show("Full screen");
    },

    onSharePress: function () {
      MessageToast.show("Share");
    },

    onViewSwitchPress: function () {
      MessageToast.show("Switch view");
    },

    onClipboardPress: function () {
      MessageToast.show("Copied to clipboard");
    },

    onCompactViewPress: function () {
      MessageToast.show("Toggle compact view");
    },

    onColumnSettingsPress: function () {
      MessageToast.show("Column settings");
    },

    onGridViewPress: function () {
      MessageToast.show("Grid view");
    },

    onViewOptionsPress: function () {
      MessageToast.show("View options");
    },

    onRowCheckBoxSelect: function () {
      this.onSelectionChange();
    },

    onCollapseFilters: function () {
      var oPage = this.byId("mainPage");
      oPage.setHeaderExpanded(!oPage.getHeaderExpanded());
    },

    onExportPress: function () {
      MessageToast.show("Export");
    },

    onFilterSettingsPress: function () {
      MessageToast.show("Filter settings");
    }

  });
});
