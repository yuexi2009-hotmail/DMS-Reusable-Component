sap.ui.define([
  "sap/ui/mdc/TableDelegate",
  "sap/ui/mdc/table/Column",
  "sap/m/Text",
  "sap/ui/mdc/FilterField"
], function (TableDelegate, Column, Text, FilterField) {
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
  };

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
