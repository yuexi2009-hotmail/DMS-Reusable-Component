sap.ui.define([
  "sap/ui/mdc/TableDelegate",
  "sap/ui/mdc/table/Column",
  "sap/m/Text",
  "sap/ui/mdc/FilterField",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/Sorter"
], function (TableDelegate, Column, Text, FilterField, Filter, FilterOperator, Sorter) {
  "use strict";

  var aPropertyInfos = [
    { key: "docId",        label: "Document",      path: "docId",        dataType: "sap.ui.model.type.String", sortable: true, filterable: true, groupable: false },
    { key: "type",         label: "Type",          path: "type",         dataType: "sap.ui.model.type.String", sortable: true, filterable: true, groupable: true  },
    { key: "part",         label: "Part",          path: "part",         dataType: "sap.ui.model.type.String", sortable: true, filterable: true, groupable: false },
    { key: "version",      label: "Ver.",          path: "version",      dataType: "sap.ui.model.type.String", sortable: true, filterable: true, groupable: false },
    { key: "status",       label: "Status",        path: "status",       dataType: "sap.ui.model.type.String", sortable: true, filterable: true, groupable: true  },
    { key: "category",     label: "S4HANA Info",   path: "category",     dataType: "sap.ui.model.type.String", sortable: true, filterable: true, groupable: false },
    { key: "description",  label: "Description",   path: "description",  dataType: "sap.ui.model.type.String", sortable: true, filterable: true, groupable: false },
    { key: "createdBy",    label: "Created By",    path: "createdBy",    dataType: "sap.ui.model.type.String", sortable: true, filterable: true, groupable: false },
    { key: "changedBy",    label: "Changed By",    path: "changedBy",    dataType: "sap.ui.model.type.String", sortable: true, filterable: true, groupable: false },
    { key: "changedOn",    label: "Changed On",    path: "changedOn",    dataType: "sap.ui.model.type.String", sortable: true, filterable: true, groupable: false },
    { key: "lab",          label: "Lab/Office",    path: "lab",          dataType: "sap.ui.model.type.String", sortable: true, filterable: true, groupable: false },
    { key: "changeNumber", label: "Change Number", path: "changeNumber", dataType: "sap.ui.model.type.String", sortable: true, filterable: true, groupable: false }
  ];

  var oDelegate = Object.assign({}, TableDelegate);

  oDelegate.fetchProperties = async function () {
    return aPropertyInfos;
  };

  oDelegate.updateBindingInfo = function (oTable, oBindingInfo) {
    TableDelegate.updateBindingInfo.call(oDelegate, oTable, oBindingInfo);
    oBindingInfo.path = oTable.getPayload().bindingPath;
    oBindingInfo.model = "detail";

    // Apply Sort
    var oState = oTable.getCurrentState ? oTable.getCurrentState() : {};
    var aSortConditions = (oState.sorters) || [];
    if (aSortConditions.length > 0) {
      oBindingInfo.sorter = aSortConditions.map(function (oSortCond) {
        return new Sorter(oSortCond.key, oSortCond.descending);
      });
    }

    // Apply Group (prepend group sorter)
    var aGroupConditions = (oState.groupLevels) || [];
    if (aGroupConditions.length > 0) {
      var aGroupSorters = aGroupConditions.map(function (oGrp) {
        return new Sorter(oGrp.key, false, true);
      });
      oBindingInfo.sorter = aGroupSorters.concat(oBindingInfo.sorter || []);
    }

    // Apply Filter
    var oFilterConditions = (oState.filter) || {};
    var aFilters = [];
    Object.keys(oFilterConditions).forEach(function (sKey) {
      var aConditions = oFilterConditions[sKey];
      if (!aConditions || !aConditions.length) { return; }
      var oPI = aPropertyInfos.find(function (p) { return p.key === sKey; });
      if (!oPI) { return; }
      aConditions.forEach(function (oCond) {
        var sOperator = oCond.operator;
        var sValue = oCond.values && oCond.values[0];
        if (sValue === undefined || sValue === null) { return; }
        var sFilterOp = _mapOperator(sOperator);
        aFilters.push(new Filter({ path: oPI.path, operator: sFilterOp, value1: sValue }));
      });
    });
    if (aFilters.length > 0) {
      oBindingInfo.filters = aFilters;
    }
  };

  function _mapOperator(sOp) {
    var mMap = {
      "Contains":           FilterOperator.Contains,
      "StartsWith":         FilterOperator.StartsWith,
      "EndsWith":           FilterOperator.EndsWith,
      "EQ":                 FilterOperator.EQ,
      "NE":                 FilterOperator.NE,
      "LT":                 FilterOperator.LT,
      "LE":                 FilterOperator.LE,
      "GT":                 FilterOperator.GT,
      "GE":                 FilterOperator.GE,
      "BT":                 FilterOperator.BT,
      "NotContains":        FilterOperator.NotContains,
      "NotStartsWith":      FilterOperator.NotStartsWith,
      "NotEndsWith":        FilterOperator.NotEndsWith
    };
    return mMap[sOp] || FilterOperator.Contains;
  }

  oDelegate.addItem = async function (oTable, sPropertyKey) {
    var oPI = aPropertyInfos.find(function (p) { return p.key === sPropertyKey; });
    if (!oPI) { return null; }
    var sId = oTable.getId() + "---col-" + sPropertyKey;
    var oExisting = sap.ui.getCore().byId(sId);
    if (oExisting) { return oExisting; }
    var oTemplate = new Text({ text: "{detail>" + oPI.path + "}", wrapping: false });
    return new Column(sId, {
      propertyKey: oPI.key,
      header: oPI.label,
      template: oTemplate,
      width: _getColWidth(sPropertyKey)
    });
  };

  oDelegate.getFilterDelegate = function () {
    return {
      addItem: function (oFilterBar, sPropertyKey) {
        var oPI = aPropertyInfos.find(function (p) { return p.key === sPropertyKey; });
        if (!oPI) { return Promise.resolve(null); }
        var sId = oFilterBar.getId() + "---ff-" + sPropertyKey;
        var oExisting = sap.ui.getCore().byId(sId);
        if (oExisting) { return Promise.resolve(oExisting); }
        return Promise.resolve(new FilterField(sId, {
          propertyKey: oPI.key,
          label: oPI.label,
          dataType: oPI.dataType,
          conditions: "{$filters>/conditions/" + oPI.key + "}",
          maxConditions: -1
        }));
      }
    };
  };

  function _getColWidth(sKey) {
    var mWidths = {
      type: "4rem", part: "4rem", version: "4rem", status: "5.5rem",
      category: "7rem", createdBy: "10rem", changedBy: "10rem",
      changedOn: "7rem", lab: "6rem", changeNumber: "8rem", description: "12rem"
    };
    return mWidths[sKey] || undefined;
  }

  return oDelegate;
});
