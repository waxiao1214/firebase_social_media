const functions = require('firebase-functions');

const app = require('express')();

const admin = require('firebase-admin');
admin.initializeApp()
const db = admin.firestore();

const config = {
  apiKey: "AIzaSyBqbcTKwXVbd3j5u_JoVP7GWspIoRhCc3E",
  authDomain: "socialmedia-a2098.firebaseapp.com",
  databaseURL: "https://socialmedia-a2098.firebaseio.com",
  projectId: "socialmedia-a2098",
  storageBucket: "socialmedia-a2098.appspot.com",
  messagingSenderId: "970562400384",
  appId: "1:970562400384:web:28a5875b28831275423665",
  measurementId: "G-7CPCT6VQ6N"
}

const firebase = require('firebase');
firebase.initializeApp(config)

const FBAuth =  (req, res, next) => {
  let idToken;
  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    idToken = req.headers.authorization.split('Bearer ')[1]
  } else {
    console.error('Not token found')
    return res.status(403).json({ error : 'Unauthorized'})
  }

  admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
      req.user = decodedToken;
      console.log(decodedToken);
      return db.collection('users')
        .where('userId', '==', req.user.uid)
        .limit(1)
        .get();
    })
    .then(data => {
      req.user.handle = data.docs[0].data().handle;
      return next();
    })
    .catch(err => {
      console.error('Error while verifying token ', err);
      return res.status(403).json(err);
    })
}

const isEmpty = (string) => {
  if(string.trim() === "") return true;
  else return false;
}

const isEmail = (email) => {
  // const regEX = /[a]/
  if(email !== "") return true;
  else return false;
}

app.get('/screams', (req, res) => {
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
});

app.post('/scream', FBAuth, (req, res) => {
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
});

app.post('/signup', (req, res) => {
  let token, userId;
  const newUser = {
    email : req.body.email,
    password : req.body.password,
    confirmPassword : req.body.confirmPassword,
    handle : req.body.handle
  };

  let errors = {};

  if(isEmpty(newUser.email)) {
    errors.email = "Email must not be empty"
  }
  else if(!isEmail(newUser.email)) {
    errors.email = "Must be a valid email address"
  }

  if(isEmpty(newUser.password)) errors.password = "Must not be empty"
  if(newUser.password !== newUser.confirmPassword) errors.confirmPassword
  if(isEmpty(newUser.handle)) errors.handle = "Must not be empty"

  if(Object.keys(errors).lengh > 0) return res.status(400).json(errors)

  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if(doc.exists) {
        return res.status(400).json({ handle : "this handle is already taken"});
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password)
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken;
      const userCredentials = {
        handle : newUser.handle,
        email : newUser.email,
        createdAt : new Date().toISOString(),
        userId
      }
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })

    .then((data) => {
      return res.status(201).json({ token })
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error : err.code })
    })
});
app.post('/signin', (req, res) => {
  const user = {
    email : req.body.email,
    password : req.body.password
  };

  let errors = {};

  if(isEmpty(user.email)) errors.email = "Must not be empty"
  if(isEmpty(user.password)) errors.password = "Must not be empty"

  if(Object.keys(errors).length > 0) return res.status(400).json(errors);

  firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken()
    })
    .then(token => {
      return res.json({ token });
    })
    .catch((err) => {
      console.error(err);
      if(err.code === "auth/wrong-password") {
        return res.status(403).json({ general : "wrong password, Please try again."})
      }
      return res.status(500).json( { error : err.code });
    });
});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello World!");
// });
exports.api = functions.https.onRequest(app);