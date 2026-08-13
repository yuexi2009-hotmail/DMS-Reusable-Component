sap.ui.define([
  "sap/ui/mdc/ValueHelpDelegate",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (ValueHelpDelegate, Filter, FilterOperator) {
  "use strict";

  var Doc5VHDelegate = Object.assign({}, ValueHelpDelegate);

  Doc5VHDelegate.isSearchSupported = function (oValueHelp, oContent, oListBinding) {
    return true;
  };

  Doc5VHDelegate.getFilters = function (oValueHelp, oContent) {
    var aFilters = ValueHelpDelegate.getFilters.call(this, oValueHelp, oContent);
    var sSearch = oContent.getSearch && oContent.getSearch();
    if (sSearch) {
      var aSearchFilters = ["fileName", "docName", "docNumber", "type", "status"].map(function (sPath) {
        return new Filter({ path: sPath, operator: FilterOperator.Contains, value1: sSearch });
      });
      aFilters.push(new Filter(aSearchFilters, false));
    }
    return aFilters;
  };

  return Doc5VHDelegate;
});
