sap.ui.define([
  "sap/ui/mdc/TableDelegate",
  "com/sap/demo/managespec/delegate/Doc5VHPropertyInfo",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/core/Element"
], function (TableDelegate, aPropertyInfo, Filter, FilterOperator, Element) {
  "use strict";

  var Doc5VHTableDelegate = Object.assign({}, TableDelegate);

  Doc5VHTableDelegate.fetchProperties = function () {
    return Promise.resolve(aPropertyInfo);
  };

  Doc5VHTableDelegate.updateBindingInfo = function (oTable, oBindingInfo) {
    TableDelegate.updateBindingInfo.call(this, oTable, oBindingInfo);
    var oPayload = oTable.getPayload();
    oBindingInfo.path  = oPayload.collectionPath || oBindingInfo.path;
    oBindingInfo.model = oPayload.model || oBindingInfo.model;
  };

  Doc5VHTableDelegate.getFilters = function (oTable) {
    var aFilters = TableDelegate.getFilters.call(this, oTable);
    var sFilterId = oTable.getFilter();
    var oFilterBar = sFilterId && Element.getElementById(sFilterId);
    var sSearch = oFilterBar && oFilterBar.getSearch && oFilterBar.getSearch();
    if (sSearch) {
      var aSearchFilters = ["fileName", "docName", "docNumber", "type", "status"].map(function (sPath) {
        return new Filter({ path: sPath, operator: FilterOperator.Contains, value1: sSearch });
      });
      aFilters.push(new Filter(aSearchFilters, false));
    }
    return aFilters;
  };

  return Doc5VHTableDelegate;
});
