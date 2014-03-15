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
 * This is a work-in-progress widget... use with caution.
 * 
 * @module alfresco/forms/Form
 * @extends dijit/_WidgetBase
 * @mixes dijit/_TemplatedMixin
 * @mixes module:alfresco/core/Core
 * @mixes module:alfresco/core/CoreWidgetProcessing
 * @author Dave Draper
 */
define(["dojo/_base/declare",
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin",
        "dijit/form/Form",
        "dojo/_base/xhr",
        "alfresco/core/Core",
        "alfresco/core/CoreWidgetProcessing",
        "dojo/text!./templates/Form.html",
        "dojo/_base/lang",
        "alfresco/buttons/AlfButton",
        "dojo/_base/array",
        "dojo/json",
        "dijit/registry"], 
        function(declare, _Widget, _Templated, Form, xhr, AlfCore, CoreWidgetProcessing, template, lang, AlfButton, array, json, registry) {
   
   return declare([_Widget, _Templated, AlfCore, CoreWidgetProcessing], {
      
      /**
       * An array of the i18n files to use with this widget.
       * 
       * @instance
       * @type {object[]}
       * @default [{i18nFile: "./i18n/AlfDialog.properties"}]
       */
      i18nRequirements: [{i18nFile: "./i18n/Form.properties"}],
      
      /**
       * The HTML template to use for the widget.
       * @instance
       * @type {String}
       */
      templateString: template,
      
      /**
       * @instance
       * @type {object}
       * @default null
       */
      _form: null,
      
      /**
       * @instance
       * @type {object[]}
       * @default null
       */
      widgets: null,
      
      /**
       * The URL that the form will be posted to
       * 
       * @instance
       * @type {string}
       * @default ""
       */
      postUrl: "",
      
      /**
       * @instance
       * @type {boolean}
       * @default false
       */
      convertFormToJsonString: false,
      
      /**
       * This will be instantiated as an array and used to keep track of any controls that report themselves as being
       * in an invalid state. The "OK" button for submitting the form should only be enabled when this list is empty.
       * 
       * @instance
       * @type {object[]}
       * @default null
       */
      invalidFormControls: null,
      
      /**
       * A reference to the "OK" button for the form.
       * TODO: It should be possible to configure alternative labels for the button
       * 
       * @instance
       * @type {object}
       * @default null
       */
      okButton: null,
      
      /**
       * A reference to the "Cancel" button for the form.
       * TODO: It should be possible to configure alternative labels for the button.
       * 
       * @instance
       * @type {object}
       * @default null
       */
      cancelButton: null,
      
      /**
       * Indicates that the a new pubSubScope should be generated for this widget so that it's
       * form controls will be scoped to only communicate with this instance and not "pollute"
       * any other forms that may also be on the page.
       * 
       * @instance
       * @type {boolean}
       * @default true
       */
      scopeFormControls: true,
      
      /**
       * Indicates whether or not to create buttons for this form.
       *
       * @instance
       * @type {boolean}
       * @default true
       */
      displayButtons: true,
      
      /**
       * @instance
       */
      postCreate: function alfresco_forms_Form__postCreate() {
         
         // Setup some arrays for recording the valid and invalid widgets...
         this.invalidFormControls = [];
         
         // Generate a new pubSubScope if required...
         if (this.scopeFormControls == true && this.pubSubScope == "")
         {
            this.pubSubScope = this.generateUuid();
         }
         
         this._form = new Form({
            id: this.generateUuid()
         }, this.formNode);
         
         // Set up the handlers for form controls reporting themselves as valid or invalid
         // following user update...
         this.alfSubscribe("ALF_INVALID_CONTROL", lang.hitch(this, "onInvalidField"));
         this.alfSubscribe("ALF_VALID_CONTROL", lang.hitch(this, "onValidField"));

         // Add the widgets to the form...
         // The widgets should automatically inherit the pubSubScope from the form to scope communication
         // to this widget. However, this widget will need to be assigned with a pubSubScope... 
         if (this.widgets)
         {
            this.processWidgets(this.widgets, this._form.domNode);
         }

         if (this.displayButtons == true)
         {
            // Create the buttons for the form...
            this.createButtons();
         }
      },
      
      /**
       * Handles the reporting of an invalid field. This will disable the "OK" button if it has
       * been created to prevent users from attempting to submit invalid data.
       * 
       * @instance
       * @param {object} payload The published details of the invalid field.
       */
      onInvalidField: function alfresco_forms_Form__onInvalidField(payload) {
         var alreadyCaptured = array.some(this.invalidFormControls, function(item) {
            return item == payload.fieldId;
         });
         if (!alreadyCaptured)
         {
            this.invalidFormControls.push(payload.fieldId);
         }
         if (this.okButton)
         {
            this.okButton.set("disabled", "true");
         }
      },
      
      /**
       * Handles the reporting of a valid field. If the field was previously recorded as being
       * invalid then it is removed from the [invalidFormControls]{@link module:alfresco/forms/Form#invalidFormControls}
       * attribute and it was the field was the only field in error then the "OK" button is 
       * enabled. 
       * 
       * @instance
       * @param {object} payload The published details of the field that has become valid
       */
      onValidField: function alfresco_forms_Form__onValidField(payload) {
         this.invalidFormControls = array.filter(this.invalidFormControls, function(item) {
            return item != payload.fieldId;
         });
         if (this.okButton)
         {
            this.okButton.set("disabled", this.invalidFormControls.length > 0);
         }
         // Update the publishPayload of the "OK" button so that when it is clicked
         // it will provide the current form data...
         var formValue = this.getValue();
         array.forEach(this.additionalButtons, function(button, index) {
            if (button.publishPayload != null)
            {
               lang.mixin(button.publishPayload, formValue);
            }
            else
            {
               button.publishPayload = formValue;
            }
         });
      },
      
      /**
       * Indicates whether or not the "OK" button should be displayed or not.
       * 
       * @instance
       * @type {boolean}
       * @default true
       */
      showOkButton: true,
      
      /**
       * Indicates whether or not the "Cancel" button should be displayed or not.
       * 
       * @instance
       * @type {boolean}
       * @default true
       */
      showCancelButton: true,
      
      /**
       * The label that will be used for the "OK" button. This value can either be an explicit
       * localised value or an properties key that will be used to retrieve a localised value.
       * 
       * @instance
       * @type {string}
       * @default "form.button.ok.label"
       */
      okButtonLabel: "form.button.ok.label",
      
      /**
       * @instance 
       * @type {string}
       * @default null
       */
      okButtonPublishTopic: null,
      
      /**
       * @instance
       * @type {object}
       * @defualt null
       */
      okButtonPublishPayload: null,
      
      /**
       * @instance 
       * @type {string}
       * @default null
       */
      okButtonPublishGlobal: null,

      /**
       * The label that will be used for the "Cancel" button. This value can either be an explicit
       * localised value or an properties key that will be used to retrieve a localised value.
       *
       * @instance
       * @type {string}
       * @default "form.button.cancel.label"
       */
      cancelButtonLabel: "form.button.cancel.label",
      
      /**
       * @instance
       * @type {string}
       * @default null
       */
      cancelButtonPublishTopic: null,
      
      /**
       * @instance
       * @type {object}
       * @defualt null
       */
      cancelButtonPublishPayload: null,

      /**
       * @instance
       * @type {object}
       * @defualt null
       */
      cancelButtonPublishGlobal: null,
      
      /**
       * This can be configured with details of additional buttons to be included with the form.
       * Any button added will have the publishPayload set with the form value. 
       * 
       * @instance
       * @type {object[]}
       * @default null
       */
      widgetsAdditionalButtons: null,
      
      /**
       * @instance
       * @type {object[]}
       * @default null
       */
      additionalButtons: null,
      
      /**
       * Creates the buttons for the form. This can be overridden to change the buttons that are displayed.
       * 
       * @instance
       */
      createButtons: function alfresco_forms_Form__createButtons() {
         
         if (this.showOkButton == true)
         {
            this.okButton = new AlfButton({
               pubSubScope: this.pubSubScope,
               label: this.message(this.okButtonLabel),
               additionalCssClasses: "confirmationButton",
               publishTopic: this.okButtonPublishTopic,
               publishPayload: this.okButtonPublishPayload,
               publishGlobal: this.okButtonPublishGlobal
            }, this.okButtonNode);
         }
         if (this.showCancelButton == true)
         {
            this.cancelButton = new AlfButton({
               pubSubScope: this.pubSubScope,
               label: this.message(this.cancelButtonLabel),
               additionalCssClasses: "cancelButton",
               publishTopic: this.cancelButtonPublishTopic,
               publishPayload: this.cancelButtonPublishPayload,
               publishGlobal: this.cancelButtonPublishGlobal
            }, this.cancelButtonNode);
         }
         
         // If there are any other additional buttons to add, then process them here...
         if (this.widgetsAdditionalButtons != null)
         {
            this.additionalButtons = [];
            this.processWidgets(this.widgetsAdditionalButtons, this.buttonsNode);
         }
         else
         {
            this.additionalButtons = registry.findWidgets(this.buttonsNode);
         }
      },
      
      /**
       * Makes a call to the [validate]{@link module:alfresco/forms/Form#validate} function to check the initial
       * state of the form.
       * 
       * @instance
       */
      allWidgetsProcessed: function alfresco_forms_Form__allWidgetsProcessed(widgets) {
         // If additional button configuration has been processed, then get a reference to ALL the buttons...
         if (this.widgetsAdditionalButtons != null && 
            this.additionalButtons != null &&
            this.additionalButtons.length == 0)
         {
            this.additionalButtons = registry.findWidgets(this.buttonsNode);
         }
         array.forEach(widgets, function(widget, i) {
            if (widget.publishValue && typeof widget.publishValue == "function")
            {
               widget.publishValue();
            }
         });
         this.validate();
      },
      
      /**
       * @instance
       * @return {object}
       */
      getValue: function alfresco_forms_Form__getValue() {
         var values = {};
         if (this._form)
         {
            array.forEach(this._form.getChildren(), function(entry, i) {

               // Only include field values if the control is NOT hidden or disabled
               // unless specifically requested by the configuration. This allows
               // multiple controls to represent a single field but also allows intentionally
               // hidden fields to still have data submitted
               if (((entry._visible !== undefined && entry._visible == false) ||
                    (entry._disabled !== undefined && entry._disabled == true)) &&
                   (entry.postWhenHiddenOrDisabled !== undefined && entry.postWhenHiddenOrDisabled == false))
               {
                  // Don't set the value (line below is just to allow debug point to be set)
               }
               else
               {
                  values[entry.get("name")] = entry.getValue();
               }
            });
         }
         this.alfLog("log", "Returning form values: ", values);
         return values;
      },
      
      /**
       * @instance
       * @param {object} values The values to set
       */
      setValue: function alfresco_forms_Form__setValue(values) {
         this.alfLog("log", "Setting form values: ", values);
         if (values && values instanceof Object)
         {
            if (this._form)
            {
               array.forEach(this._form.getChildren(), function(entry, i) {
                  if (((entry._visible !== undefined && entry._visible == false) ||
                       (entry._disabled !== undefined && entry._disabled == true)) &&
                      (entry.noValueUpdateWhenHiddenOrDisabled !== undefined && entry.noValueUpdateWhenHiddenOrDisabled == true))
                  {
                     // Don't set the value as the field is hidden or disabled and has requested that it not be updated
                     // in these circumstances. The typical reason for this is that multiple controls represent a single
                     // field and it is not the displayed control so shouldn't be updated to preserve its default value.
                  }
                  else
                  {
                     entry.setValue(values[entry.get("name")]);
                  }
               });
            }
         }
         this.validate();
      },
      
      /**
       * @instance
       * @returns {boolean}
       */
      validate: function alfresco_forms_Form__validate() {
         this.alfLog("log", "Validating form", this._form);
         
         array.forEach(this._processedWidgets, function(widget, i) {
            if (widget.publishValue && typeof widget.publishValue == "function")
            {
               widget.validate();
            }
         });
         
         // The form is valid if there are no invalid form controls...
         return this.invalidFormControls.length == 0;
      }
   });
});