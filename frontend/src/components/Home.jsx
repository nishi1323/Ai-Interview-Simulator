import { useState, useEffect } from "react";
import axios from "axios";
import "../App.css";

function Home() {
  const token = localStorage.getItem("token");

  function logout() {
    window.location.href = "/login";
  }

  useEffect(() => {
    if (!token) {
      logout();
      return;
    }

    const interval = setInterval(() => {
      axios
        .get("http://localhost:8080/verify", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then(() => {
          // Token is valid
        })
        .catch((error) => {
          alert("Token Expired, Please Login Again");
          logout();
        });
    }, 5000);

    return () => clearInterval(interval);
  }, [token]);

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [searchId, setSearchId] = useState("");

  // Get ALL users
  async function getUsers() {
    try {
      const response = await axios.get(
        "http://localhost:8080/get"
      );

      console.log(response.data);

      setUsers(response.data);
    } catch (error) {
      console.log(error);
      alert("Failed to get users");
      setUsers([]);
    }
  }

  // Search user by ID
  async function searchUser() {
    if (!searchId) {
      alert("Please enter User ID");
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:8080/get/${searchId}`
      );

      setUsers([response.data]);
    } catch (error) {
      console.log(error);
      alert("User not found");
      setUsers([]);
    }
  }

  // Edit user
  function editUser(user) {
    setId(user.id);
    setName(user.name);
    setEmail(user.email);

    setShowModal(true);
  }

  // Update user
  async function updateUser() {
    try {
      await axios.put(
        `http://localhost:8080/update/${id}`,
        {
          name: name,
          email: email,
        }
      );

      alert("User Updated Successfully");

      setShowModal(false);

      setId("");
      setName("");
      setEmail("");

      // Refresh all users
      getUsers();
    } catch (error) {
      console.log(error);
      alert("Update Failed");
    }
  }

  // Delete user
  async function deleteUser(id) {
    try {
      await axios.delete(
        `http://localhost:8080/delete/${id}`
      );

      alert("User Deleted Successfully");

      // Refresh all users
      getUsers();
    } catch (error) {
      console.log(error);
      alert("Delete Failed");
    }
  }

  return (
    <>
      <h1>Welcome To Home</h1>
      <button onClick={logout}>Logout</button>

      {/* Buttons */}
      <div className="top-buttons">

        <input
          type="number"
          placeholder="Enter ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />

        <button
          className="small-btn"
          onClick={getUsers}
        >
          Get Users
        </button>

        <button
          className="small-btn"
          onClick={searchUser}
        >
          Search User
        </button>

      </div>

      <br />
      <br />

      {/* Update Modal */}
      {showModal && (
        <div className="modal-overlay">

          <div className="modal-box">

            <h2>Update User</h2>

            <input
              type="text"
              placeholder="Enter Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <br />
            <br />

            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <br />
            <br />

            <button onClick={updateUser}>
              Save
            </button>

            <button
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>

          </div>

        </div>
      )}

      {/* Users Table */}
      <table border="1" cellPadding="10">

        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Update</th>
            <th>Delete</th>
          </tr>
        </thead>

        <tbody>

          {users.length > 0 ? (

            users.map((user) => (

              <tr key={user.id}>

                <td>
                  {user.id}
                </td>

                <td>
                  {user.name}
                </td>

                <td>
                  {user.email}
                </td>

                <td>

                  <button
                    onClick={() => editUser(user)}
                  >
                    Update
                  </button>

                </td>

                <td>

                  <button
                    className="delete-btn
                    "
                    onClick={() => deleteUser(user.id)}
                  >
                    Delete
                  </button>

                </td>

              </tr>

            ))

          ) : (

            <tr>

              <td colSpan="5">
                No users found
              </td>

            </tr>

          )}

        </tbody>

      </table>

    </>
  );
}

export default Home;