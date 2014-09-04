model.jsonModel = {
   services: [
      {
         name: "alfresco/services/LoggingService",
         config: {
            loggingPreferences: {
               enabled: true,
               all: true
            }
         }
      },
      "alfresco/services/DocumentService",
      "alfresco/services/ErrorReporter"
   ],
   widgets:[
      {
         name: "alfresco/testing/WaitForMockXhrService",
         config: {
            widgets: [
               {
                  name: "alfresco/documentlibrary/AlfDocument",
                  config: {
                     nodeRef: "workspace://SpacesStore/62e6c83c-f239-4f85-b1e8-6ba0fd50fac4",
                     widgets: [
                        {
                           name: "alfresco/preview/AlfDocumentPreview",
                           config: {
                           }
                        }
                     ]
                  }
               }
            ]
         }
      },
      {
         name: "alfresco/testing/mockservices/PreviewMockXhr"
      },
      {
         name: "alfresco/testing/SubscriptionLog"
      },
      {
         name: "alfresco/testing/TestCoverageResults"
      }
   ]
};