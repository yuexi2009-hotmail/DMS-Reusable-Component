sap.ui.define([], function () {
  "use strict";

  return [
    { key: "fileName",  path: "fileName",  label: "Attachment",        isKey: true, dataType: "sap.ui.model.type.String", sortable: true },
    { key: "docName",   path: "docName",   label: "Document",          dataType: "sap.ui.model.type.String", sortable: true },
    { key: "docNumber", path: "docNumber", label: "Document No.",      dataType: "sap.ui.model.type.String", sortable: true },
    { key: "type",      path: "type",      label: "Document Type",     dataType: "sap.ui.model.type.String", sortable: true },
    { key: "part",      path: "part",      label: "Document Part",     dataType: "sap.ui.model.type.String", sortable: true },
    { key: "version",   path: "version",   label: "Document Version",  dataType: "sap.ui.model.type.String", sortable: true },
    { key: "status",    path: "status",    label: "Document Status",   dataType: "sap.ui.model.type.String", sortable: true },
    { key: "$search",   label: "Search",   visible: true, maxConditions: 1, dataType: "sap.ui.model.type.String" }
  ];
});
