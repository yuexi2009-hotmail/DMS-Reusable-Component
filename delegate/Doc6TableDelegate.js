sap.ui.define([
  "sap/ui/mdc/TableDelegate",
  "sap/ui/mdc/table/Column",
  "sap/ui/mdc/FilterField",
  "sap/m/Text",
  "sap/m/HBox",
  "sap/ui/core/Icon"
], function (TableDelegate, Column, FilterField, Text, HBox, Icon) {
  "use strict";

  var aPropertyInfos = [
    { key: "fileName",  label: "Attachment",       path: "fileName",  dataType: "sap.ui.model.type.String", groupable: false, filterable: false },
    { key: "docName",   label: "Document",          path: "docName",   dataType: "sap.ui.model.type.String", groupable: true,  filterable: true  },
    { key: "docNumber", label: "Document No.",      path: "docNumber", dataType: "sap.ui.model.type.String", groupable: true,  filterable: true  },
    { key: "type",      label: "Document Type",     path: "type",      dataType: "sap.ui.model.type.String", groupable: true,  filterable: true  },
    { key: "part",      label: "Document Part",     path: "part",      dataType: "sap.ui.model.type.String", groupable: true,  filterable: true  },
    { key: "version",   label: "Document Version",  path: "version",   dataType: "sap.ui.model.type.String", groupable: true,  filterable: true  },
    { key: "status",    label: "Document Status",   path: "status",    dataType: "sap.ui.model.type.String", groupable: true,  filterable: true  },
    { key: "source",    label: "Document Source",   path: "source",    dataType: "sap.ui.model.type.String", groupable: true,  filterable: true  },
    { key: "nav",       label: "",                  path: "nav",       dataType: "sap.ui.model.type.String", groupable: false, filterable: false }
  ];

  // Only these keys get a FilterField in the Filter tab
  var aFilterableKeys = ["docName", "docNumber", "type", "part", "version", "status"];

  var oDelegate = Object.assign({}, TableDelegate);

  oDelegate.fetchProperties = async function () {
    return aPropertyInfos;
  };

  oDelegate.updateBindingInfo = function (oTable, oBindingInfo) {
    TableDelegate.updateBindingInfo.call(this, oTable, oBindingInfo);
    oBindingInfo.path  = "/documentsAttFlat";
    oBindingInfo.model = "detail";
  };

  oDelegate.addItem = async function (oTable, sPropertyKey) {
    var oPI = aPropertyInfos.find(function (p) { return p.key === sPropertyKey; });
    if (!oPI) { return null; }

    var sId = oTable.getId() + "---col-" + sPropertyKey;
    var oTemplate;

    if (sPropertyKey === "fileName") {
      oTemplate = new HBox({ alignItems: "Center", items: [
        new Icon({
          src: "{detail>fileName}",
          color: "var(--sapContent_LabelColor)",
          useIconTooltip: false,
          class: "doc3AttIcon"
        }),
        new Text({ text: "{detail>fileName}", wrapping: false })
      ]});
    } else if (sPropertyKey === "nav") {
      oTemplate = new Icon({ src: "sap-icon://slim-arrow-right", class: "doc5NavIcon" });
    } else {
      oTemplate = new Text({ text: "{detail>" + oPI.path + "}", wrapping: false });
    }

    return new Column(sId, {
      propertyKey: oPI.key,
      header: oPI.label,
      template: oTemplate
    });
  };

  // Provides the Filter tab in p13n dialog
  oDelegate.getFilterDelegate = function () {
    return {
      addItem: function (oTable, sPropertyKey) {
        var oPI = aPropertyInfos.find(function (p) { return p.key === sPropertyKey; });
        if (!oPI || !oPI.filterable) {
          return Promise.reject(new Error("Property '" + sPropertyKey + "' is not filterable"));
        }
        var sId = oTable.getId() + "---ff-" + sPropertyKey;
        var oFF = new FilterField(sId, {
          conditions: "{$filters>/conditions/" + sPropertyKey + "}",
          propertyKey: sPropertyKey,
          label: oPI.label,
          dataType: oPI.dataType,
          maxConditions: -1
        });
        return Promise.resolve(oFF);
      }
    };
  };

  return oDelegate;
});
