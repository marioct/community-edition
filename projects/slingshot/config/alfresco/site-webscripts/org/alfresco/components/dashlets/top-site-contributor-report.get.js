var pubSubScope = instance.object.id;

model.jsonModel = {
   rootNodeId: args.htmlid,
   services: [
      {
         name: "alfresco/services/ReportService",
         config: {
            pubSubScope: pubSubScope
         }
      },
      {
         name: "alfresco/services/NavigationService",
         config: {
            pubSubScope: pubSubScope
         }
      }
   ],
   widgets: [
      {
         id: "DASHLET",
         name: "alfresco/dashlets/TopSiteContributorReportDashlet",
         config: {
            pubSubScope: pubSubScope
         }
      }
   ]
};