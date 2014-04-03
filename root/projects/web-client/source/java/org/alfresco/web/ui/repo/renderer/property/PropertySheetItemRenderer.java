/*
 * Copyright (C) 2005-2010 Alfresco Software Limited.
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
package org.alfresco.web.ui.repo.renderer.property;

import java.io.IOException;
import java.util.List;

import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;

import org.alfresco.web.ui.common.Utils;
import org.alfresco.web.ui.common.renderer.BaseRenderer;

/**
 * Renderer for a PropertySheetItem component
 * 
 * @author gavinc
 */
public class PropertySheetItemRenderer extends BaseRenderer
{
   /**
    * @see javax.faces.render.Renderer#encodeBegin(javax.faces.context.FacesContext, javax.faces.component.UIComponent)
    */
   public void encodeBegin(FacesContext context, UIComponent component) throws IOException
   {
      if (component.isRendered() == false)
      {
         return;
      }

      // NOTE: we close off the first <td> generated by the property sheet's grid renderer
      context.getResponseWriter().write("</td>");
   }

   /**
    * @see javax.faces.render.Renderer#encodeChildren(javax.faces.context.FacesContext, javax.faces.component.UIComponent)
    */
   @SuppressWarnings("unchecked")
   public void encodeChildren(FacesContext context, UIComponent component) throws IOException
   {
      if (component.isRendered() == false)
      {
         return;
      }
      
      ResponseWriter out = context.getResponseWriter();
      
      // make sure there are 2 or 3 child components
      int count = component.getChildCount();
      
      if (count == 2 || count == 3)
      {
         // get the label and the control
         List<UIComponent> children = component.getChildren();
         UIComponent label = children.get(0);
         UIComponent control = children.get(1);
         
         // encode the mandatory marker component if present
         if (count == 3)
         {
            out.write("<td>");
            UIComponent mandatoryMarker = children.get(2);
            Utils.encodeRecursive(context, mandatoryMarker);
            out.write("</td>");
         }
         else
         {
            // output an empty column
            out.write("<td>&nbsp;</td>");
         }
         
         // place a style class on the label column if necessary
         String labelStylceClass = (String)component.getParent().getAttributes().get("labelStyleClass");
         out.write("<td");
         if (labelStylceClass != null)
         {
            outputAttribute(out, labelStylceClass, "class");
         }
         
         // close the <td> 
         out.write(">");
         // encode the label
         Utils.encodeRecursive(context, label);
         // encode the control
         out.write("</td><td>");
         Utils.encodeRecursive(context, control);
         
         // NOTE: we'll allow the property sheet's grid renderer close off the last <td>
      }
   }

   /**
    * @see javax.faces.render.Renderer#encodeEnd(javax.faces.context.FacesContext, javax.faces.component.UIComponent)
    */
   public void encodeEnd(FacesContext context, UIComponent component) throws IOException
   {
      // we don't need to do anything in here
   }

   /**
    * @see javax.faces.render.Renderer#getRendersChildren()
    */
   public boolean getRendersChildren()
   {
      return true;
   }
}