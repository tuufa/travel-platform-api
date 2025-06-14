const shareCollection = async (req, res) => {
  try {
    const { collectionId, email } = req.body;
    
    const collection = await collectionModel.getCollectionById(collectionId);
    if (!collection || collection.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Collection not found or not owned by user' });
    }
    
    
    if (collection.is_public) {
      res.json({ 
        message: 'Collection is public and can be shared with this link',
        link: `/collections/${collectionId}`
      });
    } else {
      res.json({
        message: 'Share this temporary link (expires in 7 days)',
        link: `/collections/${collectionId}?token=${generateShareToken(collectionId)}`
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};