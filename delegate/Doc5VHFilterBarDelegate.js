sap.ui.define([
  "sap/ui/mdc/FilterBarDelegate",
  "com/sap/demo/managespec/delegate/Doc5VHPropertyInfo"
], function (FilterBarDelegate, aPropertyInfo) {
  "use strict";

  var Doc5VHFilterBarDelegate = Object.assign({}, FilterBarDelegate);

  Doc5VHFilterBarDelegate.fetchProperties = function () {
    var aFBProps = aPropertyInfo
      .filter(function (oPI) {
        return ["type", "status"].indexOf(oPI.key) !== -1;
      })
      .map(function (oPI) {
        var oFBPI = Object.assign({}, oPI);
        delete oFBPI.sortable;
        return oFBPI;
      });
    return Promise.resolve(aFBProps);
  };

  return Doc5VHFilterBarDelegate;
});
