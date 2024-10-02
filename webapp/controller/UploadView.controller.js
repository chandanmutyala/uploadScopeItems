sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
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
                        item.autoID =  Math.floor(Math.random() * 100000000);  // Appending a sequential `id`, starting from 1
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

        // onUpload: function () {
        //     // Check if data has been parsed
        //     if (this._excelData.length === 0) {
        //         console.error("No data available for upload. Make sure the Excel file is parsed correctly.");
        //         sap.m.MessageToast.show("No data available for upload.");
        //         return;
        //     }
        
        //     // Wrap the parsed Excel data in an 'items' array
        //     let payload = {
        //         items: this._excelData
        //     };
        
        //     // Print the payload to be uploaded
        //     console.log("Payload to be uploaded:", payload);
        
        //     // Send the wrapped data to the CAP backend using OData V4 batch processing
        //     let oModel = this.getView().getModel();
        //     let oBindList = oModel.bindList("/resetAndInsertScopeItems");
        
        //     // Add the payload to the batch group
        //     oBindList.create(payload);
        
        //     // Submit the batch group, ensure "myBatchGroup" is correctly set in the model
        //     oModel.submitBatch("myBatchGroup").then(function (oData) {
        //         // Success case
        //         sap.m.MessageToast.show("Uploaded successfully!");
        //         console.log("Batch response data:", oData);
        //     }).catch(function (oError) {
        //         // Error case
        //         console.error("Batch error:", oError);
        //         sap.m.MessageBox.error("Upload failed. Please check the log for more details.");
        //     });
        
        //     // Clear the excel data after upload
        //     this._excelData = [];
        // }

        onUpload: function () {
            if (this._excelData.length === 0) {
                console.error("No data available for upload. Make sure the Excel file is parsed correctly.");
                sap.m.MessageToast.show("No data available for upload.");
                return;
            }
        
            let payload = {
                items: this._excelData
            };
        
            console.log("Payload to be uploaded:", payload);
        
            let oModel = this.getView().getModel();
            
            // Get the binding context for the action
            let oContext = oModel.bindContext("/resetAndInsertScopeItems(...)");
        
            // Set the parameters for the action
            oContext.setParameter("items", payload.items);
        
            // Execute the action
            oContext.execute().then(() => {
                console.log("Action executed successfully");
                return oContext.getBoundContext().requestObject();
            }).then((oData) => {
                console.log("Backend response:", oData);
                if (oData && oData.message) {
                    // If we got a message from the backend, display it
                    sap.m.MessageToast.show(oData.message);
                } else {
                    // If no message from backend, show a generic success message
                    sap.m.MessageBox.success("Upload completed successfully");
                }
                // Clear the excel data after upload
                this._excelData = [];
            }).catch((oError) => {
                console.error("Error during upload:", oError);
                if (oError.error && oError.error.message) {
                    sap.m.MessageBox.error(oError.error.message);
                } else {
                    sap.m.MessageBox.error("Upload failed. Please check the log for more details.");
                }
            });
        }
        
        
    });
});
