/**
 * Copyright (C) 2005-2013 Alfresco Software Limited.
 *
 * This file is part of Alfresco
 *
 * Alfresco is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alfresco is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * This mixin in provides all the functions required for widgets that wish to process sub-widgets.
 * 
 * @module alfresco/core/CoreWidgetProcessing
 * @extends module:alfresco/core/Core
 * @author Dave Draper
 */
define(["dojo/_base/declare",
        "alfresco/core/Core",
        "dijit/registry",
        "dojo/_base/array",
        "dojo/_base/lang",
        "dojo/dom-construct",
        "dojo/dom-style"], 
        function(declare, AlfCore, registry, array, lang, domConstruct, domStyle) {
   
   return declare([AlfCore], {

      /**
       * This function can be used to instantiate an array of widgets. Each widget configuration in supplied
       * widgets array is passed to the [processWidget]{@link module:alfresco/core/Core#processWidget} function
       * to handle it's creation.
       * 
       * @instance 
       * @param {Object[]} widgets An array of the widget definitions to instantiate
       * @param {element} rootNode The DOM node which should be used to add instantiated widgets to
       */
      processWidgets: function alfresco_core_CoreWidgetProcessing__processWidgets(widgets, rootNode) {
         // There are two options for providing configuration, either via a JSON object or
         // via a URL to asynchronously retrieve the configuration. The configuration object
         // takes precedence as it will be faster by virtue of not requiring a remote call.
         
         // For the moment we'll just ignore handling the configUrl...
         var _this = this;
         if (widgets && widgets instanceof Array)
         {
            // Reset the processing complete flag (this is to support multiple invocations of widget processing)...
            this.widgetProcessingComplete = false;
            
            // TODO: Using these attributes will not support multiple calls to processWidgets from within the same object instance
            this._processedWidgetCountdown = widgets.length;
            this._processedWidgets = [];
            
            // Iterate over all the widgets in the configuration object and add them...
            array.forEach(widgets, lang.hitch(this, "processWidget", rootNode));
         }
      },
      
      /**
       * Creates a widget from the supplied configuration. The creation of each widgets DOM node
       * is delegated to the [createWidgetDomNode]{@link module:alfresco/core/Core#createWidgetDomNode} function 
       * and the actual instantiation of the widget is handled by the [createWidget]{@link module:alfresco/core/Core#createWidget} function.
       * Before creation of the widget begins the [filterWidget]{@link module:alfresco/core/Core#filterWidget} function is
       * called to confirm that the widget should be created. This allows extending classes the opportunity filter
       * out widget creation in specific circumstances.
       *
       * @instance
       * @param {element} rootNode The DOM node where the widget should be created.
       * @param {object} widgetConfig The configuration for the widget to be created
       * @param {number} index The index of the widget configuration in the array that it was taken from
       */
      processWidget: function alfresco_core_CoreWidgetProcessing__processWidget(rootNode, widgetConfig, index) {
         if (this.filterWidget(widgetConfig))
         {
            var domNode = this.createWidgetDomNode(widgetConfig, rootNode, widgetConfig.className);
            this.createWidget(widgetConfig, domNode, this._registerProcessedWidget, this, index);
         }
      },
      
      /**
       * This function is called from the [processWidget]{@link module:alfresco/core/Core#processWidget} function
       * in order to give a final opportunity for extending classes to prevent the creation of a widget in certain
       * circumstances. This was added to the core initially to allow the 
       * [_MultiItemRendererMixin]{@link module:alfresco/documentlibrary/views/layouts/_MultiItemRendererMixin} 
       * to filter widget creation based on configurable properties of the items being rendered. However it is
       * expected that this can be used as an extension point in other circumstances. 
       *
       * @instance
       * @param {object} widgetConfig The configuration for the widget to be created
       * @returns {boolean} This always returns true by default.
       */
      filterWidget: function alfresco_core_CoreWidgetProcessing__filterWidget(widgetConfig) {
         return true;
      },
      
      /**
       * Used to keep track of all the widgets created as a result of a call to the [processWidgets]{@link module:alfresco/core/Core#processWidgets} function
       * 
       * @instance
       * @type {Array}
       * @default null
       */
      _processedWidgets: null,
      
      /**
       * This is used to countdown the widgets that are still waiting to be created. It is initialised to the size
       * of the widgets array supplied to the [processWidgets]{@link module:alfresco/core/Core#processWidgets} function.
       * 
       * @instance 
       * @type {number}
       * @default null
       */
      _processedWidgetCountdown: null,
      
      /**
       * This function registers the creation of a widget. It decrements the 
       * [_processedWidgetCountdown]{@link module:alfresco/core/Core#_processedWidgetCountdown} attribute
       * and calls the [allWidgetsProcessed]{@link module:alfresco/core/Core#allWidgetsProcessed} function when it reaches zero.
       * 
       * @instance
       * @param {object} widget The widget that has just been processed.
       * @param {number} index The target index of the widget
       */
      _registerProcessedWidget: function alfresco_core_CoreWidgetProcessing___registerProcessedWidget(widget, index) {
         this._processedWidgetCountdown--;
         if (index == null || isNaN(index))
         {
            this._processedWidgets.push(widget);
         }
         else
         {
            this._processedWidgets[index] = widget;
         }
         
         if (this._processedWidgetCountdown == 0)
         {
            this.allWidgetsProcessed(this._processedWidgets);
            this.widgetProcessingComplete = true;
         }
      },
      
      /**
       * This is set from false to true after the [allWidgetsProcessed]{@link module:alfresco/core/Core#allWidgetsProcessed}
       * extension point function is called. It can be used to check whether or not widget processing is complete. 
       * This is to allow for checks that widget processing has been completed BEFORE attaching a listener to the 
       * [allWidgetsProcessed]{@link module:alfresco/core/Core#allWidgetsProcessed} function.
       * 
       * @instance
       * @type {boolean}
       * @default false
       */
      widgetProcessingComplete: false,
      
      /**
       * This is an extension point for handling the completion of calls to [processWidgets]{@link module:alfresco/core/Core#processWidgets}
       * 
       * @instance
       * @param {Array} widgets An array of all the widgets that have been processed
       */
      allWidgetsProcessed: function alfresco_core_CoreWidgetProcessing__allWidgetsProcessed(widgets) {
         this.alfLog("log", "All widgets processed");
      },

      /**
       * Creates a new DOM node for a widget to use. The DOM node contains a child <div> element
       * that the widget will be attached to and an outer <div> element that additional CSS classes
       * can be applied to.
       * 
       * @instance
       * @param {object} widget The widget definition to create the DOM node for
       * @param {element} rootNode The DOM node to create the new DOM node as a child of
       * @param {string} rootClassName A string containing one or more space separated CSS classes to set on the DOM node
       */
      createWidgetDomNode: function alfresco_core_CoreWidgetProcessing__createWidgetDomNode(widget, rootNode, rootClassName) {
         // Add a new <div> element to the "main" domNode (defined by the "data-dojo-attach-point"
         // in the HTML template)...
         var tmp = rootNode;
         if (rootClassName != null && rootClassName != "")
         {
            tmp = domConstruct.create("div", { className: rootClassName}, rootNode);
         }
         return domConstruct.create("div", {}, tmp);
      },
      
      /**
       * This method will instantiate a new widget having requested that its JavaScript resource and
       * dependent resources be downloaded. In principle all of the required resources should be available
       * if the widget is being processed in the context of the Surf framework and dependency analysis of 
       * the page has been completed. However, if this is being performed as an asynchronous event it may 
       * be necessary for Dojo to request additional modules. This is why the callback function is required
       * to ensure that successfully instantiated modules can be kept track of.
       * 
       * @instance
       * @param {object} config The configuration for the widget
       * @param {element} domNode The DOM node to attach the widget to
       * @param {function} callback A function to call once the widget has been instantiated
       * @param {object} callbackScope The scope with which to call the callback
       * @param {number} index The index of the widget to create (this will effect it's location in the 
       * [_processedWidgets]{@link module:alfresco/core/Core#_processedWidgets} array)
       */
      createWidget: function alfresco_core_CoreWidgetProcessing__createWidget(config, domNode, callback, callbackScope, index) {
         
         var _this = this;
         this.alfLog("log", "Creating widget: ",config);
         
         // Make sure we have an instantiation args object...
         var initArgs = (config && config.config && (typeof config.config === 'object')) ? config.config : {};
         
         // Ensure that each widget has a unique id. Without this Dojo seems to occasionally
         // run into trouble trying to re-use an existing id...
         if (typeof initArgs.id == "undefined")
         {
            initArgs.id = config.name.replace(/\//g, "_") + "___" + this.generateUuid();
         }
         
         if (initArgs.generatePubSubScope === true)
         {
            // Generate a new pubSubScope if requested to...
            initArgs.pubSubScope = this.generateUuid();
         }
         else if (initArgs.pubSubScope === undefined)
         {
            // ...otherwise inherit the callers pubSubScope if one hasn't been explicitly configured...
            initArgs.pubSubScope = this.pubSubScope;
         }
         if (initArgs.dataScope === undefined)
         {
            initArgs.dataScope = this.dataScope;
         }
         
         // Create a reference for the widget to be added to. Technically the require statement
         // will need to asynchronously request the widget module - however, assuming the widget
         // has been included in such a way that it will have been included in the generated 
         // module cache then the require call will actually process synchronously and the widget
         // variable will be returned with an assigned value...
         var widget = null;
         
         // Dynamically require the specified widget
         // The use of indirection is done so modules will not rolled into a build (should we do one)
         var requires = [config.name];
         require(requires, function(WidgetType) {
            // Just to be sure, check that no widget doesn't already exist with that id and
            // if it does, generate a new one...
            if (registry.byId(initArgs.id) != null)
            {
               initArgs.id = config.name + "___" + _this.generateUuid();
            }
            
            // Instantiate the new widget
            // This is an asynchronous response so we need a callback method...
            widget = new WidgetType(initArgs, domNode);
            if (_this.widgetsToDestroy == null)
            {
               _this.widgetsToDestroy = [];
               _this.widgetsToDestroy.push(widget);
            }
            _this.alfLog("log", "Created widget", widget);
            widget.startup();
            if (config.assignTo != null)
            {
               _this[config.assignTo] = widget;
            }

            // Set any additional style attributes...
            if (initArgs.style != null && widget.domNode != null)
            {
               domStyle.set(widget.domNode, initArgs.style);
            }

            if (callback)
            {
               // If there is a callback then call it with any provided scope (but default to the
               // "this" as the scope if one isn't provided).
               callback.call((callbackScope != null ? callbackScope : this), widget, index);
            }
         });
         
         if (widget == null)
         {
            this.alfLog("warn", "A widget was not declared so that it's modules were included in the loader cache", config, this);
         }
         return widget;
      },
   });
});