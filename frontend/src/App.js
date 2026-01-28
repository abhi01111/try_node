// import { useState, useEffect } from "react";

// function App() {
//   const [name, setName] = useState("");
//   const [users, setUsers] = useState([]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const res = await fetch("/api/users", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ name }),
//     });

//     const data = await res.json();

//     if (data.success) {
//       setName("");
//       loadUsers(); // refresh list
//     }
//   };

//   const loadUsers = async () => {
//     const res = await fetch("/api/users");
//     const data = await res.json();
//     setUsers(data);
//   };

//   useEffect(() => {
//     loadUsers();
//   }, []);

//   return (
//     <div style={{ textAlign: "center" }}>
//       <h2>MERN App 🚀</h2>

//       <form onSubmit={handleSubmit}>
//         <input
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           placeholder="Enter name"
//         />
//         <button type="submit">Save</button>
//       </form>

//       <h3>Stored Users</h3>

//       {users.map((u, i) => (
//         <p key={i}>{u.name}</p>
//       ))}
//     </div>
//   );
// }

// export default App;


import { useState, useEffect } from "react";

const API_URL = "https://try-node-ogr4.onrender.com/api/users";

function App() {
  const [name, setName] = useState("");
  const [users, setUsers] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();

    // handle both cases (with or without success flag)
    if (res.ok) {
      setName("");
      loadUsers();
    }
  };

  const loadUsers = async () => {
    const res = await fetch(API_URL);
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>MERN App 🚀</h2>

      <form onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name"
        />
        <button type="submit">Save</button>
      </form>

      <h3>Stored Users</h3>

      {users.map((u) => (
        <p key={u._id}>{u.name}</p>
      ))}
    </div>
  );
}

export default App;
