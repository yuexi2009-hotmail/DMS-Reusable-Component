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

      this.byId("copyBtn").setEnabled(iCount > 0);
      this.byId("deleteBtn").setEnabled(iCount > 0);
      this.byId("compareBtn").setEnabled(iCount >= 2 && iCount <= 5);
    },

    onItemPress: function (oEvent) {
      var oItem = oEvent.getSource();
      var oCtx = oItem.getBindingContext();
      MessageToast.show("Opening: " + oCtx.getProperty("name"));
    },

    onSpecNamePress: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext();
      MessageToast.show("Opening: " + oCtx.getProperty("name"));
    },

    onNavigatePress: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext();
      MessageToast.show("Navigate to: " + oCtx.getProperty("name"));
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

    onFilterSettingsPress: function () {
      MessageToast.show("Filter settings");
    }

  });
});
