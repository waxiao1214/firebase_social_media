const { db } = require('../util/admin');

exports.getAllScreams =  (req, res) => {
  admin
  .firestore()
  .collection('screams')
  .orderBy('createAt', 'desc')
  .get()
  .then(data => {
    let screams = [];
    data.forEach(doc => {
      screams.push({
        screamId : doc.id,
        body : doc.data().body,
        userHandle : doc.data().userHandle,
        createAt : doc.data().createAt
      })
    });
    return res.json(screams);
  })
  .catch(err => console.error(err));
}

exports.postOneScreams = (req, res) => {
  if (req.body.body.trim() === "") {
    return res.status(400).json({ body : "body must not be empty"});
  }

  const newScream = {
    body : req.body.body,
    userHandle : req.body.handle,
    createAt : new Date().toISOString()
  };
  
  admin.firestore()
    .collection('screams')
    .add(newScream)
    .then(doc => {
      return res.json({ message  :`document ${doc.id} created successfully`});
    })
    .catch(err => {
      res.status(500).json({ error : 'something went wrong'});
      console.error(err);
    })
}