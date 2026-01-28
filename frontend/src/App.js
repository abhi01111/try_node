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

const API_BASE = "https://try-node-0gr4.onrender.com/";

function App() {
  const [name, setName] = useState("");
  const [users, setUsers] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await fetch(`${API_BASE}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",          // ✅ FIX 304
      body: JSON.stringify({ name }),
    });

    setName("");
    loadUsers();                  // reload after save
  };

  const loadUsers = async () => {
    const res = await fetch(`${API_BASE}/api/users`, {
      cache: "no-store",          // ✅ FIX 304
    });

    const data = await res.json();
    console.log("Users from API:", data); // optional debug
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
          required
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
