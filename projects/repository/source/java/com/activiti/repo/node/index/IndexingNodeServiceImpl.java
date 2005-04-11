package com.activiti.repo.node.index;

import java.io.Serializable;
import java.util.Collection;
import java.util.Map;

import com.activiti.repo.node.AssociationExistsException;
import com.activiti.repo.node.InvalidNodeRefException;
import com.activiti.repo.node.NodeService;
import com.activiti.repo.ref.ChildAssocRef;
import com.activiti.repo.ref.EntityRef;
import com.activiti.repo.ref.NodeRef;
import com.activiti.repo.ref.Path;
import com.activiti.repo.ref.QName;
import com.activiti.repo.search.Indexer;
import com.activiti.repo.search.IndexerComponent;

/**
 * A lightweight <code>NodeService</code> that delegates the work to a
 * <i>proper</i> <code>NodeService</code>, but also ensures that the
 * required calls are made to the {@link com.activiti.repo.search.Indexer indexer}.
 * <p>
 * The use of a delegate to perform all the <b>node</b> manipulation means that
 * implementations of the stores can be swapped in and out but still get indexed.
 * 
 * @author Derek Hulley
 */
public class IndexingNodeServiceImpl implements NodeService
{
    private NodeService nodeServiceDelegate;
    private Indexer indexer;

    /**
     * @param nodeServiceDelegate the <code>NodeService</code> that will do the node work
     */
    public void setNodeServiceDelegate(NodeService nodeServiceDelegate)
    {
        this.nodeServiceDelegate = nodeServiceDelegate;
    }
    
    /**
     * @param indexer the component that performs the indexing operations
     */
    public void setIndexer(Indexer indexer)
    {
        this.indexer = indexer;
    }
    
    /**
     * @see #createNode(NodeRef, QName, String, Map<QName,Serializable>)
     */
    public ChildAssocRef createNode(NodeRef parentRef, QName qname, String nodeType) throws InvalidNodeRefException
    {
        return this.createNode(parentRef, qname, nodeType, null);
    }

    /**
     * Delegates to the assigned {@link #nodeServiceDelegate} before using the
     * {@link #indexer} to update the search index.
     * 
     * @see IndexerComponent#createNode(ChildAssocRef)
     */
    public ChildAssocRef createNode(NodeRef parentRef, QName qname, String nodeType, Map<QName, Serializable> properties) throws InvalidNodeRefException
    {
        // call delegate
        ChildAssocRef assocRef = nodeServiceDelegate.createNode(parentRef, qname, nodeType, properties);
        // update index
        indexer.createNode(assocRef);
        // done
        return assocRef;
    }

    /**
     * Delegates to the assigned {@link #nodeServiceDelegate} before using the
     * {@link #indexer} to update the search index.
     * 
     * @see IndexerComponent#deleteNode(ChildAssocRef)
     */
    public void deleteNode(NodeRef nodeRef) throws InvalidNodeRefException
    {
        // TODO: The NodeService should just return the element refs deleted
        
        // get the first primary assoc to this node - it is the last path element
        Path path = getPath(nodeRef);
        Path.ChildAssocElement element = (Path.ChildAssocElement) path.last();
        ChildAssocRef assoc = element.getRef();
        // call delegate
        nodeServiceDelegate.deleteNode(nodeRef);
        // update index
        indexer.deleteNode(assoc);
        // done
    }

    /**
     * Delegates to the assigned {@link #nodeServiceDelegate} before using the
     * {@link #indexer} to update the search index.
     * 
     * @see IndexerComponent#createChildRelationship(ChildAssocRef)
     */
    public ChildAssocRef addChild(NodeRef parentRef, NodeRef childRef, QName qname) throws InvalidNodeRefException
    {
        // call delegate
        ChildAssocRef assoc = nodeServiceDelegate.addChild(parentRef, childRef, qname);
        // update index
        indexer.createChildRelationship(assoc);
        // done
        return assoc;
    }

    /**
     * Delegates to the assigned {@link #nodeServiceDelegate} before using the
     * {@link #indexer} to update the search index.
     * 
     * @see IndexerComponent#deleteChildRelationship(ChildAssocRef)
     * @see IndexerComponent#deleteNode(ChildAssocRef)
     */
    public Collection<EntityRef> removeChild(NodeRef parentRef, NodeRef childRef) throws InvalidNodeRefException
    {
        // call delegate
        Collection<EntityRef> entityRefs = nodeServiceDelegate.removeChild(parentRef, childRef);
        // update index
        for (EntityRef ref : entityRefs)
        {
            if (ref instanceof ChildAssocRef)
            {
                ChildAssocRef assoc = (ChildAssocRef) ref;
                if (assoc.isPrimary())
                {
                    // the node will have been deleted as well
                    indexer.deleteNode(assoc);
                }
                else
                {
                    indexer.deleteChildRelationship(assoc);
                }
            }
        }
        return entityRefs;
    }

    /**
     * Delegates to the assigned {@link #nodeServiceDelegate} before using the
     * {@link #indexer} to update the search index.
     * 
     * @see IndexerComponent#deleteChildRelationship(ChildAssocRef)
     * @see IndexerComponent#deleteNode(ChildAssocRef)
     */
    public Collection<EntityRef> removeChildren(NodeRef parentRef, QName qname) throws InvalidNodeRefException
    {
        // call delegate
        Collection<EntityRef> entityRefs = nodeServiceDelegate.removeChildren(parentRef, qname);
        // update index
        for (EntityRef ref : entityRefs)
        {
            if (ref instanceof ChildAssocRef)
            {
                ChildAssocRef assoc = (ChildAssocRef) ref;
                if (assoc.isPrimary())
                {
                    // the node will have been deleted as well
                    indexer.deleteNode(assoc);
                }
                else
                {
                    indexer.deleteChildRelationship(assoc);
                }
            }
        }
        return entityRefs;
    }

    /**
     * Delegates to the assigned {@link #nodeServiceDelegate} before using the
     * {@link #indexer} to update the search index.
     * 
     * @see IndexerComponent#updateNode(NodeRef)
     */
    public void setProperties(NodeRef nodeRef, Map<QName, Serializable> properties) throws InvalidNodeRefException
    {
        // call delegate
        nodeServiceDelegate.setProperties(nodeRef, properties);
        // update index
        indexer.updateNode(nodeRef);
    }

    /**
     * Delegates to the assigned {@link #nodeServiceDelegate} before using the
     * {@link #indexer} to update the search index.
     * 
     * @see IndexerComponent#updateNode(NodeRef)
     */
    public void setProperty(NodeRef nodeRef, QName qname, Serializable value) throws InvalidNodeRefException
    {
        // call delegate
        nodeServiceDelegate.setProperty(nodeRef, qname, value);
        // update index
        indexer.updateNode(nodeRef);
    }

    /**
     * Direct delegation to assigned {@link #nodeServiceDelegate}
     */
    public void createAssociation(NodeRef sourceRef, NodeRef targetRef, QName qname) throws InvalidNodeRefException, AssociationExistsException
    {
        nodeServiceDelegate.createAssociation(sourceRef, targetRef, qname);
    }

    /**
     * Direct delegation to assigned {@link #nodeServiceDelegate}
     */
    public void removeAssociation(NodeRef sourceRef, NodeRef targetRef, QName qname) throws InvalidNodeRefException
    {
        nodeServiceDelegate.removeAssociation(sourceRef, targetRef, qname);
    }

    /**
     * Direct delegation to assigned {@link #nodeServiceDelegate}
     */
    public Collection<NodeRef> getAssociationSources(NodeRef targetRef, QName qname) throws InvalidNodeRefException
    {
        return nodeServiceDelegate.getAssociationSources(targetRef, qname);
    }

    /**
     * Direct delegation to assigned {@link #nodeServiceDelegate}
     */
    public Collection<NodeRef> getAssociationTargets(NodeRef sourceRef, QName qname) throws InvalidNodeRefException
    {
        return nodeServiceDelegate.getAssociationTargets(sourceRef, qname);
    }

    /**
     * Direct delegation to assigned {@link #nodeServiceDelegate}
     */
    public Collection<ChildAssocRef> getChildAssocs(NodeRef nodeRef) throws InvalidNodeRefException
    {
        return nodeServiceDelegate.getChildAssocs(nodeRef);
    }

    /**
     * Direct delegation to assigned {@link #nodeServiceDelegate}
     */
    public Path getPath(NodeRef nodeRef) throws InvalidNodeRefException
    {
        return nodeServiceDelegate.getPath(nodeRef);
    }

    /**
     * Direct delegation to assigned {@link #nodeServiceDelegate}
     */
    public Collection<Path> getPaths(NodeRef nodeRef, boolean primaryOnly) throws InvalidNodeRefException
    {
        return nodeServiceDelegate.getPaths(nodeRef, primaryOnly);
    }

    /**
     * Direct delegation to assigned {@link #nodeServiceDelegate}
     */
    public NodeRef getPrimaryParent(NodeRef nodeRef) throws InvalidNodeRefException
    {
        return nodeServiceDelegate.getPrimaryParent(nodeRef);
    }

    /**
     * Direct delegation to assigned {@link #nodeServiceDelegate}
     */
    public Collection<NodeRef> getParents(NodeRef nodeRef) throws InvalidNodeRefException
    {
        return nodeServiceDelegate.getParents(nodeRef);
    }

    /**
     * Direct delegation to assigned {@link #nodeServiceDelegate}
     */
    public Map<QName, Serializable> getProperties(NodeRef nodeRef) throws InvalidNodeRefException
    {
        return nodeServiceDelegate.getProperties(nodeRef);
    }

    /**
     * Direct delegation to assigned {@link #nodeServiceDelegate}
     */
    public Serializable getProperty(NodeRef nodeRef, QName qname) throws InvalidNodeRefException
    {
        return nodeServiceDelegate.getProperty(nodeRef, qname);
    }

    /**
     * Direct delegation to assigned {@link #nodeServiceDelegate}
     */
    public String getType(NodeRef nodeRef) throws InvalidNodeRefException
    {
        return nodeServiceDelegate.getType(nodeRef);
    }
}
