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
package org.alfresco.web.bean.actions.handlers;

import java.io.Serializable;
import java.text.MessageFormat;
import java.util.Map;

import javax.faces.context.FacesContext;
import javax.faces.model.SelectItem;

import org.alfresco.repo.action.executer.RemoveFeaturesActionExecuter;
import org.alfresco.service.namespace.QName;
import org.alfresco.web.app.Application;
import org.alfresco.web.bean.actions.BaseActionWizard;
import org.alfresco.web.bean.repository.Repository;
import org.alfresco.web.bean.wizard.IWizardBean;

/**
 * Action handler for the "remove-features" action.
 * 
 * @author gavinc
 */
public class RemoveFeaturesHandler extends BaseActionHandler
{
   private static final long serialVersionUID = 8725616196918341435L;
   
   protected static final String PROP_ASPECT = "aspect";
   
   public String getJSPPath()
   {
      return getJSPPath(RemoveFeaturesActionExecuter.NAME);
   }

   public void prepareForSave(Map<String, Serializable> actionProps, 
         Map<String, Serializable> repoProps)
   {
      QName aspect = Repository.resolveToQName((String)actionProps.get(PROP_ASPECT));
      repoProps.put(RemoveFeaturesActionExecuter.PARAM_ASPECT_NAME, aspect);
   }

   public void prepareForEdit(Map<String, Serializable> actionProps, 
         Map<String, Serializable> repoProps)
   {
      QName aspect = (QName)repoProps.get(RemoveFeaturesActionExecuter.PARAM_ASPECT_NAME);
      actionProps.put(PROP_ASPECT, aspect.toString());
   }

   public String generateSummary(FacesContext context, IWizardBean wizard, 
         Map<String, Serializable> actionProps)
   {
      String label = null;
      String aspect = (String)actionProps.get(PROP_ASPECT);
         
      // find the label used by looking through the SelectItem list
      for (SelectItem item : ((BaseActionWizard)wizard).getRemovableAspects())
      {
         if (item.getValue().equals(aspect))
         {
            label = item.getLabel();
            break;
         }
      }

      return MessageFormat.format(Application.getMessage(context, "action_remove_features"),
            new Object[] {label});
   }

}