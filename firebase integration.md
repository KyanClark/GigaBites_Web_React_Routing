## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **“Add project”**, give it a name, and follow the prompts.
3. In your new project, under **Project settings → Your apps**, click the **</>** (Web) icon.
4. Register your app and copy the Firebase config object you’re shown (you’ll need it in Step 3).

---

## 2. Install the Firebase SDK

In your React project folder, run:

```bash
npm install firebase
# or
yarn add firebase
```

---

## 3. Store Your Firebase Config Securely

Create a file called `.env.local` at your project root (this works with CRA and Vite). Add:

```bash
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

> **Note:** In Vite, prefix env vars with `VITE_` instead of `REACT_APP_`.

---

## 4. Initialize Firebase

Create `src/firebase.js` (or `.ts` if you’re in TypeScript):

```javascript
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth }          from "firebase/auth";
import { getFirestore }     from "firebase/firestore";

// Pull in your env vars
const firebaseConfig = {
  apiKey:             process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:         process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:          process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:      process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:  process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:              process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app      = initializeApp(firebaseConfig);
export const auth      = getAuth(app);
export const firestore = getFirestore(app);
```

---

## 5. (Optional) Create a React Context for Auth

Wrapping your app in an Auth provider makes it easy to access the current user anywhere:

```jsx
// src/contexts/FirebaseAuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext({ user: null });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe; // cleanup on unmount
  }, []);
  
  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to consume auth context
export const useAuth = () => useContext(AuthContext);
```

Then wrap your app:

```jsx
// src/index.js (or main.jsx)
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { AuthProvider } from "./contexts/FirebaseAuthContext";

ReactDOM.render(
  <AuthProvider>
    <App />
  </AuthProvider>,
  document.getElementById("root")
);
```

---

## 6. Use Firebase Auth in Your Components

Here’s an example of a simple sign‑in form:

```jsx
// src/components/SignIn.jsx
import { useState }        from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth }            from "../firebase";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // user is now signed in
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        placeholder="Email" 
        value={email}
        onChange={e => setEmail(e.target.value)} />
      <input 
        type="password" 
        placeholder="Password" 
        value={pass}
        onChange={e => setPass(e.target.value)} />
      <button type="submit">Sign In</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}
```

---

## 7. Read/Write Firestore Data

Here’s how to add a document and listen to a collection:

```javascript
// Writing:
import { collection, addDoc } from "firebase/firestore";
import { firestore }         from "../firebase";

async function addTodo(text) {
  try {
    await addDoc(collection(firestore, "todos"), { text, createdAt: Date.now() });
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

// Reading:
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

function TodoList() {
  const [todos, setTodos] = useState([]);
  
  useEffect(() => {
    const q = query(collection(firestore, "todos"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, snapshot => {
      setTodos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);
  
  return (
    <ul>
      {todos.map(todo => <li key={todo.id}>{todo.text}</li>)}
    </ul>
  );
}
```

---

## 8. Next Steps & Best Practices

* **Security Rules:** Before shipping, configure Firestore and Auth security rules in the Firebase Console.
* **Environment:** Never commit your `.env.local` with real API keys to public repos.
* **Modularization:** As your app grows, break out Firebase functions (e.g. `src/firebase/auth.js`, `src/firebase/db.js`).
* **Performance:** Use batched writes, pagination, and indexing where appropriate.

With this setup you’ll have Firebase Auth and Firestore fully wired into your React app—ready to build signup flows, user‑specific data, and real‑time features!
