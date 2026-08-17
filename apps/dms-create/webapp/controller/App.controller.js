sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("com.sap.demo.dmscreate.controller.App", {

        onInit: function () {
            this.getView().addStyleClass(
                this.getOwnerComponent().getContentDensityClass()
            );
        },

        onHomePressed: function () {
            // no-op: home icon is decorative in create flow
        }
    });
});
