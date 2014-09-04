model.jsonModel = {
   services: [
      {
         name: "alfresco/services/LoggingService",
         config: {
            loggingPreferences: {
               enabled: true,
               all: true,
               warn: true,
               error: true
            }
         }
      },
      "alfresco/dialogs/AlfDialogService",
      "alfresco/testing/mockservices/DocumentPickerTestService",
      "alfresco/services/ErrorReporter"
   ],
   widgets:[
      {
         name: "alfresco/forms/controls/DocumentPicker",
         config: {
            id: "DOCUMENT_PICKER",
            label: "Items"
         }
      },
      {
         name: "alfresco/testing/SubscriptionLog"
      },
      {
         name: "alfresco/testing/TestCoverageResults"
      }
   ]
};