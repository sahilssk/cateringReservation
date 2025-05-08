// auth.js – Authentication and Role Management
auth.onAuthStateChanged(user => {
    if (user) {
      // Redirect logged-in user to their dashboard based on role
      db.collection('users').doc(user.uid).get().then(doc => {
        if (doc.exists) {
          const role = doc.data().role;
          if (role === 'vendor') {
            window.location = 'vendor.html';
          } else if (role === 'admin') {
            window.location = 'admin.html';
          }
        }
      });
    }
  });
  
  // Handle Registration
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value;
      const email = document.getElementById('regEmail').value;
      const password = document.getElementById('regPassword').value;
      const role = document.getElementById('roleSelect').value;
      auth.createUserWithEmailAndPassword(email, password)
        .then(cred => {
          // Create Firestore user profile
          return db.collection('users').doc(cred.user.uid).set({
            name: name,
            email: email,
            role: role
          });
        })
        .then(() => {
          // Redirect to appropriate dashboard
          if (role === 'vendor') {
            window.location = 'vendor.html';
          } else {
            window.location = 'admin.html';
          }
        })
        .catch(err => {
          document.getElementById('signupError').innerText = err.message;
        });
    });
  }
  
  // Handle Login
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      auth.signInWithEmailAndPassword(email, password)
        .then(cred => {
          return db.collection('users').doc(cred.user.uid).get();
        })
        .then(doc => {
          if (doc.exists) {
            const role = doc.data().role;
            if (role === 'vendor') {
              window.location = 'vendor.html';
            } else {
              window.location = 'admin.html';
            }
          }
        })
        .catch(err => {
          document.getElementById('loginError').innerText = err.message;
        });
    });
  }
  