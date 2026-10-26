sap.ui.define([
  "sap/ui/mdc/TableDelegate",
  "sap/ui/mdc/table/Column",
  "sap/m/Text",
  "sap/m/HBox",
  "sap/ui/core/Icon"
], function (TableDelegate, Column, Text, HBox, Icon) {
  "use strict";

  var aPropertyInfos = [
    { key: "fileName",  label: "Attachment",   path: "fileName",  dataType: "sap.ui.model.type.String" },
    { key: "docName",   label: "Document",     path: "docName",   dataType: "sap.ui.model.type.String", groupable: true },
    { key: "docNumber", label: "Document No.", path: "docNumber", dataType: "sap.ui.model.type.String" },
    { key: "type",      label: "Document Type",    path: "type",      dataType: "sap.ui.model.type.String", groupable: true },
    { key: "part",      label: "Document Part",    path: "part",      dataType: "sap.ui.model.type.String" },
    { key: "version",   label: "Document Version", path: "version",   dataType: "sap.ui.model.type.String" },
    { key: "status",    label: "Document Status",  path: "status",    dataType: "sap.ui.model.type.String", groupable: true },
    { key: "nav",       label: "",             path: "nav",       dataType: "sap.ui.model.type.String" }
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
    var oTemplate;

    if (sPropertyKey === "fileName") {
      oTemplate = new HBox({ alignItems: "Center", items: [
        new Icon({ src: { path: "detail>fileName" }, color: "var(--sapContent_LabelColor)", useIconTooltip: false }),
        new Text({ text: "{detail>fileName}", wrapping: false })
      ]});
    } else {
      oTemplate = new Text({ text: "{detail>" + oPI.path + "}", wrapping: false });
    }

    return new Column(sId, {
      propertyKey: oPI.key,
      header: oPI.label,
      template: oTemplate
    });
  };

  return oDelegate;
});