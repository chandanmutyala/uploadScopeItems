sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/BusyIndicator"
], function (Controller, MessageToast, MessageBox, BusyIndicator) {
    "use strict";

    return Controller.extend("uploadexcellsheet.controller.UploadView", {
        onInit: function () {
            this._excelData = [];
            this._batchSize = 50; // Adjust based on your backend capacity
            
            if (typeof XLSX === 'undefined') {
                var sScriptUrl = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.16.9/xlsx.full.min.js";
                jQuery.getScript(sScriptUrl)
                    .done(() => console.log("XLSX library loaded successfully."))
                    .fail(() => {
                        console.error("Failed to load XLSX library.");
                        MessageToast.show("Failed to load Excel library.");
                    });
            }
        },

        handleUpload: function (oEvent) {
            var oFile = oEvent.getParameter("files")[0];
            if (!oFile) {
                console.error("No file selected.");
                return;
            }

            var reader = new FileReader();
            reader.onload = (e) => {
                var data = new Uint8Array(e.target.result);
                var workbook = XLSX.read(data, { type: 'array' });

                this._excelData = [];
                workbook.SheetNames.forEach((sheetName) => {
                    var XL_row_object = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                    XL_row_object = XL_row_object.map((item, index) => ({
                        ...item,
                        autoID: Math.floor(Math.random() * 100000000)
                    }));
                    this._excelData = this._excelData.concat(XL_row_object);
                });

                console.log(`Total rows parsed: ${this._excelData.length}`);
                MessageToast.show(`File parsed successfully. ${this._excelData.length} rows ready for upload.`);
            };

            reader.readAsArrayBuffer(oFile);
        },

        onUpload: function () {
            if (this._excelData.length === 0) {
                MessageToast.show("No data available for upload.");
                return;
            }

            BusyIndicator.show(0);
            this._deleteOldData()
                .then(() => this._uploadBatch(0))
                .catch((error) => {
                    console.error("Error during upload process:", error);
                    MessageBox.error("Upload process failed. Please try again.");
                    BusyIndicator.hide();
                });
        },

        _deleteOldData: function () {
            const oModel = this.getView().getModel();
            const oContext = oModel.bindContext("/deleteAllScopeItems(...)");

            return oContext.execute()
                .then(() => {
                    console.log("Old data deleted successfully");
                    MessageToast.show("Old data cleared. Starting upload of new data.");
                })
                .catch((error) => {
                    console.error("Error deleting old data:", error);
                    throw new Error("Failed to delete old data. Upload process stopped.");
                });
        },

        _uploadBatch: function (startIndex) {
            const endIndex = Math.min(startIndex + this._batchSize, this._excelData.length);
            const batchData = this._excelData.slice(startIndex, endIndex);

            console.log(`Uploading batch: ${startIndex + 1} to ${endIndex} of ${this._excelData.length}`);

            const oModel = this.getView().getModel();
            const oContext = oModel.bindContext("/resetAndInsertScopeItems(...)");
            oContext.setParameter("items", batchData);

            oContext.execute()
                .then(() => {
                    console.log(`Batch uploaded successfully (${startIndex + 1}-${endIndex})`);
                    MessageToast.show(`Uploaded ${endIndex} of ${this._excelData.length} records`);

                    if (endIndex < this._excelData.length) {
                        this._uploadBatch(endIndex);
                    } else {
                        MessageBox.success(`All ${this._excelData.length} records uploaded successfully!`);
                        this._excelData = [];
                        BusyIndicator.hide();
                    }
                })
                .catch((error) => {
                    console.error("Error during batch upload:", error);
                    MessageBox.error(`Upload failed at record ${startIndex + 1}. Please try again.`);
                    BusyIndicator.hide();
                });
        }
    });
});

