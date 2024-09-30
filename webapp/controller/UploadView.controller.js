sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("uploadexcellsheet.controller.UploadView", {
        onInit: function () {
            this._excelData = [];  // Initialize a variable to hold the parsed Excel data
        },

        handleUpload: function (oEvent) {
            var oFile = oEvent.getParameter("files")[0];
        
            if (!oFile) {
                console.error("No file selected.");
                return;
            }
            console.log("File selected:", oFile);
        
            var reader = new FileReader();
        
            reader.onload = function (e) {
                var data = new Uint8Array(e.target.result);  // Reading the file as an array buffer
                var workbook = XLSX.read(data, { type: 'array' });
        
                // Parse the workbook and store the data in _excelData
                workbook.SheetNames.forEach(function (sheetName) {
                    var XL_row_object = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                    
                    // Append a unique `autoID` for each row
                    XL_row_object = XL_row_object.map(function (item, index) {
                        item.autoID = index + 2000;  // Appending a sequential `id`, starting from 1
                        return item;
                    });

                    // Store parsed data with appended `id`
                    this._excelData = this._excelData.concat(XL_row_object);
        
                    // Log parsed data to ensure parsing is happening correctly
                    console.log("Parsed data for sheet with IDs:", sheetName, XL_row_object);
                }.bind(this));
        
                MessageToast.show("File uploaded and data parsed with IDs.");
            }.bind(this);
        
            // Read the file as ArrayBuffer to support the xlsx library
            reader.readAsArrayBuffer(oFile);
        },

        onUpload: function () {
            // Check if data has been parsed
            if (this._excelData.length === 0) {
                console.error("No data available for upload. Make sure the Excel file is parsed correctly.");
                MessageToast.show("No data available for upload.");
                return;
            }
        
            // Print the parsed Excel data with `id` before sending to the backend
            console.log("Parsed Excel Data to be uploaded:", this._excelData);
        
            // Send the parsed Excel data to the CAP backend
            let oModels = this.getView().getModel();
            let oBindList = oModels.bindList("/ScopeItems");
            oBindList.create(this._excelData);

            // Clear the excel data after upload
            this._excelData = [];
        }
    });
});
